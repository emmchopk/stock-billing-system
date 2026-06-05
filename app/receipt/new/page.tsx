"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

type Invoice = {
  id: number;
  documentNo: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  customer: {
    id: number;
    name: string;
  } | null;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

export default function NewReceiptPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceId, setInvoiceId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");
  const [note, setNote] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/invoice/unpaid");
        const data = await res.json();

        setInvoices(data);
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูลใบแจ้งหนี้ไม่สำเร็จ");
      } finally {
        setLoadingData(false);
      }
    }

    loadData();
  }, []);

  const selectedInvoice = useMemo(() => {
    return invoices.find((invoice) => String(invoice.id) === invoiceId);
  }, [invoices, invoiceId]);

  function handleInvoiceChange(value: string) {
    setInvoiceId(value);

    const invoice = invoices.find((item) => String(item.id) === value);

    if (invoice) {
      setPaymentAmount(String(invoice.balanceDue));
    } else {
      setPaymentAmount("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!invoiceId) {
      setError("กรุณาเลือกใบแจ้งหนี้");
      setLoading(false);
      return;
    }

    if (Number(paymentAmount || 0) <= 0) {
      setError("กรุณากรอกยอดรับเงิน");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/receipt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          paymentAmount,
          paymentMethod,
          paymentRef,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "สร้างใบเสร็จไม่สำเร็จ");
        setLoading(false);
        return;
      }

      router.push("/receipt");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <Link
            href="/receipt"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            กลับหน้าใบเสร็จ
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            สร้างใบเสร็จรับเงิน
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            เลือกใบแจ้งหนี้ที่ยังค้างชำระ แล้วบันทึกยอดรับเงิน
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
          ) : invoices.length === 0 ? (
            <div className="rounded-2xl bg-yellow-50 p-6 text-sm font-medium text-yellow-700">
              ยังไม่มีใบแจ้งหนี้ที่ค้างชำระ กรุณาสร้างใบแจ้งหนี้ก่อน
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    เลือกใบแจ้งหนี้ *
                  </label>

                  <select
                    value={invoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">เลือก Invoice</option>
                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.documentNo} - {invoice.customer?.name || "-"} -
                        ค้าง {money(invoice.balanceDue)}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedInvoice && (
                  <div className="md:col-span-2 rounded-3xl bg-gray-900 p-5 text-white">
                    <h3 className="mb-4 font-bold">สรุป Invoice</h3>

                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <p className="text-gray-300">ยอดรวม</p>
                        <p className="mt-1 text-lg font-bold">
                          {money(selectedInvoice.totalAmount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-300">ชำระแล้ว</p>
                        <p className="mt-1 text-lg font-bold text-green-300">
                          {money(selectedInvoice.paidAmount)}
                        </p>
                      </div>

                      <div>
                        <p className="text-gray-300">ค้างชำระ</p>
                        <p className="mt-1 text-lg font-bold text-red-300">
                          {money(selectedInvoice.balanceDue)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ยอดรับเงิน *
                  </label>

                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ช่องทางชำระเงิน
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="CASH">เงินสด</option>
                    <option value="TRANSFER">โอนเงิน</option>
                    <option value="QR">QR</option>
                    <option value="CREDIT_CARD">บัตรเครดิต</option>
                    <option value="OTHER">อื่น ๆ</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    เลขอ้างอิง / สลิป
                  </label>

                  <input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="เช่น เลขสลิป / Ref"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    หมายเหตุ
                  </label>

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="หมายเหตุเพิ่มเติม"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Link
                  href="/receipt"
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
                  {loading ? "กำลังบันทึก..." : "บันทึกใบเสร็จ"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </main>
  );
}