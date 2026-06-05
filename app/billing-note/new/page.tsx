"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

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
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  createdAt: string;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

export default function NewBillingNotePage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [customerId, setCustomerId] = useState("");
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [note, setNote] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        const data = await res.json();

        setCustomers(data);
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูลลูกค้าไม่สำเร็จ");
      } finally {
        setLoadingData(false);
      }
    }

    loadCustomers();
  }, []);

  async function handleCustomerChange(value: string) {
    setCustomerId(value);
    setSelectedInvoiceIds([]);
    setInvoices([]);
    setError("");

    if (!value) return;

    setLoadingInvoices(true);

    try {
      const res = await fetch(`/api/invoice/by-customer?customerId=${value}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "โหลด Invoice ไม่สำเร็จ");
        return;
      }

      setInvoices(data);
    } catch (err) {
      console.error(err);
      setError("โหลด Invoice ไม่สำเร็จ");
    } finally {
      setLoadingInvoices(false);
    }
  }

  function toggleInvoice(invoiceId: string) {
    if (selectedInvoiceIds.includes(invoiceId)) {
      setSelectedInvoiceIds(selectedInvoiceIds.filter((id) => id !== invoiceId));
    } else {
      setSelectedInvoiceIds([...selectedInvoiceIds, invoiceId]);
    }
  }

  const summary = useMemo(() => {
    const selectedInvoices = invoices.filter((invoice) =>
      selectedInvoiceIds.includes(String(invoice.id))
    );

    const total = selectedInvoices.reduce(
      (sum, invoice) => sum + invoice.balanceDue,
      0
    );

    return {
      count: selectedInvoices.length,
      total,
    };
  }, [invoices, selectedInvoiceIds]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!customerId) {
      setError("กรุณาเลือกลูกค้า");
      setLoading(false);
      return;
    }

    if (selectedInvoiceIds.length === 0) {
      setError("กรุณาเลือก Invoice อย่างน้อย 1 ใบ");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/billing-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId,
          note,
          invoices: selectedInvoiceIds.map((invoiceId) => ({
            invoiceId,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "สร้างใบวางบิลไม่สำเร็จ");
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
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <Link
            href="/billing-note"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าใบวางบิล
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">สร้างใบวางบิล</h1>

          <p className="mt-1 text-sm text-gray-500">
            เลือกลูกค้า แล้วเลือก Invoice ที่ต้องการนำมาวางบิล
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
                    หมายเหตุ
                  </label>

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น วางบิลรอบเดือนนี้"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    Invoice ค้างชำระ
                  </h2>

                  <div className="text-sm text-gray-500">
                    เลือกแล้ว {summary.count} ใบ
                  </div>
                </div>

                {!customerId ? (
                  <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-500">
                    กรุณาเลือกลูกค้าก่อน
                  </div>
                ) : loadingInvoices ? (
                  <div className="rounded-2xl bg-gray-50 p-6 text-sm text-gray-500">
                    กำลังโหลด Invoice...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="rounded-2xl bg-yellow-50 p-6 text-sm font-medium text-yellow-700">
                    ลูกค้ารายนี้ไม่มี Invoice ค้างชำระ
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-3xl border">
                    <table className="w-full min-w-[800px] text-left text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-5 py-4 font-medium">เลือก</th>
                          <th className="px-5 py-4 font-medium">
                            เลข Invoice
                          </th>
                          <th className="px-5 py-4 font-medium text-right">
                            ยอดรวม
                          </th>
                          <th className="px-5 py-4 font-medium text-right">
                            ชำระแล้ว
                          </th>
                          <th className="px-5 py-4 font-medium text-right">
                            ค้างชำระ
                          </th>
                          <th className="px-5 py-4 font-medium">วันที่</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-5 py-4">
                              <input
                                type="checkbox"
                                checked={selectedInvoiceIds.includes(
                                  String(invoice.id)
                                )}
                                onChange={() => toggleInvoice(String(invoice.id))}
                                className="h-4 w-4"
                              />
                            </td>

                            <td className="px-5 py-4 font-semibold text-gray-900">
                              {invoice.documentNo}
                            </td>

                            <td className="px-5 py-4 text-right text-gray-700">
                              {money(invoice.totalAmount)}
                            </td>

                            <td className="px-5 py-4 text-right text-green-700">
                              {money(invoice.paidAmount)}
                            </td>

                            <td className="px-5 py-4 text-right font-semibold text-red-600">
                              {money(invoice.balanceDue)}
                            </td>

                            <td className="px-5 py-4 text-gray-600">
                              {new Date(invoice.createdAt).toLocaleDateString(
                                "th-TH"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="mt-8 rounded-3xl bg-gray-900 p-5 text-white">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm text-gray-300">ยอดรวมวางบิล</p>
                    <p className="mt-1 text-2xl font-bold">
                      {money(summary.total)}
                    </p>
                  </div>

                  <div className="text-sm text-gray-300">
                    จำนวน Invoice: {summary.count} ใบ
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
                  {loading ? "กำลังบันทึก..." : "บันทึกใบวางบิล"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}