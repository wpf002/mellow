import { z } from "zod";

/** Standard cursor pagination query. Every list endpoint uses this. */
export const cursorQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type CursorQuery = z.infer<typeof cursorQuerySchema>;

/** Shape of a cursor-paginated response. */
export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}
