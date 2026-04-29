import { virtusModules } from "@/data/virtus-modules";

export async function GET(request, context) {
  const params = await context.params;

  const moduleId = params.moduleId;
  const dayNumber = Number(params.dayNumber);

  const selectedModule = virtusModules.find(
    (module) => module.id === moduleId
  );

  if (!selectedModule) {
    return Response.json(
      {
        success: false,
        error: "Module not found",
      },
      { status: 404 }
    );
  }

  if (!Number.isInteger(dayNumber)) {
    return Response.json(
      {
        success: false,
        error: "Invalid day number",
      },
      { status: 400 }
    );
  }

  const selectedDay = selectedModule.days?.find(
    (day) => day.day === dayNumber
  );

  if (!selectedDay) {
    return Response.json(
      {
        success: false,
        error: "Day not found",
      },
      { status: 404 }
    );
  }

  return Response.json({
    success: true,
    module: {
      id: selectedModule.id,
      order: selectedModule.order,
      title: selectedModule.title,
      displayTitle: selectedModule.displayTitle,
      duration: selectedModule.duration,
      coreSkill: selectedModule.coreSkill,
      rewardVp: selectedModule.rewardVp,
      badge: selectedModule.badge,
    },
    day: selectedDay,
  });
}