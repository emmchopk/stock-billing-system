"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";

type Customer = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

type Product = {
  id: number;
  name: string;
  sku: string | null;
  salePrice: number;
  costPrice: number;
  stock: number;
  unit: string | null;
};

type InvoiceItem = {
  productId: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  note: string;
};

type InvoiceResponse = {
  id: number;
  documentNo: string;
  customerId: number | null;
  invoiceDate: string;
  dueDate: string | null;
  subtotal: number;
  discount: number;
  vat: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  note: string | null;
  items: {
    id: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unitPrice: number;
    note: string | null;
  }[];
};

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id);

  const [documentNo, setDocumentNo] = useState("");

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [status, setStatus] = useState("UNPAID");
  const [note, setNote] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      productId: "",
      productName: "",
      quantity: "1",
      unitPrice: "0",
      note: "",
    },
  ]);

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function toDateInput(value: string | null | undefined) {
    if (!value) return "";

    return new Date(value).toISOString().slice(0, 10);
  }

  function money(value: number) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(value || 0);
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [docRes, customersRes, productsRes] = await Promise.all([
          fetch(`/api/invoice/${id}`),
          fetch("/api/customers"),
          fetch("/api/products"),
        ]);

        const docData: InvoiceResponse | { message?: string } =
          await docRes.json();

        const customersData = await customersRes.json();
        const productsData = await productsRes.json();

        if (!docRes.ok) {
          setError("โหลดข้อมูลใบแจ้งหนี้ไม่สำเร็จ");
          return;
        }

        const doc = docData as InvoiceResponse;

        setDocumentNo(doc.documentNo);
        setCustomerId(doc.customerId ? String(doc.customerId) : "");
        setInvoiceDate(toDateInput(doc.invoiceDate));
        setDueDate(toDateInput(doc.dueDate));
        setDiscount(String(doc.discount || 0));
        setVat(String(doc.vat || 0));
        setPaidAmount(String(doc.paidAmount || 0));
        setStatus(doc.status || "UNPAID");
        setNote(doc.note || "");

        setItems(
          doc.items.length > 0
            ? doc.items.map((item) => ({
                productId: item.productId ? String(item.productId) : "",
                productName: item.productName || "",
                quantity: String(item.quantity),
                unitPrice: String(item.unitPrice),
                note: item.note || "",
              }))
            : [
                {
                  productId: "",
                  productName: "",
                  quantity: "1",
                  unitPrice: "0",
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
        productName: "",
        quantity: "1",
        unitPrice: "0",
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

  function handleProductChange(index: number, productId: string) {
    const product = products.find((item) => String(item.id) === productId);

    const nextItems = [...items];

    nextItems[index].productId = productId;

    if (product) {
      nextItems[index].productName = product.name;
      nextItems[index].unitPrice = String(product.salePrice);
    }

    setItems(nextItems);
  }

  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      return sum + Number(item.quantity || 0) * Number(item.unitPrice || 0);
    }, 0);
  }, [items]);

  const totalAmount = useMemo(() => {
    return subtotal - Number(discount || 0) + Number(vat || 0);
  }, [subtotal, discount, vat]);

  const balanceDue = useMemo(() => {
    return totalAmount - Number(paidAmount || 0);
  }, [totalAmount, paidAmount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanItems = items.filter(
      (item) =>
        Number(item.quantity) > 0 &&
        Number(item.unitPrice) >= 0 &&
        (item.productId || item.productName.trim())
    );

    if (cleanItems.length === 0) {
      setError("กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/invoice/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: customerId || null,
          invoiceDate,
          dueDate,
          discount,
          vat,
          paidAmount,
          status,
          note,
          items: cleanItems,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "แก้ไขใบแจ้งหนี้ไม่สำเร็จ");
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
            แก้ไขใบแจ้งหนี้
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            แก้ไขลูกค้า วันที่ รายการสินค้า ยอดชำระ และสถานะใบแจ้งหนี้
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
                    วันที่ใบแจ้งหนี้
                  </label>

                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    วันครบกำหนด
                  </label>

                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ส่วนลด
                  </label>

                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
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
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
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
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
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
                    <option value="UNPAID">ยังไม่ชำระ</option>
                    <option value="PARTIAL">ชำระบางส่วน</option>
                    <option value="PAID">ชำระแล้ว</option>
                    <option value="CANCELLED">ยกเลิก</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    หมายเหตุ
                  </label>

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น กรุณาชำระภายในวันที่กำหนด"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      รายการสินค้า
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      หน้าใบแจ้งหนี้จะแสดงเฉพาะราคาขาย ไม่แสดงต้นทุน/กำไร
                    </p>
                  </div>

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
                    const lineTotal =
                      Number(item.quantity || 0) *
                      Number(item.unitPrice || 0);

                    return (
                      <div
                        key={index}
                        className="rounded-3xl border bg-gray-50 p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-[1fr_120px_160px_160px_50px]">
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              สินค้า
                            </label>

                            <select
                              value={item.productId}
                              onChange={(e) =>
                                handleProductChange(index, e.target.value)
                              }
                              className="mb-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            >
                              <option value="">เลือกจากสินค้าในระบบ / หรือพิมพ์เอง</option>

                              {products.map((product) => (
                                <option key={product.id} value={product.id}>
                                  {product.sku ? `${product.sku} - ` : ""}
                                  {product.name}
                                </option>
                              ))}
                            </select>

                            <input
                              value={item.productName}
                              onChange={(e) =>
                                updateItem(index, "productName", e.target.value)
                              }
                              placeholder="ชื่อสินค้า"
                              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            />

                            <input
                              value={item.note}
                              onChange={(e) =>
                                updateItem(index, "note", e.target.value)
                              }
                              placeholder="หมายเหตุรายการ"
                              className="mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            />
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
                              ราคาต่อหน่วย
                            </label>

                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) =>
                                updateItem(index, "unitPrice", e.target.value)
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

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-md rounded-3xl bg-gray-50 p-5">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ยอดสินค้า</span>
                      <span className="font-semibold text-gray-900">
                        {money(subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">ส่วนลด</span>
                      <span className="font-semibold text-gray-900">
                        - {money(Number(discount || 0))}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-gray-600">VAT / ภาษี</span>
                      <span className="font-semibold text-gray-900">
                        {money(Number(vat || 0))}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-gray-900">
                          ยอดรวมที่ต้องชำระ
                        </span>
                        <span className="font-bold text-gray-900">
                          {money(totalAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-green-700">
                      <span className="font-semibold">ชำระแล้ว</span>
                      <span className="font-bold">
                        {money(Number(paidAmount || 0))}
                      </span>
                    </div>

                    <div className="flex justify-between text-red-600">
                      <span className="font-semibold">ค้างชำระ</span>
                      <span className="font-bold">
                        {money(balanceDue)}
                      </span>
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