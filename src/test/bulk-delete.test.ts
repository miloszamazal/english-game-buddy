import { describe, expect, it, vi } from "vitest";
import { bulkDeleteSchema, deleteSelectedQuestions } from "@/lib/bulk-delete";

describe("bulk question deletion", () => {
  it("accepts the 200 accidentally imported question IDs", () => {
    const ids = Array.from({ length: 200 }, (_, i) => i + 201);
    expect(bulkDeleteSchema.parse({ password: "test", subject: "en", ids }).ids).toEqual(ids);
  });
  it("rejects deletion without selected IDs", () => {
    expect(bulkDeleteSchema.safeParse({ password: "test", subject: "en", ids: [] }).success).toBe(false);
  });
  it("deletes only the selected IDs in the selected subject and reports actual count", async () => {
    const select = vi.fn().mockResolvedValue({ data: [{ id: 201 }, { id: 202 }], error: null });
    const inIds = vi.fn().mockReturnValue({ select });
    const eq = vi.fn().mockReturnValue({ in: inIds });
    const remove = vi.fn().mockReturnValue({ eq });
    const from = vi.fn().mockReturnValue({ delete: remove });
    expect(await deleteSelectedQuestions({ from }, "en", [201, 202, 201])).toEqual({ deleted: 2 });
    expect(from).toHaveBeenCalledWith("questions");
    expect(eq).toHaveBeenCalledWith("subject", "en");
    expect(inIds).toHaveBeenCalledWith("id", [201, 202]);
  });
  it("surfaces database failures instead of reporting success", async () => {
    const select = vi.fn().mockResolvedValue({ data: null, error: { message: "Denied" } });
    const from = vi.fn().mockReturnValue({ delete: () => ({ eq: () => ({ in: () => ({ select }) }) }) });
    await expect(deleteSelectedQuestions({ from }, "math", [201])).rejects.toThrow("Denied");
  });
});