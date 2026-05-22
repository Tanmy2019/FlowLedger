"use client";

import { useState, useRef } from "react";
import { getActiveLedgerId } from "@/lib/ledger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, FileSpreadsheet } from "lucide-react";
import { parseCSV } from "@/lib/csv";

export default function ImportSettingsPage() {
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [dateIndex, setDateIndex] = useState(0);
  const [amountIndex, setAmountIndex] = useState(1);
  const [noteIndex, setNoteIndex] = useState(2);
  const [typeIndex, setTypeIndex] = useState(-1);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      // Auto-detect encoding: try UTF-8 first, fall back to GBK for Chinese Excel exports
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(arrayBuffer);
      } catch {
        text = new TextDecoder("gbk").decode(arrayBuffer);
      }
      const { headers: parsedHeaders, rows: parsedData } = parseCSV(text);

      if (parsedHeaders.length === 0) {
        toast("CSV 文件格式错误");
        return;
      }

      setHeaders(parsedHeaders);
      setCsvData(parsedData);

      // Auto-detect columns
      const dateIdx = parsedHeaders.findIndex(
        (h) =>
          h.includes("日期") ||
          h.includes("date") ||
          h.includes("时间") ||
          h.includes("time")
      );
      const amountIdx = parsedHeaders.findIndex(
        (h) =>
          h.includes("金额") ||
          h.includes("amount") ||
          h.includes("amt")
      );
      const noteIdx = parsedHeaders.findIndex(
        (h) =>
          h.includes("备注") ||
          h.includes("note") ||
          h.includes("描述") ||
          h.includes("description")
      );
      const typeIdx = parsedHeaders.findIndex(
        (h) =>
          h.includes("类型") ||
          h.includes("type") ||
          h.includes("类别")
      );

      if (dateIdx >= 0) setDateIndex(dateIdx);
      if (amountIdx >= 0) setAmountIndex(amountIdx);
      if (noteIdx >= 0) setNoteIndex(noteIdx);
      if (typeIdx >= 0) setTypeIndex(typeIdx);

      toast(`已读取 ${parsedData.length} 条记录`);
    };
    reader.readAsArrayBuffer(file);
  };

  const getPreviewData = () => {
    return csvData.slice(0, 5);
  };

  function parseDateValue(raw: string): string {
    const s = raw.trim();
    if (!s) return new Date().toISOString().split("T")[0];

    // YYYY-MM-DD / YYYY/MM/DD (support non-zero-padded, optional time part)
    const dateMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (dateMatch) {
      return `${dateMatch[1]}-${String(dateMatch[2]).padStart(2, "0")}-${String(dateMatch[3]).padStart(2, "0")}`;
    }

    // Chinese date format: 2024年1月15日 / 2024年01月15日
    if (/^\d{4}年\d{1,2}月\d{1,2}日?$/.test(s)) {
      const m = s.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日?$/);
      if (m) return `${m[1]}-${String(m[2]).padStart(2, "0")}-${String(m[3]).padStart(2, "0")}`;
    }

    // Try JS Date parsing for other formats
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }

    return new Date().toISOString().split("T")[0];
  }

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast("请先选择 CSV 文件");
      return;
    }

    setImporting(true);
    setImportErrors([]);

    const errors: string[] = [];
    const transactions = csvData.map((row) => {
      let type = "expense";
      const typeRaw = typeIndex >= 0 ? row[typeIndex]?.toLowerCase() : "";
      if (typeRaw.includes("收入") || typeRaw.includes("income")) {
        type = "income";
      } else if (typeRaw.includes("转账") || typeRaw.includes("transfer")) {
        type = "transfer";
      }

      const amount = parseFloat(row[amountIndex]?.replace(/[¥$,]/g, "") || "0");

      const date = parseDateValue(row[dateIndex] || "");

      return {
        type,
        amount: Math.abs(amount),
        date,
        note: noteIndex >= 0 ? row[noteIndex] || null : null,
      };
    });

    try {
      const ledgerId = getActiveLedgerId();

      if (!ledgerId) {
        toast("未找到账本");
        setImporting(false);
        return;
      }

      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ledgerId, transactions }),
      });

      if (!res.ok) throw new Error("Import failed");

      const result = await res.json();
      const msg = `导入完成：成功 ${result.successCount} 条，失败 ${result.failedCount} 条`;
      if (result.errors && result.errors.length > 0) {
        setImportErrors(result.errors);
        toast(msg);
      } else {
        toast(msg);
        setCsvData([]);
        setHeaders([]);
      }
    } catch {
      toast("导入失败");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">数据导入</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="size-4" />
            导入 CSV
          </CardTitle>
          <CardDescription>
            选择 CSV 文件，配置列映射，然后导入交易记录
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileChange}
            />
          </div>

          {headers.length > 0 && (
            <>
              {/* Column mapping */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">日期列</label>
                  <Select
                    value={String(dateIndex)}
                    onValueChange={(v) => setDateIndex(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>
                      {(value: string | null) => {
                        if (!value) return null;
                        return headers[parseInt(value, 10)] || value;
                      }}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          <span className="truncate">{h}</span>
                          {csvData.length > 0 && (
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                              {csvData[0][i]?.substring(0, 20)}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">金额列</label>
                  <Select
                    value={String(amountIndex)}
                    onValueChange={(v) => setAmountIndex(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>
                      {(value: string | null) => {
                        if (!value) return null;
                        return headers[parseInt(value, 10)] || value;
                      }}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          <span className="truncate">{h}</span>
                          {csvData.length > 0 && (
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                              {csvData[0][i]?.substring(0, 20)}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">备注列</label>
                  <Select
                    value={String(noteIndex)}
                    onValueChange={(v) => setNoteIndex(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>
                      {(value: string | null) => {
                        if (!value) return null;
                        return headers[parseInt(value, 10)] || value;
                      }}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          <span className="truncate">{h}</span>
                          {csvData.length > 0 && (
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                              {csvData[0][i]?.substring(0, 20)}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">类型列（可选）</label>
                  <Select
                    value={String(typeIndex)}
                    onValueChange={(v) => setTypeIndex(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue>
                      {(value: string | null) => {
                        if (!value || value === "-1") return null;
                        return headers[parseInt(value, 10)] || value;
                      }}
                    </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="-1">无</SelectItem>
                      {headers.map((h, i) => (
                        <SelectItem key={i} value={String(i)}>
                          <span className="truncate">{h}</span>
                          {csvData.length > 0 && (
                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                              {csvData[0][i]?.substring(0, 20)}
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Preview */}
              <div>
                <p className="mb-2 text-sm font-medium">
                  预览（前 5 行，共 {csvData.length} 行）
                </p>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((h, i) => (
                          <TableHead key={i} className="whitespace-nowrap">
                            {h}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getPreviewData().map((row, ri) => (
                        <TableRow key={ri}>
                          {row.map((cell, ci) => (
                            <TableCell key={ci} className="max-w-40 truncate">
                              {cell}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <Button onClick={handleImport} disabled={importing}>
                {importing ? "导入中..." : "开始导入"}
              </Button>

              {importErrors.length > 0 && (
                <div className="rounded-md border border-red-200 bg-red-50 p-3">
                  <p className="mb-1 text-sm font-medium text-red-700">导入失败详情：</p>
                  <ul className="list-inside list-disc space-y-0.5 text-xs text-red-600">
                    {importErrors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {headers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileSpreadsheet className="mb-2 size-10" />
              <p className="text-sm">选择 CSV 文件开始导入</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
