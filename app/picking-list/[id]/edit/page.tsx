"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

type Product = {
  id: number;
  name: string;
  sku: string | null;
  stock: number;
  unit: string | null;
};

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type PickingItem = {
  productId: string;
  quantity: string;
  note: string;
};

type PickingListResponse = {
  id: number;
  documentNo: string;
  customerId: number | null;
  status: string;
  note: string | null;
  items: {
    id: number;
    productId: number;
    quantity: number;
    note: string | null;
    product: Product;
  }[];
};

export default function EditPickingListPage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id);

  const [documentNo, setDocumentNo] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [note, setNote] = useState("");

  const [items, setItems] = useState<PickingItem[]>([
    {
      productId: "",
      quantity: "1",
      note: "",
    },
  ]);

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [docRes, customersRes, productsRes] = await Promise.all([
          fetch(`/api/picking-list/${id}`),
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const docData: PickingListResponse | { message?: string } =
          await docRes.json();

        const customersData: Customer[] = await customersRes.json();
        const productsData: Product[] = await productsRes.json();

        if (!docRes.ok) {
          setError("โหลดข้อมูลใบจัดสินค้าไม่สำเร็จ");
          return;
        }

        const doc = docData as PickingListResponse;

        setDocumentNo(doc.documentNo);
        setCustomerId(doc.customerId ? String(doc.customerId) : "");
        setStatus(doc.status || "DRAFT");
        setNote(doc.note || "");

        setItems(
          doc.items.length > 0
            ? doc.items.map((item) => ({
                productId: String(item.productId),
                quantity: String(item.quantity),
                note: item.note || "",
              }))
            : [
                {
                  productId: "",
                  quantity: "1",
                  note: "",
                },
              ]
        );

        setCustomers(customersData);
        setProducts(productsData);
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoadingData(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

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

  function updateItem(index: number, field: keyof PickingItem, value: string) {
    const nextItems = [...items];
    nextItems[index][field] = value;
    setItems(nextItems);
  }

  function getProduct(productId: string) {
    return products.find((product) => String(product.id) === productId);
  }

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
      const res = await fetch(`/api/picking-list/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId || null,
          status,
          note,
          items: cleanItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "แก้ไขใบจัดสินค้าไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/picking-list");
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
            href="/picking-list"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าใบจัดสินค้า
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            แก้ไขใบจัดสินค้า
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            แก้ไขลูกค้า รายการสินค้า จำนวน หมายเหตุ และสถานะใบจัดสินค้า
          </p>

          {documentNo && (
            <p className="mt-2 text-sm font-semibold text-[#9b7a34]">
              เลขเอกสาร: {documentNo}
            </p>
          )}
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
              <div className="grid gap-5 md:grid-cols-3">
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
                    สถานะ
                  </label>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="DRAFT">ร่าง</option>
                    <option value="PICKING">กำลังจัดสินค้า</option>
                    <option value="COMPLETED">จัดเสร็จแล้ว</option>
                    <option value="CANCELLED">ยกเลิก</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    หมายเหตุเอกสาร
                  </label>

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น จัดส่งรอบเช้า"
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

                    return (
                      <div
                        key={index}
                        className="rounded-3xl border bg-gray-50 p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-[1fr_140px_1fr_50px]">
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
                                  {product.name}
                                </option>
                              ))}
                            </select>

                            {selectedProduct && (
                              <p className="mt-2 text-xs text-gray-500">
                                คงเหลือ {selectedProduct.stock}{" "}
                                {selectedProduct.unit || ""}
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
                              หมายเหตุรายการ
                            </label>

                            <input
                              value={item.note}
                              onChange={(e) =>
                                updateItem(index, "note", e.target.value)
                              }
                              placeholder="เช่น แพ็คแยก"
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

              <div className="mt-6 flex justify-end gap-3">
                <Link
                  href="/picking-list"
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
                  {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}