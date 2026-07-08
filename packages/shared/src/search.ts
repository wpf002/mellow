import { z } from "zod";
import { prayerAuthorSchema } from "./prayer.js";

// ---------------------------------------------------------------------------
// Global search across the four pillars (visibility-respecting on the server).
// ---------------------------------------------------------------------------

const hit = z.object({ id: z.string(), title: z.string(), subtitle: z.string() });
export type SearchHit = z.infer<typeof hit>;

export const searchResultsSchema = z.object({
  query: z.string(),
  people: z.array(prayerAuthorSchema),
  prayers: z.array(hit),
  posts: z.array(hit),
  jobs: z.array(hit),
  courses: z.array(hit),
});
export type SearchResults = z.infer<typeof searchResultsSchema>;
