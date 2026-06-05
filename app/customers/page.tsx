import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/reportDate";
import ReportToolbar from "@/app/components/ReportToolbar";
import type { Customer } from "@prisma/client";
import { ArrowLeft, Pencil, Plus, Users } from "lucide-react";

type PageProps = {
  searchParams?: Promise<{
    from?: string;
    to?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const dateRange = getDateRange({
    from: params?.from,
    to: params?.to,
  });

  const customers = await prisma.customer.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
    include: {
      invoices: true,
      receipts: true,
      deliveryNotes: true,
      billingNotes: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const customerCount = customers.length;

  const invoiceCount = customers.reduce(
    (sum, customer) => sum + customer.invoices.length,
    0
  );

  const receiptCount = customers.reduce(
    (sum, customer) => sum + customer.receipts.length,
    0
  );

  const deliveryCount = customers.reduce(
    (sum, customer) => sum + customer.deliveryNotes.length,
    0
  );

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

            <h1 className="text-2xl font-bold text-gray-900">ลูกค้า</h1>

            <p className="mt-1 text-sm text-gray-500">
              จัดการข้อมูลลูกค้า ที่อยู่ เบอร์โทร และอีเมล
            </p>

            {(params?.from || params?.to) && (
              <p className="mt-2 text-sm font-medium text-[#9b7a34]">
                ช่วงรายงาน: {params?.from || "-"} ถึง {params?.to || "-"}
              </p>
            )}
          </div>

          <Link
            href="/customers/new"
            className="no-print inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            เพิ่มลูกค้า
          </Link>
        </div>

        <ReportToolbar report="customers" title="รายงานลูกค้า" />

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนลูกค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {customerCount} ราย
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">Invoice รวม</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {invoiceCount} ใบ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">ใบเสร็จรวม</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {receiptCount} ใบ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">ใบส่งสินค้ารวม</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {deliveryCount} ใบ
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-gray-900">รายการลูกค้า</h2>
          </div>

          {customers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1e3bf] text-[#8a6420]">
                <Users size={30} />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                ยังไม่มีลูกค้า
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                เริ่มเพิ่มข้อมูลลูกค้าก่อน เพื่อใช้ในเอกสารต่าง ๆ
              </p>

              <Link
                href="/customers/new"
                className="no-print mt-5 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
              >
                เพิ่มลูกค้าคนแรก
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">ชื่อลูกค้า</th>
                    <th className="px-6 py-4 font-medium">เบอร์โทร</th>
                    <th className="px-6 py-4 font-medium">อีเมล</th>
                    <th className="px-6 py-4 font-medium">ที่อยู่</th>
                    <th className="px-6 py-4 font-medium text-center">
                      Invoice
                    </th>
                    <th className="px-6 py-4 font-medium text-center">
                      ใบเสร็จ
                    </th>
                    <th className="px-6 py-4 font-medium">วันที่เพิ่ม</th>
                    <th className="no-print px-6 py-4 font-medium">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {customer.name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {customer.phone || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {customer.email || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {customer.address || "-"}
                      </td>

                      <td className="px-6 py-4 text-center text-gray-600">
                        {customer.invoices.length}
                      </td>

                      <td className="px-6 py-4 text-center text-gray-600">
                        {customer.receipts.length}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(customer.createdAt).toLocaleDateString(
                          "th-TH"
                        )}
                      </td>

                      <td className="no-print px-6 py-4">
                        <Link
                          href={`/customers/${customer.id}/edit`}
                          className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                        >
                          <Pencil size={14} />
                          แก้ไข
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-gray-50 font-bold text-gray-900">
                  <tr>
                    <td className="px-6 py-4" colSpan={4}>
                      รวม
                    </td>
                    <td className="px-6 py-4 text-center">{invoiceCount}</td>
                    <td className="px-6 py-4 text-center">{receiptCount}</td>
                    <td className="px-6 py-4" colSpan={2}></td>
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