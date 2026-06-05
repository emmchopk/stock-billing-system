"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

export default function NewExpensePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          amount,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "เพิ่มรายจ่ายไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/expenses");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <Link
            href="/expenses"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้ารายจ่าย
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">เพิ่มรายจ่าย</h1>
          <p className="mt-1 text-sm text-gray-500">
            บันทึกรายจ่ายเพื่อใช้คำนวณกำไรสุทธิใน Dashboard
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white p-6 shadow-sm"
        >
          {error && (
            <div className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                ชื่อรายการ *
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ค่าขนส่งสินค้า"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                ประเภท
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              >
                <option value="PRODUCT_COST">ต้นทุนสินค้า</option>
                <option value="SHIPPING">ค่าขนส่ง</option>
                <option value="PACKAGING">แพ็กเกจจิ้ง</option>
                <option value="SALARY">เงินเดือน</option>
                <option value="RENT">ค่าเช่า</option>
                <option value="MARKETING">การตลาด</option>
                <option value="OTHER">อื่น ๆ</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                จำนวนเงิน *
              </label>

              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                หมายเหตุ
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Link
              href="/expenses"
              className="rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              ยกเลิก
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={18} />
              {loading ? "กำลังบันทึก..." : "บันทึกรายจ่าย"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}