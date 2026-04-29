import { virtusModules } from "@/data/virtus-modules";

export async function GET() {
  return Response.json({
    success: true,
    count: virtusModules.length,
    modules: virtusModules.map((module) => ({
      id: module.id,
      order: module.order,
      title: module.title,
      displayTitle: module.displayTitle,
      duration: module.duration,
      coreSkill: module.coreSkill,
      rewardVp: module.rewardVp,
      badge: module.badge,
    })),
  });
}