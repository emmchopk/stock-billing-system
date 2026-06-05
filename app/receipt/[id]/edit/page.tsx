"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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

type ReceiptResponse = {
  id: number;
  documentNo: string;
  invoiceId: number | null;
  customerId: number | null;
  receiptDate: string;
  subtotal: number;
  discount: number;
  vat: number;
  totalAmount: number;
  paymentMethod: string;
  paymentRef: string | null;
  note: string | null;
  invoice: Invoice | null;
};

export default function EditReceiptPage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id);

  const [documentNo, setDocumentNo] = useState("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [invoiceId, setInvoiceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");

  const [receiptDate, setReceiptDate] = useState("");
  const [discount, setDiscount] = useState("");
  const [vat, setVat] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentRef, setPaymentRef] = useState("");
  const [note, setNote] = useState("");

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

  async function loadUnpaidInvoices(currentInvoice?: Invoice | null) {
    setLoadingInvoices(true);

    try {
      const res = await fetch("/api/invoice/unpaid");
      const data = await res.json();

      if (res.ok) {
        const list: Invoice[] = Array.isArray(data) ? data : [];

        if (currentInvoice) {
          const exists = list.some((item) => item.id === currentInvoice.id);

          setInvoices(exists ? list : [currentInvoice, ...list]);
        } else {
          setInvoices(list);
        }
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
        const res = await fetch(`/api/receipt/${id}`);
        const data: ReceiptResponse | { message?: string } = await res.json();

        if (!res.ok) {
          setError("โหลดข้อมูลใบเสร็จไม่สำเร็จ");
          return;
        }

        const receipt = data as ReceiptResponse;

        setDocumentNo(receipt.documentNo);
        setInvoiceId(receipt.invoiceId ? String(receipt.invoiceId) : "");
        setCustomerId(receipt.customerId ? String(receipt.customerId) : "");
        setCustomerName(receipt.invoice?.customer?.name || "");
        setReceiptDate(toDateInput(receipt.receiptDate));
        setDiscount(String(receipt.discount || 0));
        setVat(String(receipt.vat || 0));
        setTotalAmount(String(receipt.totalAmount || 0));
        setPaymentMethod(receipt.paymentMethod || "CASH");
        setPaymentRef(receipt.paymentRef || "");
        setNote(receipt.note || "");

        await loadUnpaidInvoices(receipt.invoice);
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

  function handleInvoiceChange(value: string) {
    setInvoiceId(value);

    const invoice = invoices.find((item) => String(item.id) === value);

    if (invoice) {
      setCustomerId(invoice.customerId ? String(invoice.customerId) : "");
      setCustomerName(invoice.customer?.name || "");
      setTotalAmount(String(invoice.balanceDue));
    } else {
      setCustomerId("");
      setCustomerName("");
      setTotalAmount("");
    }
  }

  const selectedInvoice = useMemo(() => {
    return invoices.find((item) => String(item.id) === invoiceId);
  }, [invoices, invoiceId]);

  const subtotal = useMemo(() => {
    return Number(totalAmount || 0) - Number(vat || 0) + Number(discount || 0);
  }, [totalAmount, vat, discount]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!invoiceId) {
      setError("กรุณาเลือก Invoice");
      setLoading(false);
      return;
    }

    if (!customerId) {
      setError("ไม่พบข้อมูลลูกค้า");
      setLoading(false);
      return;
    }

    if (Number(totalAmount || 0) <= 0) {
      setError("ยอดรับเงินต้องมากกว่า 0");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/receipt/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceId,
          customerId,
          receiptDate,
          discount,
          vat,
          totalAmount,
          paymentMethod,
          paymentRef,
          note,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "แก้ไขใบเสร็จไม่สำเร็จ");
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
            กลับหน้าใบเสร็จรับเงิน
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">
            แก้ไขใบเสร็จรับเงิน
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            แก้ไข Invoice อ้างอิง ยอดรับเงิน ช่องทางชำระ และหมายเหตุ
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
              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    เลือก Invoice *
                  </label>

                  <select
                    value={invoiceId}
                    onChange={(e) => handleInvoiceChange(e.target.value)}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  >
                    <option value="">
                      {loadingInvoices
                        ? "กำลังโหลด Invoice..."
                        : "เลือก Invoice"}
                    </option>

                    {invoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.documentNo} - {invoice.customer?.name || "-"} -
                        ค้างชำระ {money(invoice.balanceDue)}
                      </option>
                    ))}
                  </select>

                  {selectedInvoice && (
                    <div className="mt-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold">ลูกค้า:</span>{" "}
                        {selectedInvoice.customer?.name || "-"}
                      </p>
                      <p>
                        <span className="font-semibold">ยอด Invoice:</span>{" "}
                        {money(selectedInvoice.totalAmount)}
                      </p>
                      <p>
                        <span className="font-semibold">ชำระแล้ว:</span>{" "}
                        {money(selectedInvoice.paidAmount)}
                      </p>
                      <p>
                        <span className="font-semibold">ค้างชำระ:</span>{" "}
                        {money(selectedInvoice.balanceDue)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    ลูกค้า
                  </label>

                  <input
                    value={customerName}
                    readOnly
                    className="w-full rounded-2xl border bg-gray-50 px-4 py-3 text-sm text-gray-600 outline-none"
                  />
                </div>

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
                    ยอดรับเงิน *
                  </label>

                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
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
                    เลขอ้างอิงการชำระเงิน
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

                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:border-gray-900"
                  />
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <div className="w-full max-w-md rounded-3xl bg-gray-50 p-5">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ยอดก่อน VAT</span>
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
                          รวมรับชำระ
                        </span>
                        <span className="font-bold text-green-700">
                          {money(Number(totalAmount || 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-2xl bg-yellow-50 p-4 text-sm text-yellow-800">
                หมายเหตุ: เมื่อแก้ไขใบเสร็จ ระบบจะคำนวณยอดชำระของ Invoice
                ใหม่จากใบเสร็จทั้งหมดที่อ้างอิง Invoice นี้
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