export interface ImportTransaction {
  type: string;
  amount: number;
  date: string;
  note?: string | null;
  categoryId?: string | null;
  accountId?: string | null;
  toAccountId?: string | null;
  merchant?: string | null;
}

export interface ValidationResult {
  success: boolean;
  error?: string;
}

const VALID_TYPES = ["expense", "income", "transfer"] as const;
const MAX_AMOUNT = 1_000_000_000_000; // 1 万亿上限，防止导入损坏数据

export function validateImportTransaction(
  tx: ImportTransaction
): ValidationResult {
  if (!tx.type || !VALID_TYPES.includes(tx.type as any)) {
    return { success: false, error: "无效的交易类型" };
  }

  if (typeof tx.amount !== "number" || !isFinite(tx.amount) || tx.amount <= 0 || tx.amount > MAX_AMOUNT) {
    return { success: false, error: "金额必须为正数且不超过 1 万亿" };
  }

  if (!tx.date) {
    return { success: false, error: "日期不能为空" };
  }

  const parsed = new Date(tx.date);
  if (isNaN(parsed.getTime())) {
    return { success: false, error: "日期格式无效" };
  }

  return { success: true };
}
