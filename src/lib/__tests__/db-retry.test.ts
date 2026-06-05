import { describe, expect, it, vi } from "vitest";

import { withRetry } from "@/lib/db-retry";

describe("withRetry", () => {
  it("retorna el valor en el primer intento exitoso", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    await expect(withRetry(fn, { label: "test" })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("reintenta y resuelve en el segundo intento si el error es retryable", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockResolvedValueOnce("ok");
    await expect(withRetry(fn, { label: "test" })).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("lanza el error si todos los intentos fallan", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "ETIMEDOUT" });
    await expect(withRetry(fn, { label: "test", attempts: 2, delays: [0, 0] })).rejects.toEqual({ code: "ETIMEDOUT" });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("no reintenta si el error no es retryable", async () => {
    const fn = vi.fn().mockRejectedValue({ code: "P2025" });
    await expect(withRetry(fn, { label: "test" })).rejects.toEqual({ code: "P2025" });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("llama onRetry antes de cada reintento", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockRejectedValueOnce({ code: "ETIMEDOUT" })
      .mockResolvedValueOnce("ok");
    const onRetry = vi.fn();
    await expect(withRetry(fn, { label: "test", onRetry, delays: [0, 0] })).resolves.toBe("ok");
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, { attempt: 1, code: "ETIMEDOUT", delayMs: 0 });
    expect(onRetry).toHaveBeenNthCalledWith(2, { attempt: 2, code: "ETIMEDOUT", delayMs: 0 });
  });
});
