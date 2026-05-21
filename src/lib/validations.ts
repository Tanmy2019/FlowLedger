import { z } from "zod";

export const transactionSchema = z.object({
  type: z.enum(["expense", "income", "transfer"]),
  amount: z.number().positive("金额必须大于0"),
  date: z.string(),
  note: z.string().optional(),
  categoryId: z.string().optional(),
  accountId: z.string().optional(),
  toAccountId: z.string().optional(),
  memberId: z.string().optional(),
  merchant: z.string().optional(),
  project: z.string().optional(),
  tagIds: z.array(z.string()).optional(),
});
