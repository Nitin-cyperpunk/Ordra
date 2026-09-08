export function mapInsightsError(error: unknown): string {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";

  if (message.includes("INSIGHTS_FORBIDDEN")) {
    return "You don’t have access to these insights.";
  }
  if (message.includes("INSIGHTS_BAD_RANGE")) {
    return "That date range isn’t valid. Please try again.";
  }
  return "We couldn’t load your analytics right now. Please try again.";
}
