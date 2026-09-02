import { useQuery } from "@tanstack/react-query";
import { getRecommendations } from "../api/recommendations";

export function useRecommendations() {
  return useQuery({
    queryKey: ["recommendations"],
    queryFn: getRecommendations,
  });
}
