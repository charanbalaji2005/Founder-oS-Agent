/**
 * Date and string formatting utilities
 */

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(isoString);
}

export function truncateTitle(title: string, maxLength = 50): string {
  if (title.length <= maxLength) return title;
  return title.slice(0, maxLength).trim() + "...";
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatModelName(modelId: string): string {
  if (modelId.includes("qwen")) return "Qwen3-32B";
  if (modelId.includes("deepseek")) return "DeepSeek-R1-70B";
  return modelId;
}

export function maskApiKey(key: string): string {
  if (key.length < 10) return "••••••••";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
