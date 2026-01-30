import { z } from "zod";

export const StockListQuerySchema = z.object({
  zone: z.string().optional()
});

export const StockListOutputSchema = z.object({
  items: z.array(
    z.object({
      mirrorId: z.string().min(1),
      status: z.string().min(1)
    })
  )
});

export const StockAdjustInputSchema = z.object({
  mirrorId: z.string().min(1),
  status: z.string().min(1),
  reason: z.string().min(1)
});

export const StockAdjustOutputSchema = z.object({
  adjustmentId: z.string().min(1),
  status: z.string().min(1)
});

export type StockListQuery = z.infer<typeof StockListQuerySchema>;
export type StockListOutput = z.infer<typeof StockListOutputSchema>;
export type StockAdjustInput = z.infer<typeof StockAdjustInputSchema>;
export type StockAdjustOutput = z.infer<typeof StockAdjustOutputSchema>;
