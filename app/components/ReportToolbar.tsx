"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Download, Printer, Search } from "lucide-react";

type Props = {
  report: string;
  title?: string;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function currentYear() {
  return String(new Date().getFullYear());
}

export default function ReportToolbar({ report, title = "รายงาน" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState("day");
  const [day, setDay] = useState(today());
  const [month, setMonth] = useState(currentMonth());
  const [year, setYear] = useState(currentYear());
  const [from, setFrom] = useState(searchParams.get("from") || "");
  const [to, setTo] = useState(searchParams.get("to") || "");

  const range = useMemo(() => {
    if (mode === "day") {
      return {
        from: day,
        to: day,
      };
    }

    if (mode === "month") {
      const [y, m] = month.split("-");
      const lastDay = new Date(Number(y), Number(m), 0).getDate();

      return {
        from: `${month}-01`,
        to: `${month}-${String(lastDay).padStart(2, "0")}`,
      };
    }

    if (mode === "year") {
      return {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      };
    }

    return {
      from,
      to,
    };
  }, [mode, day, month, year, from, to]);

  function applyFilter() {
    const params = new URLSearchParams();

    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);

    router.push(`${pathname}?${params.toString()}`);
    router.refresh();
  }

  function printPage() {
    window.print();
  }

  function exportExcel() {
    const params = new URLSearchParams();

    params.set("report", report);

    if (range.from) params.set("from", range.from);
    if (range.to) params.set("to", range.to);

    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  }

  return (
    <div className="no-print mb-6 rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          เลือกช่วงรายงาน แล้วกดดูรายงาน / Print / Export Excel
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[180px_1fr_auto_auto_auto] lg:items-end">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            รูปแบบรายงาน
          </label>

          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
          >
            <option value="day">รายวัน</option>
            <option value="month">รายเดือน</option>
            <option value="year">รายปี</option>
            <option value="custom">กำหนดเอง</option>
          </select>
        </div>

        <div>
          {mode === "day" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                วันที่
              </label>
              <input
                type="date"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </>
          )}

          {mode === "month" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                เดือน
              </label>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </>
          )}

          {mode === "year" && (
            <>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                ปี ค.ศ.
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </>
          )}

          {mode === "custom" && (
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  จากวันที่
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  ถึงวันที่
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={applyFilter}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
        >
          <Search size={18} />
          ดูรายงาน
        </button>

        <button
          type="button"
          onClick={printPage}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <Printer size={18} />
          Print
        </button>

        <button
          type="button"
          onClick={exportExcel}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-green-700 px-5 py-3 text-sm font-semibold text-white hover:bg-green-800"
        >
          <Download size={18} />
          Excel
        </button>
      </div>
    </div>
  );
}