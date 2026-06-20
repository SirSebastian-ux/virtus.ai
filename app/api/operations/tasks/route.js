import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

function cleanText(value) {
  return String(value || "").trim();
}

async function requireWorkspaceMember(admin, userId, workspaceId) {
  const { data, error } = await admin
    .from("workspace_members")
    .select("role, status")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function GET(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ tasks: [] }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const workspaceId = cleanText(searchParams.get("workspaceId"));

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required." },
        { status: 400 }
      );
    }

    const membership = await requireWorkspaceMember(admin, user.id, workspaceId);

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const { data, error } = await admin
      .from("operations_tasks")
      .select(
        `
        id,
        workspace_id,
        department_id,
        assigned_employee_id,
        title,
        description,
        status,
        priority,
        due_date,
        source_report_id,
        created_at,
        updated_at,
        departments (
          id,
          name
        ),
        employees (
          id,
          full_name,
          email
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      tasks: (data || []).map((task) => ({
        id: task.id,
        workspaceId: task.workspace_id,
        departmentId: task.department_id,
        departmentName: task.departments?.name || null,
        assignedEmployeeId: task.assigned_employee_id,
        assignedEmployeeName: task.employees?.full_name || null,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        sourceReportId: task.source_report_id,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const supabase = await createClient();
    const admin = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const taskId = cleanText(body?.taskId);
    const status = cleanText(body?.status);

    if (!taskId || !status) {
      return NextResponse.json(
        { error: "taskId and status are required." },
        { status: 400 }
      );
    }

    const { data: existingTask, error: existingError } = await admin
      .from("operations_tasks")
      .select("id, workspace_id, status")
      .eq("id", taskId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    const membership = await requireWorkspaceMember(
      admin,
      user.id,
      existingTask.workspace_id
    );

    if (!membership) {
      return NextResponse.json({ error: "Workspace access denied." }, { status: 403 });
    }

    const { data: updatedTask, error: updateError } = await admin
      .from("operations_tasks")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select("id, workspace_id, status, updated_at")
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    await admin.from("operations_activity_logs").insert({
      workspace_id: existingTask.workspace_id,
      actor_user_id: user.id,
      action: "operations_task.status_updated",
      entity_table: "operations_tasks",
      entity_id: taskId,
      previous_data: {
        status: existingTask.status,
      },
      new_data: {
        status,
      },
      metadata: {
        source: "operations_tasks_api",
      },
    });

    return NextResponse.json({
      ok: true,
      task: {
        id: updatedTask.id,
        workspaceId: updatedTask.workspace_id,
        status: updatedTask.status,
        updatedAt: updatedTask.updated_at,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
