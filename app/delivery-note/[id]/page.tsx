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

function statusText(status: string) {
  if (status === "DRAFT") return "ร่าง";
  if (status === "DELIVERING") return "กำลังส่ง";
  if (status === "DELIVERED") return "ส่งแล้ว";
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

export default async function DeliveryNoteDetailPage({ params }: PageProps) {
  const { id } = await params;
  const deliveryNoteId = Number(id);

  if (!deliveryNoteId) {
    notFound();
  }

  const deliveryNote = await prisma.deliveryNote.findUnique({
    where: {
      id: deliveryNoteId,
    },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!deliveryNote) {
    notFound();
  }

  const totalQty = deliveryNote.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8 print:bg-white print:px-0 print:py-0">
      <div className="mx-auto max-w-5xl">
        <div className="no-print mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Link
              href="/delivery-note"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              กลับหน้าใบส่งสินค้า
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              ดูใบส่งสินค้า / Print
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              เลขเอกสาร {deliveryNote.documentNo}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href={`/delivery-note/${deliveryNote.id}/edit`}
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
                Delivery Note
              </p>

              <h2 className="mt-2 text-3xl font-bold text-gray-900">
                ใบส่งสินค้า
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                เอกสารสำหรับส่งมอบสินค้าให้ลูกค้า
              </p>
            </div>

            <div className="text-left md:text-right">
              <p className="text-sm text-gray-500">เลขที่เอกสาร</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {deliveryNote.documentNo}
              </p>

              <p className="mt-4 text-sm text-gray-500">วันที่ส่งสินค้า</p>
              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(deliveryNote.deliveryDate)}
              </p>

              <p className="mt-4 text-sm text-gray-500">สถานะ</p>
              <p className="mt-1 font-semibold text-gray-900">
                {statusText(deliveryNote.status)}
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
                  {deliveryNote.customer?.name || "-"}
                </p>

                <p>
                  <span className="font-semibold">เบอร์โทร:</span>{" "}
                  {deliveryNote.customer?.phone || "-"}
                </p>

                <p>
                  <span className="font-semibold">อีเมล:</span>{" "}
                  {deliveryNote.customer?.email || "-"}
                </p>

                <p>
                  <span className="font-semibold">ที่อยู่:</span>{" "}
                  {deliveryNote.customer?.address || "-"}
                </p>
              </div>
            </div>

            <div className="rounded-3xl bg-gray-50 p-5 print:border print:bg-white">
              <p className="mb-3 text-sm font-bold text-gray-900">
                ข้อมูลผู้รับสินค้า
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">ชื่อผู้รับ:</span>{" "}
                  {deliveryNote.receiverName || "-"}
                </p>

                <p>
                  <span className="font-semibold">เบอร์ผู้รับ:</span>{" "}
                  {deliveryNote.receiverPhone || "-"}
                </p>

                <p>
                  <span className="font-semibold">ที่อยู่จัดส่ง:</span>{" "}
                  {deliveryNote.deliveryAddress || "-"}
                </p>

                <p>
                  <span className="font-semibold">จำนวนสินค้ารวม:</span>{" "}
                  {totalQty}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-3xl border print:rounded-none">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-5 py-4 font-semibold">ลำดับ</th>
                  <th className="px-5 py-4 font-semibold">รหัสสินค้า</th>
                  <th className="px-5 py-4 font-semibold">รายการสินค้า</th>
                  <th className="px-5 py-4 font-semibold text-right">จำนวน</th>
                  <th className="px-5 py-4 font-semibold">หน่วย</th>
                  <th className="px-5 py-4 font-semibold">หมายเหตุ</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {deliveryNote.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-5 py-4 text-gray-600">{index + 1}</td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.product.sku || "-"}
                    </td>

                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {item.product.name}
                    </td>

                    <td className="px-5 py-4 text-right font-semibold text-gray-900">
                      {item.quantity}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {item.product.unit || "-"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.note || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="bg-gray-50 font-bold text-gray-900">
                <tr>
                  <td className="px-5 py-4" colSpan={3}>
                    รวม
                  </td>
                  <td className="px-5 py-4 text-right">{totalQty}</td>
                  <td className="px-5 py-4" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {deliveryNote.note && (
            <div className="mt-8 rounded-3xl bg-yellow-50 p-5 text-sm text-yellow-800 print:border print:bg-white print:text-gray-900">
              <p className="font-bold">หมายเหตุ</p>
              <p className="mt-2">{deliveryNote.note}</p>
            </div>
          )}

          <div className="mt-12 grid gap-8 text-center text-sm text-gray-700 md:grid-cols-3">
            <div>
              <div className="mx-auto mt-12 w-56 border-t pt-3">
                ผู้ส่งสินค้า
              </div>
            </div>

            <div>
              <div className="mx-auto mt-12 w-56 border-t pt-3">
                ผู้รับสินค้า
              </div>
            </div>

            <div>
              <div className="mx-auto mt-12 w-56 border-t pt-3">
                ผู้ตรวจสอบ
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}