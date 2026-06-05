import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/reportDate";
import ReportToolbar from "@/app/components/ReportToolbar";
import { ArrowLeft, Eye, Plus, Receipt } from "lucide-react";

type PageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value || 0);
}

function paymentMethodText(value: string) {
  if (value === "CASH") return "เงินสด";
  if (value === "TRANSFER") return "โอนเงิน";
  if (value === "CREDIT_CARD") return "บัตรเครดิต";
  if (value === "QR") return "QR";
  if (value === "OTHER") return "อื่น ๆ";
  return value;
}

export default async function ReceiptPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const dateRange = getDateRange({
    from: params?.from,
    to: params?.to,
  });

  const receipts = await prisma.receipt.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
    include: {
      customer: true,
      invoice: true,
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalDocs = receipts.length;

  const totalAmount = receipts.reduce(
    (sum, receipt) => sum + receipt.totalAmount,
    0
  );

  const totalItems = receipts.reduce(
    (sum, receipt) => sum + receipt.items.length,
    0
  );

  const transferCount = receipts.filter(
    (receipt) => receipt.paymentMethod === "TRANSFER"
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Link
              href="/"
              className="no-print mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              กลับหน้า Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              ใบเสร็จรับเงิน
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              รายการใบเสร็จรับเงิน รับเงินจาก Invoice และอัปเดตสถานะชำระเงิน
            </p>

            {(params?.from || params?.to) && (
              <p className="mt-2 text-sm font-medium text-[#9b7a34]">
                ช่วงรายงาน: {params?.from || "-"} ถึง {params?.to || "-"}
              </p>
            )}
          </div>

          <Link
            href="/receipt/new"
            className="no-print inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            สร้างใบเสร็จ
          </Link>
        </div>

        <ReportToolbar report="receipt" title="รายงานใบเสร็จรับเงิน" />

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนใบเสร็จ</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalDocs} ใบ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">ยอดรับเงินรวม</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {money(totalAmount)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนรายการสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalItems} รายการ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">ชำระโดยโอนเงิน</p>
            <p className="mt-2 text-2xl font-bold text-blue-700">
              {transferCount} ใบ
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-gray-900">รายการใบเสร็จรับเงิน</h2>
          </div>

          {receipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1e3bf] text-[#8a6420]">
                <Receipt size={30} />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                ยังไม่มีใบเสร็จรับเงิน
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                สร้างใบเสร็จจากใบแจ้งหนี้ที่ยังค้างชำระ
              </p>

              <Link
                href="/receipt/new"
                className="no-print mt-5 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
              >
                สร้างใบเสร็จแรก
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">เลขใบเสร็จ</th>
                    <th className="px-6 py-4 font-medium">อ้างอิง Invoice</th>
                    <th className="px-6 py-4 font-medium">ลูกค้า</th>
                    <th className="px-6 py-4 font-medium text-right">
                      ยอดรับเงิน
                    </th>
                    <th className="px-6 py-4 font-medium">ช่องทางชำระ</th>
                    <th className="px-6 py-4 font-medium">เลขอ้างอิง</th>
                    <th className="px-6 py-4 font-medium">วันที่สร้าง</th>
                    <th className="no-print px-6 py-4 font-medium">จัดการ</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {receipts.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {doc.documentNo}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {doc.invoice?.documentNo || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {doc.customer?.name || "-"}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-green-700">
                        {money(doc.totalAmount)}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {paymentMethodText(doc.paymentMethod)}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {doc.paymentRef || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(doc.createdAt).toLocaleDateString("th-TH")}
                      </td>

                      <td className="no-print px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/receipt/${doc.id}`}
                            className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                          >
                            <Eye size={14} />
                            ดู/Print
                          </Link>

                          <Link
                            href={`/receipt/${doc.id}/edit`}
                            className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                          >
                            แก้ไข
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-gray-50 font-bold text-gray-900">
                  <tr>
                    <td className="px-6 py-4" colSpan={3}>
                      รวม
                    </td>
                    <td className="px-6 py-4 text-right text-green-700">
                      {money(totalAmount)}
                    </td>
                    <td className="px-6 py-4" colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}