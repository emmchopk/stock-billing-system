import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PrintButton from "@/app/components/PrintButton";
import { ArrowLeft } from "lucide-react";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value || 0);
}

function statusText(status: string) {
  if (status === "DRAFT") return "ร่าง";
  if (status === "WAITING_PAYMENT") return "รอชำระเงิน";
  if (status === "PAID") return "ชำระแล้ว";
  if (status === "CANCELLED") return "ยกเลิก";
  return status;
}

function invoiceStatusText(status: string) {
  if (status === "DRAFT") return "ร่าง";
  if (status === "UNPAID") return "ยังไม่ชำระ";
  if (status === "PARTIAL") return "ชำระบางส่วน";
  if (status === "PAID") return "ชำระแล้ว";
  if (status === "OVERDUE") return "เกินกำหนด";
  if (status === "CANCELLED") return "ยกเลิก";
  return status;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BillingNoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const billingNoteId = Number(id);

  if (!billingNoteId) {
    notFound();
  }

  const billingNote = await prisma.billingNote.findUnique({
    where: {
      id: billingNoteId,
    },
    include: {
      customer: true,
      invoices: {
        include: {
          items: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!billingNote) {
    notFound();
  }

  const totalInvoiceAmount = billingNote.invoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0
  );

  const totalPaid = billingNote.invoices.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0
  );

  const totalBalanceDue = billingNote.invoices.reduce(
    (sum, invoice) => sum + invoice.balanceDue,
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl">
        <div className="no-print mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Link
              href="/billing-note"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              กลับหน้าใบวางบิล
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              ดูใบวางบิล / Print
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              เลขเอกสาร {billingNote.documentNo}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/billing-note/${billingNote.id}/edit`}
              className="inline-flex items-center justify-center rounded-2xl border px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              แก้ไข
            </Link>

            <PrintButton label="Print" />
          </div>
        </div>

        <section className="rounded-3xl bg-white p-8 shadow-sm print:rounded-none print:shadow-none">
          <div className="mb-8 flex flex-col justify-between gap-6 border-b pb-6 md:flex-row">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[#9b7a34]">
                Billing Note
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                ใบวางบิล
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                เอกสารรวบรวม Invoice เพื่อแจ้งยอดวางบิลลูกค้า
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">เลขที่เอกสาร</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {billingNote.documentNo}
              </p>

              <p className="mt-4 text-sm text-gray-500">วันที่วางบิล</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(billingNote.billingDate)}
              </p>

              <p className="mt-4 text-sm text-gray-500">วันครบกำหนด</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(billingNote.dueDate)}
              </p>

              <p className="mt-4 text-sm text-gray-500">สถานะ</p>
              <p className="mt-1 font-semibold text-gray-900">
                {statusText(billingNote.status)}
              </p>
            </div>
          </div>

          <div className="mb-8 grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl bg-gray-50 p-5 print:border print:bg-white">
              <p className="mb-3 text-sm font-bold text-gray-900">
                ข้อมูลลูกค้า
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">ชื่อ:</span>{" "}
                  {billingNote.customer?.name || "-"}
                </p>

                <p>
                  <span className="font-semibold">เบอร์โทร:</span>{" "}
                  {billingNote.customer?.phone || "-"}
                </p>

                <p>
                  <span className="font-semibold">อีเมล:</span>{" "}
                  {billingNote.customer?.email || "-"}
                </p>

                <p>
                  <span className="font-semibold">ที่อยู่:</span>{" "}
                  {billingNote.customer?.address || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 p-5 print:border print:bg-white">
              <p className="mb-3 text-sm font-bold text-gray-900">
                สรุปยอดวางบิล
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">จำนวน Invoice:</span>{" "}
                  {billingNote.invoices.length} ใบ
                </p>

                <p>
                  <span className="font-semibold">ยอด Invoice รวม:</span>{" "}
                  {money(totalInvoiceAmount)}
                </p>

                <p>
                  <span className="font-semibold">ชำระแล้ว:</span>{" "}
                  {money(totalPaid)}
                </p>

                <p>
                  <span className="font-semibold">ยอดวางบิลค้างชำระ:</span>{" "}
                  {money(totalBalanceDue)}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border print:rounded-none">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">ลำดับ</th>
                  <th className="px-5 py-4 font-semibold">เลข Invoice</th>
                  <th className="px-5 py-4 font-semibold">วันที่ Invoice</th>
                  <th className="px-5 py-4 font-semibold text-right">
                    ยอดรวม
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    ชำระแล้ว
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">
                    ค้างชำระ
                  </th>
                  <th className="px-5 py-4 font-semibold">สถานะ</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {billingNote.invoices.map((invoice, index) => (
                  <tr key={invoice.id}>
                    <td className="px-5 py-4 text-gray-600">{index + 1}</td>

                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {invoice.documentNo}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {formatDate(invoice.invoiceDate)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {money(invoice.totalAmount)}
                    </td>

                    <td className="px-5 py-4 text-right text-green-700">
                      {money(invoice.paidAmount)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-red-600">
                      {money(invoice.balanceDue)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {invoiceStatusText(invoice.status)}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50 font-bold text-gray-900">
                <tr>
                  <td className="px-5 py-4" colSpan={3}>
                    รวม
                  </td>

                  <td className="px-5 py-4 text-right">
                    {money(totalInvoiceAmount)}
                  </td>

                  <td className="px-5 py-4 text-right text-green-700">
                    {money(totalPaid)}
                  </td>

                  <td className="px-5 py-4 text-right text-red-600">
                    {money(totalBalanceDue)}
                  </td>

                  <td className="px-5 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-md rounded-3xl bg-gray-50 p-5 print:border print:bg-white">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ยอดรวม Invoice</span>
                  <span className="font-semibold text-gray-900">
                    {money(totalInvoiceAmount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">ชำระแล้ว</span>
                  <span className="font-semibold text-green-700">
                    {money(totalPaid)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">
                      ยอดวางบิลค้างชำระ
                    </span>
                    <span className="font-bold text-red-600">
                      {money(totalBalanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {billingNote.note && (
            <div className="mt-8 rounded-3xl bg-yellow-50 p-5 text-sm text-yellow-800 print:border print:bg-white print:text-gray-900">
              <p className="font-bold">หมายเหตุ</p>
              <p className="mt-2">{billingNote.note}</p>
            </div>
          )}

          <div className="mt-12 grid gap-8 text-center text-sm text-gray-700 md:grid-cols-2">
            <div>
              <div className="mx-auto mt-12 w-64 border-t pt-3">
                ผู้วางบิล
              </div>
            </div>

            <div>
              <div className="mx-auto mt-12 w-64 border-t pt-3">
                ผู้รับวางบิล
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}