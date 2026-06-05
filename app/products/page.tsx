import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/reportDate";
import ReportToolbar from "@/app/components/ReportToolbar";
import type { Product } from "@prisma/client";
import { Plus, Package, ArrowLeft, Pencil } from "lucide-react";

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

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const dateRange = getDateRange({
    from: params?.from,
    to: params?.to,
  });

  const products = await prisma.product.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalStock = products.reduce(
    (sum, product) => sum + product.stock,
    0
  );

  const totalCostValue = products.reduce(
    (sum, product) => sum + product.costPrice * product.stock,
    0
  );

  const totalSaleValue = products.reduce(
    (sum, product) => sum + product.salePrice * product.stock,
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock <= 5
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

            <h1 className="text-2xl font-bold text-gray-900">สินค้า</h1>
            <p className="mt-1 text-sm text-gray-500">
              จัดการสินค้า ต้นทุน ราคาขาย จำนวนสต๊อก และสถานะสินค้า
            </p>

            {(params?.from || params?.to) && (
              <p className="mt-2 text-sm font-medium text-[#9b7a34]">
                ช่วงรายงาน: {params?.from || "-"} ถึง {params?.to || "-"}
              </p>
            )}
          </div>

          <Link
            href="/products/new"
            className="no-print inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            เพิ่มสินค้า
          </Link>
        </div>

        <ReportToolbar report="products" title="รายงานสินค้า" />

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">จำนวนสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {products.length} รายการ
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">สต๊อกรวม</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalStock}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">มูลค่าต้นทุนสต๊อก</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {money(totalCostValue)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">สินค้าใกล้หมด</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                lowStockCount > 0 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {lowStockCount} รายการ
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-gray-900">รายการสินค้า</h2>
          </div>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1e3bf] text-[#8a6420]">
                <Package size={30} />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                ยังไม่มีสินค้า
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                เริ่มเพิ่มสินค้าก่อน เพื่อใช้ในใบจัดสินค้า ใบส่งสินค้า และใบแจ้งหนี้
              </p>

              <Link
                href="/products/new"
                className="no-print mt-5 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
              >
                เพิ่มสินค้าแรก
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">รหัสสินค้า</th>
                    <th className="px-6 py-4 font-medium">ชื่อสินค้า</th>
                    <th className="px-6 py-4 font-medium">หน่วย</th>
                    <th className="px-6 py-4 font-medium text-right">
                      ต้นทุน
                    </th>
                    <th className="px-6 py-4 font-medium text-right">
                      ราคาขาย
                    </th>
                    <th className="px-6 py-4 font-medium text-right">
                      กำไร/ชิ้น
                    </th>
                    <th className="px-6 py-4 font-medium text-right">
                      สต๊อก
                    </th>
                    <th className="px-6 py-4 font-medium">สถานะ</th>
                    <th className="no-print px-6 py-4 font-medium">
                      จัดการ
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {products.map((product: Product) => {
                    const profit = product.salePrice - product.costPrice;

                    return (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-gray-600">
                          {product.sku || "-"}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {product.name}
                          </div>
                          {product.description && (
                            <div className="mt-1 text-xs text-gray-500">
                              {product.description}
                            </div>
                          )}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {product.unit || "-"}
                        </td>

                        <td className="px-6 py-4 text-right text-gray-700">
                          {money(product.costPrice)}
                        </td>

                        <td className="px-6 py-4 text-right font-semibold text-gray-900">
                          {money(product.salePrice)}
                        </td>

                        <td
                          className={`px-6 py-4 text-right font-semibold ${
                            profit >= 0 ? "text-green-700" : "text-red-600"
                          }`}
                        >
                          {money(profit)}
                        </td>

                        <td
                          className={`px-6 py-4 text-right font-semibold ${
                            product.stock <= 5
                              ? "text-red-600"
                              : "text-gray-900"
                          }`}
                        >
                          {product.stock}
                        </td>

                        <td className="px-6 py-4">
                          {product.isActive ? (
                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                              ใช้งาน
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                              ปิดใช้งาน
                            </span>
                          )}
                        </td>

                        <td className="no-print px-6 py-4">
                          <Link
                            href={`/products/${product.id}/edit`}
                            className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-700"
                          >
                            <Pencil size={14} />
                            แก้ไข
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="bg-gray-50 font-bold text-gray-900">
                  <tr>
                    <td className="px-6 py-4" colSpan={6}>
                      รวม
                    </td>
                    <td className="px-6 py-4 text-right">{totalStock}</td>
                    <td className="px-6 py-4" colSpan={2}>
                      มูลค่าขายสต๊อก: {money(totalSaleValue)}
                    </td>
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