"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  unit: string | null;
  costPrice: number;
  salePrice: number;
};

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type InvoiceItem = {
  productId: string;
  quantity: string;
  note: string;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

export default function NewInvoicePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [note, setNote] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: "",
      quantity: "1",
      note: "",
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        setCustomers(customersData);
        setProducts(productsData);
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูลลูกค้า/สินค้าไม่สำเร็จ");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  function addItem() {
    setItems([
      ...items,
      {
        productId: "",
        quantity: "1",
        note: "",
      },
    ]);
  }

  function removeItem(index: number) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string) {
    const nextItems = [...items];
    nextItems[index][field] = value;
    setItems(nextItems);
  }

  function getProduct(productId: string) {
    return products.find((product) => String(product.id) === productId);
  }

  const summary = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const product = getProduct(item.productId);
      const quantity = Number(item.quantity || 0);

      if (!product || quantity <= 0) return sum;

      return sum + product.salePrice * quantity;
    }, 0);

    const discountValue = Number(discount || 0);
    const vatValue = Number(vat || 0);
    const paidValue = Number(paidAmount || 0);

    const totalAmount = subtotal - discountValue + vatValue;
    const balanceDue = totalAmount - paidValue;

    return {
      subtotal,
      discountValue,
      vatValue,
      paidValue,
      totalAmount,
      balanceDue,
    };
  }, [items, products, discount, vat, paidAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanItems = items.filter(
      (item) => item.productId && Number(item.quantity) > 0
    );

    if (cleanItems.length === 0) {
      setError("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId || null,
          discount,
          vat,
          paidAmount,
          note,
          items: cleanItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "สร้างใบแจ้งหนี้ไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/invoice");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <Link
            href="/invoice"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าใบแจ้งหนี้
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            สร้างใบแจ้งหนี้
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            เลือกลูกค้า สินค้า และระบุยอดชำระ เพื่อคำนวณยอดค้างชำระ
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

          {loadingData ? (
            <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-500">
              กำลังโหลดข้อมูล...
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ลูกค้า
                  </label>

                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">ไม่ระบุลูกค้า</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    หมายเหตุ
                  </label>

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น เครดิต 30 วัน"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    รายการสินค้า
                  </h2>

                  <button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={16} />
                    เพิ่มรายการ
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => {
                    const selectedProduct = getProduct(item.productId);
                    const quantity = Number(item.quantity || 0);
                    const lineTotal = selectedProduct
                      ? selectedProduct.salePrice * quantity
                      : 0;

                    return (
                      <div
                        key={index}
                        className="rounded-3xl border bg-gray-50 p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-[1fr_120px_140px_1fr_50px]">
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              สินค้า
                            </label>

                            <select
                              value={item.productId}
                              onChange={(e) =>
                                updateItem(index, "productId", e.target.value)
                              }
                              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            >
                              <option value="">เลือกสินค้า</option>
                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.sku ? `${product.sku} - ` : ""}
                                  {product.name} / {money(product.salePrice)}
                                </option>
                              ))}
                            </select>

                            {selectedProduct && (
                              <p className="mt-2 text-xs text-gray-500">
                                ต้นทุน {money(selectedProduct.costPrice)} |
                                ราคาขาย {money(selectedProduct.salePrice)}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              จำนวน
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(index, "quantity", e.target.value)
                              }
                              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              รวม
                            </label>

                            <div className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-gray-900">
                              {money(lineTotal)}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              หมายเหตุ
                            </label>

                            <input
                              value={item.note}
                              onChange={(e) =>
                                updateItem(index, "note", e.target.value)
                              }
                              placeholder="หมายเหตุรายการ"
                              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            />
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              disabled={items.length === 1}
                              className="flex h-11 w-11 items-center justify-center rounded-2xl border text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <div className="rounded-3xl bg-gray-50 p-5">
                  <h3 className="mb-4 font-bold text-gray-900">
                    ส่วนลด / VAT / ชำระแล้ว
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        ส่วนลด
                      </label>
                      <input
                        type="number"
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        VAT / ภาษี
                      </label>
                      <input
                        type="number"
                        value={vat}
                        onChange={(e) => setVat(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">
                        ยอดชำระแล้ว
                      </label>
                      <input
                        type="number"
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-gray-900 p-5 text-white">
                  <h3 className="mb-4 font-bold">สรุปยอด</h3>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-300">ยอดสินค้า</span>
                      <span>{money(summary.subtotal)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-300">ส่วนลด</span>
                      <span>- {money(summary.discountValue)}</span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-300">VAT / ภาษี</span>
                      <span>{money(summary.vatValue)}</span>
                    </div>

                    <div className="border-t border-white/20 pt-3 flex justify-between text-lg font-bold">
                      <span>ยอดสุทธิ</span>
                      <span>{money(summary.totalAmount)}</span>
                    </div>

                    <div className="flex justify-between text-green-300">
                      <span>ชำระแล้ว</span>
                      <span>{money(summary.paidValue)}</span>
                    </div>

                    <div className="flex justify-between text-red-300">
                      <span>ค้างชำระ</span>
                      <span>{money(summary.balanceDue)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Link
                  href="/invoice"
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
                  {loading ? "กำลังบันทึก..." : "บันทึกใบแจ้งหนี้"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}