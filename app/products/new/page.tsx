"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

export default function NewProductPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [description, setDescription] = useState("");
  const [unit, setUnit] = useState("ชิ้น");
  const [costPrice, setCostPrice] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [stock, setStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          sku,
          description,
          unit,
          costPrice,
          salePrice,
          stock,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "เพิ่มสินค้าไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/products");
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
            href="/products"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าสินค้า
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">เพิ่มสินค้า</h1>
          <p className="mt-1 text-sm text-gray-500">
            กรอกข้อมูลสินค้า ต้นทุน ราคาขาย และจำนวนสต๊อก
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
                ชื่อสินค้า *
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น เสื้อยืดสีขาว"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                รหัสสินค้า / SKU
              </label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="เช่น SKU-001"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                หน่วย
              </label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="ชิ้น / กล่อง / แพ็ค"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                ต้นทุนต่อหน่วย
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                ราคาขายต่อหน่วย
              </label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                จำนวนสต๊อก
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                รายละเอียดสินค้า
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="รายละเอียดเพิ่มเติม"
                rows={4}
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Link
              href="/products"
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
              {loading ? "กำลังบันทึก..." : "บันทึกสินค้า"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}