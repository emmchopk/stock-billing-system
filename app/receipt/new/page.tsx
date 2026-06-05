"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";

type Invoice = {
  id: number;
  documentNo: string;
  customerId: number | null;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: string;
  customer: {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
};

export default function NewReceiptPage() {
  const router = useRouter();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceId, setInvoiceId] = useState("");

  const [receiptDate, setReceiptDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });

  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER");
  const [paymentRef, setPaymentRef] = useState("");
  const [note, setNote] = useState("");

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function money(value: number) {
    return new Intl.NumberFormat("th-TH", {
      style: "currency",
      currency: "THB",
    }).format(value || 0);
  }

  const selectedInvoice = useMemo(() => {
    return invoices.find((invoice) => String(invoice.id) === invoiceId);
  }, [invoices, invoiceId]);

  const receiveAmount = Number(totalAmount || 0);

  const balanceAfterReceive = selectedInvoice
    ? selectedInvoice.balanceDue - receiveAmount
    : 0;

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch("/api/invoice/unpaid");
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "โหลด Invoice ไม่สำเร็จ");
          return;
        }

        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูล Invoice ไม่สำเร็จ");
      } finally {
        setLoadingData(false);
      }
    }

    loadInvoices();
  }, []);

  function handleInvoiceChange(value: string) {
    setInvoiceId(value);
    setError("");

    const invoice = invoices.find((item) => String(item.id) === value);

    if (invoice) {
      setTotalAmount(String(invoice.balanceDue));
      setNote(
        invoice.balanceDue === invoice.totalAmount
          ? "รับชำระเต็มจำนวน"
          : "รับชำระยอดค้างบางส่วน"
      );
    } else {
      setTotalAmount("");
      setNote("");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!selectedInvoice) {
      setError("กรุณาเลือกใบแจ้งหนี้");
      setLoading(false);
      return;
    }

    if (receiveAmount <= 0) {
      setError("ยอดรับเงินต้องมากกว่า 0");
      setLoading(false);
      return;
    }

    if (receiveAmount > selectedInvoice.balanceDue) {
      setError(
        `ยอดรับเงินมากกว่ายอดค้างชำระ ยอดค้างปัจจุบันคือ ${money(
          selectedInvoice.balanceDue
        )}`
      );
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
          invoiceId: selectedInvoice.id,
          receiptDate,
          totalAmount: receiveAmount,
          paymentMethod,
          paymentRef,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "ไม่สามารถสร้างใบเสร็จรับเงินได้");
        setLoading(false);
        return;
      }

      router.push(`/receipt/${data.id}`);
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
            ออกใบเสร็จเฉพาะยอดที่ลูกค้าชำระเงินจริง และระบบจะอัปเดตยอดค้างของ Invoice ให้อัตโนมัติ
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
              กำลังโหลด Invoice ค้างชำระ...
            </div>
          ) : invoices.length === 0 ? (
            <div className="rounded-2xl bg-yellow-50 p-6 text-sm text-yellow-800">
              ยังไม่มี Invoice ที่มียอดค้างชำระ กรุณาสร้างใบแจ้งหนี้ก่อน
              และให้ยอดชำระแล้วเป็น 0
            </div>
          ) : (
            <>
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  เลือกใบแจ้งหนี้ *
                </label>

                <select
                  value={invoiceId}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                >
                  <option value="">เลือกใบแจ้งหนี้</option>

                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.documentNo} - {invoice.customer?.name || "-"} -
                      ค้างชำระ {money(invoice.balanceDue)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="mb-6 rounded-3xl bg-gray-900 p-6 text-white">
                  <h2 className="mb-4 text-lg font-bold">สรุป Invoice</h2>

                  <div className="grid gap-5 md:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-300">เลข Invoice</p>
                      <p className="mt-1 font-bold">
                        {selectedInvoice.documentNo}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-300">ยอดรวม</p>
                      <p className="mt-1 text-lg font-bold">
                        {money(selectedInvoice.totalAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-300">ชำระแล้ว</p>
                      <p className="mt-1 text-lg font-bold text-green-300">
                        {money(selectedInvoice.paidAmount)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-300">ค้างชำระ</p>
                      <p className="mt-1 text-lg font-bold text-red-300">
                        {money(selectedInvoice.balanceDue)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    วันที่รับเงิน
                  </label>

                  <input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
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
                    <option value="CREDIT_CARD">บัตรเครดิต</option>
                    <option value="QR">QR</option>
                    <option value="OTHER">อื่น ๆ</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ยอดรับเงินงวดนี้ *
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />

                  {selectedInvoice && (
                    <p className="mt-2 text-xs text-gray-500">
                      ห้ามเกินยอดค้างชำระ {money(selectedInvoice.balanceDue)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    เลขอ้างอิง / สลิป
                  </label>

                  <input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="เช่น เลขสลิป / หมายเลขโอน"
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
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

              {selectedInvoice && (
                <div className="mt-8 flex justify-end">
                  <div className="w-full max-w-md rounded-3xl bg-gray-50 p-5">
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ยอดค้างก่อนรับเงิน</span>
                        <span className="font-semibold text-red-600">
                          {money(selectedInvoice.balanceDue)}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-600">รับเงินงวดนี้</span>
                        <span className="font-semibold text-green-700">
                          {money(receiveAmount)}
                        </span>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex justify-between text-lg">
                          <span className="font-bold text-gray-900">
                            ค้างชำระหลังรับเงิน
                          </span>
                          <span
                            className={`font-bold ${
                              balanceAfterReceive <= 0
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {money(Math.max(balanceAfterReceive, 0))}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white p-3 text-xs text-gray-600">
                        {balanceAfterReceive <= 0
                          ? "หลังบันทึก ใบแจ้งหนี้จะเปลี่ยนเป็น ชำระแล้ว"
                          : "หลังบันทึก ใบแจ้งหนี้จะเปลี่ยนเป็น ชำระบางส่วน"}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <Link
                  href="/receipt"
                  className="rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  ยกเลิก
                </Link>

                <button
                  type="submit"
                  disabled={loading || !selectedInvoice}
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