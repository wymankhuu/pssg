import { StandardCategory } from "@/data/standards";

// This is a simple hook to get standards data - in a real app this would
// call an API but for now we'll use the mock data from standards.ts
export function getStandardsForGrade(gradeId: string): Promise<StandardCategory[]> {
  return fetch(`/api/standards/${gradeId}`)
    .then(res => {
      if (!res.ok) {
        throw new Error("Failed to fetch standards");
      }
      return res.json();
    });
}
