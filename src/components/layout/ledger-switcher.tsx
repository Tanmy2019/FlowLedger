"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Ledger {
  id: string;
  name: string;
  type: string;
  color: string;
}

export function LedgerSwitcher() {
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [value, setValue] = useState("");

  useEffect(() => {
    fetch("/api/ledgers")
      .then((res) => res.json())
      .then((data: Ledger[]) => {
        setLedgers(data);
        const stored = localStorage.getItem("activeLedgerId");
        if (stored && data.some((l) => l.id === stored)) {
          setValue(stored);
        } else if (data.length > 0) {
          setValue(data[0].id);
        }
      });
  }, []);

  const handleChange = (newValue: string | null) => {
    if (!newValue) return;
    setValue(newValue);
    localStorage.setItem("activeLedgerId", newValue);
    window.location.reload();
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="选择账本">
          {(value: string | null) => {
            if (!value) return null;
            const ledger = ledgers.find((l) => l.id === value);
            return ledger ? ledger.name : value;
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ledgers.map((ledger) => (
          <SelectItem key={ledger.id} value={ledger.id}>
            <span
              className="inline-block size-2 shrink-0 rounded-full"
              style={{ backgroundColor: ledger.color }}
            />
            {ledger.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
