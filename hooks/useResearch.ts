import { useProjectStore } from "@/store/project-store";

export function useFounder() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.founder.result ?? "",
    status: workflow.agents.founder.status,
    error: workflow.agents.founder.error,
    hasData: !!workflow.agents.founder.result,
  };
}

export function useCEO() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.ceo.result ?? "",
    status: workflow.agents.ceo.status,
    error: workflow.agents.ceo.error,
    hasData: !!workflow.agents.ceo.result,
  };
}

export function useResearch() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.research.result ?? "",
    status: workflow.agents.research.status,
    error: workflow.agents.research.error,
    hasData: !!workflow.agents.research.result,
  };
}

export function useCoding() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.coding.result ?? "",
    status: workflow.agents.coding.status,
    error: workflow.agents.coding.error,
    hasData: !!workflow.agents.coding.result,
  };
}

export function useMarketing() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.marketing.result ?? "",
    status: workflow.agents.marketing.status,
    error: workflow.agents.marketing.error,
    hasData: !!workflow.agents.marketing.result,
  };
}

export function useManager() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.manager.result ?? "",
    status: workflow.agents.manager.status,
    error: workflow.agents.manager.error,
    hasData: !!workflow.agents.manager.result,
  };
}

export function useEmployee() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.employee.result ?? "",
    status: workflow.agents.employee.status,
    error: workflow.agents.employee.error,
    hasData: !!workflow.agents.employee.result,
  };
}

export function useCustomerService() {
  const { workflow } = useProjectStore();
  return {
    content: workflow.agents.customer_service.result ?? "",
    status: workflow.agents.customer_service.status,
    error: workflow.agents.customer_service.error,
    hasData: !!workflow.agents.customer_service.result,
  };
}

// Keep legacy names as fallbacks to ensure zero compile issues
export const useCompetitors = useCEO;
export const useMVP = useCoding;
export const useLaunch = useCustomerService;
