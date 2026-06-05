"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

export default function NewCustomerPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          address,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "เพิ่มลูกค้าไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/customers");
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
            href="/customers"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าลูกค้า
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">เพิ่มลูกค้า</h1>
          <p className="mt-1 text-sm text-gray-500">
            กรอกข้อมูลลูกค้าเพื่อใช้ในใบส่งสินค้า ใบแจ้งหนี้ และใบเสร็จ
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
                ชื่อลูกค้า / บริษัท *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น บริษัท ตัวอย่าง จำกัด"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                เบอร์โทร
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 0999999999"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="customer@email.com"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                ที่อยู่
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ที่อยู่สำหรับออกเอกสาร / ส่งสินค้า"
                rows={4}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Link
              href="/customers"
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
              {loading ? "กำลังบันทึก..." : "บันทึกลูกค้า"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}