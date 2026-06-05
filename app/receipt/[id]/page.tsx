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

function paymentMethodText(value: string) {
  if (value === "CASH") return "เงินสด";
  if (value === "TRANSFER") return "โอนเงิน";
  if (value === "CREDIT_CARD") return "บัตรเครดิต";
  if (value === "QR") return "QR";
  if (value === "OTHER") return "อื่น ๆ";
  return value;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function ReceiptDetailPage({ params }: PageProps) {
  const { id } = await params;
  const receiptId = Number(id);

  if (!receiptId) {
    notFound();
  }

  const receipt = await prisma.receipt.findUnique({
    where: {
      id: receiptId,
    },
    include: {
      customer: true,
      invoice: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!receipt) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl">
        <div className="no-print mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Link
              href="/receipt"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              กลับหน้าใบเสร็จรับเงิน
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              ดูใบเสร็จรับเงิน / Print
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              เลขเอกสาร {receipt.documentNo}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/receipt/${receipt.id}/edit`}
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
                Receipt
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                ใบเสร็จรับเงิน
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                เอกสารยืนยันการรับชำระเงิน
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">เลขที่ใบเสร็จ</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {receipt.documentNo}
              </p>

              <p className="mt-4 text-sm text-gray-500">วันที่รับเงิน</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(receipt.receiptDate)}
              </p>

              <p className="mt-4 text-sm text-gray-500">อ้างอิง Invoice</p>
              <p className="mt-1 font-semibold text-gray-900">
                {receipt.invoice?.documentNo || "-"}
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
                  {receipt.customer?.name || "-"}
                </p>

                <p>
                  <span className="font-semibold">เบอร์โทร:</span>{" "}
                  {receipt.customer?.phone || "-"}
                </p>

                <p>
                  <span className="font-semibold">อีเมล:</span>{" "}
                  {receipt.customer?.email || "-"}
                </p>

                <p>
                  <span className="font-semibold">ที่อยู่:</span>{" "}
                  {receipt.customer?.address || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 p-5 print:border print:bg-white">
              <p className="mb-3 text-sm font-bold text-gray-900">
                ข้อมูลการชำระเงิน
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">ช่องทางชำระ:</span>{" "}
                  {paymentMethodText(receipt.paymentMethod)}
                </p>

                <p>
                  <span className="font-semibold">เลขอ้างอิง:</span>{" "}
                  {receipt.paymentRef || "-"}
                </p>

                <p>
                  <span className="font-semibold">ยอดรับเงิน:</span>{" "}
                  {money(receipt.totalAmount)}
                </p>

                <p>
                  <span className="font-semibold">จำนวนรายการสินค้า:</span>{" "}
                  {receipt.items.length} รายการ
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border print:rounded-none">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">ลำดับ</th>
                  <th className="px-5 py-4 font-semibold">รายการสินค้า</th>
                  <th className="px-5 py-4 font-semibold text-right">จำนวน</th>
                  <th className="px-5 py-4 font-semibold text-right">
                    ราคาต่อหน่วย
                  </th>
                  <th className="px-5 py-4 font-semibold text-right">รวม</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {receipt.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-gray-600">{index + 1}</td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">
                        {item.productName}
                      </p>

                      {item.note && (
                        <p className="mt-1 text-xs text-gray-500">
                          {item.note}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-right text-gray-700">
                      {money(item.unitPrice)}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {money(item.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-md rounded-3xl bg-gray-50 p-5 print:border print:bg-white">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">ยอดรับเงิน</span>
                  <span className="font-semibold text-gray-900">
                    {money(receipt.subtotal)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">ส่วนลด</span>
                  <span className="font-semibold text-gray-900">
                    - {money(receipt.discount)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">VAT / ภาษี</span>
                  <span className="font-semibold text-gray-900">
                    {money(receipt.vat)}
                  </span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="font-bold text-gray-900">
                      รวมรับชำระ
                    </span>
                    <span className="font-bold text-green-700">
                      {money(receipt.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {receipt.note && (
            <div className="mt-8 rounded-3xl bg-yellow-50 p-5 text-sm text-yellow-800 print:border print:bg-white print:text-gray-900">
              <p className="font-bold">หมายเหตุ</p>
              <p className="mt-2">{receipt.note}</p>
            </div>
          )}

          <div className="mt-12 grid gap-8 text-center text-sm text-gray-700 md:grid-cols-2">
            <div>
              <div className="mx-auto mt-12 w-64 border-t pt-3">
                ผู้รับเงิน
              </div>
            </div>

            <div>
              <div className="mx-auto mt-12 w-64 border-t pt-3">
                ผู้ชำระเงิน
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}