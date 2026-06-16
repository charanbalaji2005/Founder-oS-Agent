import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useProjectStore } from "@/store/project-store";
import type { FullProject } from "@/types";

export const PROJECT_KEYS = {
  all: ["projects"] as const,
  detail: (id: string) => ["projects", id] as const,
};

export function useProjects() {
  const { projects } = useProjectStore();

  return useQuery({
    queryKey: PROJECT_KEYS.all,
    queryFn: () => projects,
    initialData: projects,
    staleTime: 0,
  });
}

export function useProject(id: string) {
  const { projects } = useProjectStore();

  return useQuery({
    queryKey: PROJECT_KEYS.detail(id),
    queryFn: () => projects.find((p) => p.id === id) ?? null,
    initialData: () => projects.find((p) => p.id === id) ?? null,
    enabled: !!id,
  });
}

export function useDeleteProject() {
  const { deleteProject } = useProjectStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      deleteProject(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}

export function useUpdateProject() {
  const { updateProject } = useProjectStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<FullProject>;
    }) => {
      updateProject(id, updates);
      return { id, updates };
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: PROJECT_KEYS.all });
    },
  });
}
