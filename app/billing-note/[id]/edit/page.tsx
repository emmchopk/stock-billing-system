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

type Invoice = {
  id: number;
  documentNo: string;
  customerId: number | null;
  invoiceDate: string;
  dueDate: string | null;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
};

type BillingInvoiceItem = {
  invoiceId: string;
};

type BillingNoteResponse = {
  id: number;
  documentNo: string;
  customerId: number | null;
  billingDate: string;
  dueDate: string | null;
  subtotal: number;
  discount: number;
  vat: number;
  totalAmount: number;
  status: string;
  note: string | null;
  invoices: Invoice[];
};

export default function EditBillingNotePage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id);

  const [documentNo, setDocumentNo] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [status, setStatus] = useState("DRAFT");
  const [note, setNote] = useState("");

  const [invoices, setInvoices] = useState<BillingInvoiceItem[]>([
    {
      invoiceId: "",
    },
  ]);

  const [loadingData, setLoadingData] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
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

  async function loadInvoicesByCustomer(nextCustomerId: string) {
    if (!nextCustomerId) {
      setAllInvoices([]);
      return;
    }

    setLoadingInvoices(true);

    try {
      const res = await fetch(
        `/api/invoice/by-customer?customerId=${nextCustomerId}`
      );

      const data = await res.json();

      if (res.ok) {
        setAllInvoices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingInvoices(false);
    }
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [docRes, customersRes] = await Promise.all([
          fetch(`/api/billing-note/${id}`),
          fetch("/api/customers"),
        ]);

        const docData: BillingNoteResponse | { message?: string } =
          await docRes.json();

        const customersData = await customersRes.json();

        if (!docRes.ok) {
          setError("โหลดข้อมูลใบวางบิลไม่สำเร็จ");
          return;
        }

        const doc = docData as BillingNoteResponse;

        setDocumentNo(doc.documentNo);
        setCustomerId(doc.customerId ? String(doc.customerId) : "");
        setBillingDate(toDateInput(doc.billingDate));
        setDueDate(toDateInput(doc.dueDate));
        setDiscount(String(doc.discount || 0));
        setVat(String(doc.vat || 0));
        setStatus(doc.status || "DRAFT");
        setNote(doc.note || "");

        setInvoices(
          doc.invoices.length > 0
            ? doc.invoices.map((invoice) => ({
                invoiceId: String(invoice.id),
              }))
            : [
                {
                  invoiceId: "",
                },
              ]
        );

        setCustomers(customersData);

        if (doc.customerId) {
          await loadInvoicesByCustomer(String(doc.customerId));

          setAllInvoices((current) => {
            const currentIds = new Set(current.map((item) => item.id));

            const oldInvoices = doc.invoices.filter(
              (invoice) => !currentIds.has(invoice.id)
            );

            return [...current, ...oldInvoices];
          });
        }
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

  async function handleCustomerChange(value: string) {
    setCustomerId(value);
    setInvoices([
      {
        invoiceId: "",
      },
    ]);

    await loadInvoicesByCustomer(value);
  }

  function addInvoiceRow() {
    setInvoices([
      ...invoices,
      {
        invoiceId: "",
      },
    ]);
  }

  function removeInvoiceRow(index: number) {
    if (invoices.length === 1) return;

    setInvoices(invoices.filter((_, i) => i !== index));
  }

  function updateInvoiceRow(index: number, value: string) {
    const nextInvoices = [...invoices];
    nextInvoices[index].invoiceId = value;
    setInvoices(nextInvoices);
  }

  function getInvoice(invoiceId: string) {
    return allInvoices.find((invoice) => String(invoice.id) === invoiceId);
  }

  const subtotal = useMemo(() => {
    return invoices.reduce((sum, item) => {
      const invoice = getInvoice(item.invoiceId);
      return sum + (invoice?.balanceDue || 0);
    }, 0);
  }, [invoices, allInvoices]);

  const totalAmount = useMemo(() => {
    return subtotal - Number(discount || 0) + Number(vat || 0);
  }, [subtotal, discount, vat]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const cleanInvoices = invoices.filter((item) => item.invoiceId);

    if (!customerId) {
      setError("กรุณาเลือกลูกค้า");
      setLoading(false);
      return;
    }

    if (cleanInvoices.length === 0) {
      setError("กรุณาเลือก Invoice อย่างน้อย 1 ใบ");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/billing-note/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          billingDate,
          dueDate,
          discount,
          vat,
          status,
          note,
          invoices: cleanInvoices,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "แก้ไขใบวางบิลไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/billing-note");
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
            href="/billing-note"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าใบวางบิล
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            แก้ไขใบวางบิล
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            แก้ไขลูกค้า วันที่วางบิล วันครบกำหนด รายการ Invoice และสถานะ
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
                    ลูกค้า *
                  </label>

                  <select
                    value={customerId}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">เลือกลูกค้า</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    วันที่วางบิล
                  </label>

                  <input
                    type="date"
                    value={billingDate}
                    onChange={(e) => setBillingDate(e.target.value)}
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
                    สถานะ
                  </label>

                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="DRAFT">ร่าง</option>
                    <option value="WAITING_PAYMENT">รอชำระเงิน</option>
                    <option value="PAID">ชำระแล้ว</option>
                    <option value="CANCELLED">ยกเลิก</option>
                  </select>
                </div>

                <div className="md:col-span-3">
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
                      รายการ Invoice
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      เลือก Invoice ที่ต้องการรวมในใบวางบิลนี้
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addInvoiceRow}
                    className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={16} />
                    เพิ่ม Invoice
                  </button>
                </div>

                {loadingInvoices && (
                  <div className="mb-4 rounded-2xl bg-gray-50 p-4 text-sm text-gray-500">
                    กำลังโหลด Invoice ของลูกค้า...
                  </div>
                )}

                <div className="space-y-4">
                  {invoices.map((item, index) => {
                    const selectedInvoice = getInvoice(item.invoiceId);

                    return (
                      <div
                        key={index}
                        className="rounded-3xl border bg-gray-50 p-4"
                      >
                        <div className="grid gap-4 md:grid-cols-[1fr_180px_180px_50px]">
                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              Invoice
                            </label>

                            <select
                              value={item.invoiceId}
                              onChange={(e) =>
                                updateInvoiceRow(index, e.target.value)
                              }
                              className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-gray-900"
                            >
                              <option value="">เลือก Invoice</option>

                              {allInvoices.map((invoice) => (
                                <option key={invoice.id} value={invoice.id}>
                                  {invoice.documentNo} - ค้างชำระ{" "}
                                  {money(invoice.balanceDue)}
                                </option>
                              ))}
                            </select>

                            {selectedInvoice && (
                              <p className="mt-2 text-xs text-gray-500">
                                ยอดรวม {money(selectedInvoice.totalAmount)} /
                                ชำระแล้ว {money(selectedInvoice.paidAmount)} /
                                ค้างชำระ {money(selectedInvoice.balanceDue)}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              ยอดรวม
                            </label>

                            <div className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-gray-900">
                              {selectedInvoice
                                ? money(selectedInvoice.totalAmount)
                                : "-"}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-semibold text-gray-600">
                              ค้างชำระ
                            </label>

                            <div className="rounded-2xl border bg-white px-4 py-3 text-sm font-semibold text-red-600">
                              {selectedInvoice
                                ? money(selectedInvoice.balanceDue)
                                : "-"}
                            </div>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => removeInvoiceRow(index)}
                              disabled={invoices.length === 1}
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
                      <span className="text-gray-600">ยอดค้าง Invoice</span>
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
                          ยอดวางบิลรวม
                        </span>
                        <span className="font-bold text-red-600">
                          {money(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Link
                  href="/billing-note"
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