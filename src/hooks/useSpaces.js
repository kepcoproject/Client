import { useQuery } from "@tanstack/react-query";
import { getSpaces } from "../api/spaces";

export function useSpaces(filters) {
  return useQuery({
    queryKey: ["spaces", filters],
    queryFn: () => getSpaces(filters),
  });
}
