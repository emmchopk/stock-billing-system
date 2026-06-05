import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/reportDate";
import ReportToolbar from "@/app/components/ReportToolbar";
import { ArrowLeft, ClipboardList, Eye, Plus } from "lucide-react";

type PageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

function statusText(status: string) {
  if (status === "DRAFT") return "ร่าง";
  if (status === "PICKING") return "กำลังจัดสินค้า";
  if (status === "COMPLETED") return "จัดเสร็จแล้ว";
  if (status === "CANCELLED") return "ยกเลิก";
  return status;
}

function statusClass(status: string) {
  if (status === "COMPLETED") return "bg-green-100 text-green-700";
  if (status === "PICKING") return "bg-blue-100 text-blue-700";
  if (status === "DRAFT") return "bg-yellow-100 text-yellow-700";
  if (status === "CANCELLED") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-700";
}

export default async function PickingListPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const dateRange = getDateRange({
    from: params?.from,
    to: params?.to,
  });

  const pickingLists = await prisma.pickingList.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalDocs = pickingLists.length;

  const totalItems = pickingLists.reduce(
    (sum, doc) => sum + doc.items.length,
    0
  );

  const totalQty = pickingLists.reduce((sum, doc) => {
    const docQty = doc.items.reduce(
      (itemSum, item) => itemSum + item.quantity,
      0
    );

    return sum + docQty;
  }, 0);

  const completedCount = pickingLists.filter(
    (doc) => doc.status === "COMPLETED"
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

            <h1 className="text-2xl font-bold text-gray-900">ใบจัดสินค้า</h1>

            <p className="mt-1 text-sm text-gray-500">
              รายการใบจัดสินค้า สำหรับให้คลังเตรียมสินค้าก่อนส่ง
            </p>

            {(params?.from || params?.to) && (
              <p className="mt-2 text-sm font-medium text-[#9b7a34]">
                ช่วงรายงาน: {params?.from || "-"} ถึง {params?.to || "-"}
              </p>
            )}
          </div>

          <Link
            href="/picking-list/new"
            className="no-print inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            สร้างใบจัดสินค้า
          </Link>
        </div>

        <ReportToolbar report="picking-list" title="รายงานใบจัดสินค้า" />

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนใบจัดสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalDocs} ใบ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนรายการสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalItems} รายการ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนสินค้ารวม</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalQty}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จัดเสร็จแล้ว</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {completedCount} ใบ
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-gray-900">รายการใบจัดสินค้า</h2>
          </div>

          {pickingLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1e3bf] text-[#8a6420]">
                <ClipboardList size={30} />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                ยังไม่มีใบจัดสินค้า
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                เริ่มสร้างใบจัดสินค้าแรก เพื่อเตรียมของก่อนส่งสินค้า
              </p>

              <Link
                href="/picking-list/new"
                className="no-print mt-5 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
              >
                สร้างใบจัดสินค้าแรก
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">เลขเอกสาร</th>
                    <th className="px-6 py-4 font-medium">ลูกค้า</th>
                    <th className="px-6 py-4 font-medium">จำนวนรายการ</th>
                    <th className="px-6 py-4 font-medium">จำนวนรวม</th>
                    <th className="px-6 py-4 font-medium">สถานะ</th>
                    <th className="px-6 py-4 font-medium">วันที่สร้าง</th>
                    <th className="no-print px-6 py-4 font-medium">จัดการ</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {pickingLists.map((doc) => {
                    const docTotalQty = doc.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    );

                    return (
                      <tr key={doc.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {doc.documentNo}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {doc.customer?.name || "-"}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {doc.items.length} รายการ
                        </td>

                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {docTotalQty}
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                              doc.status
                            )}`}
                          >
                            {statusText(doc.status)}
                          </span>
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {new Date(doc.createdAt).toLocaleDateString("th-TH")}
                        </td>

                        <td className="no-print px-6 py-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/picking-list/${doc.id}`}
                              className="inline-flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              <Eye size={14} />
                              ดู/Print
                            </Link>

                            <Link
                              href={`/picking-list/${doc.id}/edit`}
                              className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                            >
                              แก้ไข
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-gray-50 font-bold text-gray-900">
                  <tr>
                    <td className="px-6 py-4" colSpan={2}>
                      รวม
                    </td>
                    <td className="px-6 py-4">{totalItems} รายการ</td>
                    <td className="px-6 py-4">{totalQty}</td>
                    <td className="px-6 py-4" colSpan={3}></td>
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