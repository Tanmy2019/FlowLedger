import { describe, it, expect } from "vitest";
import {
  validateImportTransaction,
  ImportTransaction,
} from "@/lib/import-validation";

describe("validateImportTransaction", () => {
  const validTx: ImportTransaction = {
    type: "expense",
    amount: 100,
    date: "2024-01-15",
  };

  describe("金额校验", () => {
    it("拒绝 NaN 金额", () => {
      const result = validateImportTransaction({ ...validTx, amount: NaN });
      expect(result.success).toBe(false);
      expect(result.error).toContain("金额");
    });

    it("拒绝零金额", () => {
      const result = validateImportTransaction({ ...validTx, amount: 0 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("金额");
    });

    it("拒绝负金额", () => {
      const result = validateImportTransaction({ ...validTx, amount: -50 });
      expect(result.success).toBe(false);
      expect(result.error).toContain("金额");
    });

    it("接受正金额", () => {
      const result = validateImportTransaction({ ...validTx, amount: 0.01 });
      expect(result.success).toBe(true);
    });
  });

  describe("类型校验", () => {
    it("拒绝无效的交易类型", () => {
      const result = validateImportTransaction({
        ...validTx,
        type: "invalid",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("类型");
    });

    it("接受 expense 类型", () => {
      const result = validateImportTransaction({ ...validTx, type: "expense" });
      expect(result.success).toBe(true);
    });

    it("接受 income 类型", () => {
      const result = validateImportTransaction({ ...validTx, type: "income" });
      expect(result.success).toBe(true);
    });

    it("接受 transfer 类型", () => {
      const result = validateImportTransaction({
        ...validTx,
        type: "transfer",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("日期校验", () => {
    it("拒绝空日期", () => {
      const result = validateImportTransaction({ ...validTx, date: "" });
      expect(result.success).toBe(false);
      expect(result.error).toContain("日期");
    });

    it("拒绝无效日期字符串", () => {
      const result = validateImportTransaction({
        ...validTx,
        date: "not-a-date",
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("日期");
    });

    it("接受有效日期 YYYY-MM-DD", () => {
      const result = validateImportTransaction({
        ...validTx,
        date: "2024-06-15",
      });
      expect(result.success).toBe(true);
    });

    it("接受有效日期 YYYY/MM/DD", () => {
      const result = validateImportTransaction({
        ...validTx,
        date: "2024/06/15",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("缺少必填字段", () => {
    it("拒绝缺少 type", () => {
      const { type, ...noType } = validTx;
      const result = validateImportTransaction(noType as ImportTransaction);
      expect(result.success).toBe(false);
    });

    it("拒绝缺少 amount", () => {
      const { amount, ...noAmount } = validTx;
      const result = validateImportTransaction(
        noAmount as ImportTransaction
      );
      expect(result.success).toBe(false);
    });

    it("拒绝缺少 date", () => {
      const { date, ...noDate } = validTx;
      const result = validateImportTransaction(noDate as ImportTransaction);
      expect(result.success).toBe(false);
    });
  });
});
