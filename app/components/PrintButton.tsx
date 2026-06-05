"use client";

import { Printer } from "lucide-react";

type Props = {
  label?: string;
};

export default function PrintButton({ label = "Print" }: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
    >
      <Printer size={18} />
      {label}
    </button>
  );
}