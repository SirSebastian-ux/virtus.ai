import { virtusModules } from "@/data/virtus-modules";

export async function GET(request, context) {
  const params = await context.params;
  const moduleId = params.moduleId;

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

  return Response.json({
    success: true,
    module: selectedModule,
  });
}