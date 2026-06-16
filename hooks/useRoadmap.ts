import { useProjectStore } from "@/store/project-store";
import { useRoadmapStore } from "@/store/roadmap-store";

export function useRoadmap() {
  const { workflow } = useProjectStore();
  const { selectedPhase, expandedItems, setSelectedPhase, toggleItem, expandAll, collapseAll } =
    useRoadmapStore();

  const roadmapContent = workflow.agents.manager?.result ?? (workflow.agents as any).roadmap?.result ?? "";

  const phases = [
    {
      id: "phase-1",
      phase: 1,
      title: "Research & Foundation",
      days: "Days 1–30",
      color: "#6c63ff",
      bg: "rgba(108,99,255,0.1)",
    },
    {
      id: "phase-2",
      phase: 2,
      title: "MVP Development",
      days: "Days 31–60",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.1)",
    },
    {
      id: "phase-3",
      phase: 3,
      title: "Launch Preparation",
      days: "Days 61–90",
      color: "#22c55e",
      bg: "rgba(34,197,94,0.1)",
    },
  ];

  return {
    roadmapContent,
    phases,
    selectedPhase,
    expandedItems,
    setSelectedPhase,
    toggleItem,
    expandAll,
    collapseAll,
    hasRoadmap: !!roadmapContent,
  };
}
