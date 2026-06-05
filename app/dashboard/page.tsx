import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getDateRange } from "@/lib/reportDate";
import ReportToolbar from "@/app/components/ReportToolbar";
import {
  ArrowLeft,
  Banknote,
  FileText,
  Package,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

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

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const dateRange = getDateRange({
    from: params?.from,
    to: params?.to,
  });

  const invoices = await prisma.invoice.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
    include: {
      customer: true,
      items: true,
    },
    orderBy: {
      createdAt: "desc",
    },
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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const expenses = await prisma.expense.findMany({
    where: dateRange
      ? {
          expenseDate: dateRange,
        }
      : undefined,
    orderBy: {
      expenseDate: "desc",
    },
  });

  const products = await prisma.product.findMany();

  const customers = await prisma.customer.findMany();

  const pickingLists = await prisma.pickingList.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
  });

  const deliveryNotes = await prisma.deliveryNote.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
  });

  const billingNotes = await prisma.billingNote.findMany({
    where: dateRange
      ? {
          createdAt: dateRange,
        }
      : undefined,
  });

  const totalRevenue = invoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0
  );

  const totalPaid = invoices.reduce(
    (sum, invoice) => sum + invoice.paidAmount,
    0
  );

  const totalBalanceDue = invoices.reduce(
    (sum, invoice) => sum + invoice.balanceDue,
    0
  );

  const totalCost = invoices.reduce((sum, invoice) => {
    const itemCost = invoice.items.reduce(
      (itemSum, item) => itemSum + item.totalCost,
      0
    );

    return sum + itemCost;
  }, 0);

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpense;

  const totalStock = products.reduce(
    (sum, product) => sum + product.stock,
    0
  );

  const lowStockCount = products.filter(
    (product) => product.stock <= 5
  ).length;

  const paidInvoiceCount = invoices.filter(
    (invoice) => invoice.status === "PAID"
  ).length;

  const unpaidInvoiceCount = invoices.filter(
    (invoice) =>
      invoice.status === "UNPAID" ||
      invoice.status === "PARTIAL" ||
      invoice.status === "OVERDUE"
  ).length;

  const latestInvoices = invoices.slice(0, 8);
  const latestReceipts = receipts.slice(0, 8);
  const latestExpenses = expenses.slice(0, 8);

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
              กลับหน้าหลัก
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard สรุปต้นทุน / กำไร
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              สรุปยอดขาย ต้นทุน กำไร ค่าใช้จ่าย และยอดค้างชำระ
            </p>

            {(params?.from || params?.to) && (
              <p className="mt-2 text-sm font-medium text-[#9b7a34]">
                ช่วงรายงาน: {params?.from || "-"} ถึง {params?.to || "-"}
              </p>
            )}
          </div>
        </div>

        <ReportToolbar report="dashboard" title="รายงาน Dashboard" />

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">ยอดขายรวม</p>
              <Banknote className="text-green-700" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {money(totalRevenue)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">รับชำระแล้ว</p>
              <Receipt className="text-green-700" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {money(totalPaid)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">ค้างชำระ</p>
              <Wallet className="text-red-600" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {money(totalBalanceDue)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">ต้นทุนสินค้า</p>
              <TrendingDown className="text-orange-600" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-orange-700">
              {money(totalCost)}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">กำไรขั้นต้น</p>
              <TrendingUp
                className={grossProfit >= 0 ? "text-green-700" : "text-red-600"}
                size={22}
              />
            </div>
            <p
              className={`mt-2 text-2xl font-bold ${
                grossProfit >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              {money(grossProfit)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">ค่าใช้จ่าย</p>
              <TrendingDown className="text-red-600" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {money(totalExpense)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">กำไรสุทธิ</p>
              <TrendingUp
                className={netProfit >= 0 ? "text-green-700" : "text-red-600"}
                size={22}
              />
            </div>
            <p
              className={`mt-2 text-2xl font-bold ${
                netProfit >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              {money(netProfit)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">สต๊อกรวม</p>
              <Package className="text-gray-700" size={22} />
            </div>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {totalStock}
            </p>
            {lowStockCount > 0 && (
              <p className="mt-1 text-xs font-semibold text-red-600">
                สินค้าใกล้หมด {lowStockCount} รายการ
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <Link
            href="/products"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">สินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {products.length} รายการ
            </p>
          </Link>

          <Link
            href="/customers"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">ลูกค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {customers.length} ราย
            </p>
          </Link>

          <Link
            href="/invoice"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Invoice ชำระแล้ว</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {paidInvoiceCount} ใบ
            </p>
          </Link>

          <Link
            href="/invoice"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Invoice ค้างชำระ</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {unpaidInvoiceCount} ใบ
            </p>
          </Link>
        </div>

        <div className="mb-6 grid gap-5 md:grid-cols-4">
          <Link
            href="/picking-list"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">ใบจัดสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {pickingLists.length} ใบ
            </p>
          </Link>

          <Link
            href="/delivery-note"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">ใบส่งสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {deliveryNotes.length} ใบ
            </p>
          </Link>

          <Link
            href="/billing-note"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">ใบวางบิล</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {billingNotes.length} ใบ
            </p>
          </Link>

          <Link
            href="/receipt"
            className="rounded-3xl bg-white p-5 shadow-sm hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">ใบเสร็จรับเงิน</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {receipts.length} ใบ
            </p>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-bold text-gray-900">Invoice ล่าสุด</h2>
              <FileText size={20} className="text-gray-500" />
            </div>

            {latestInvoices.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                ยังไม่มี Invoice ในช่วงนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">เลขเอกสาร</th>
                      <th className="px-5 py-3 font-medium">ลูกค้า</th>
                      <th className="px-5 py-3 text-right font-medium">
                        ยอดรวม
                      </th>
                      <th className="px-5 py-3 text-right font-medium">
                        ค้างชำระ
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {latestInvoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {invoice.documentNo}
                        </td>

                        <td className="px-5 py-3 text-gray-600">
                          {invoice.customer?.name || "-"}
                        </td>

                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {money(invoice.totalAmount)}
                        </td>

                        <td className="px-5 py-3 text-right font-semibold text-red-600">
                          {money(invoice.balanceDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="font-bold text-gray-900">ใบเสร็จล่าสุด</h2>
              <Receipt size={20} className="text-gray-500" />
            </div>

            {latestReceipts.length === 0 ? (
              <div className="p-6 text-sm text-gray-500">
                ยังไม่มีใบเสร็จในช่วงนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">เลขใบเสร็จ</th>
                      <th className="px-5 py-3 font-medium">ลูกค้า</th>
                      <th className="px-5 py-3 text-right font-medium">
                        ยอดรับเงิน
                      </th>
                      <th className="px-5 py-3 font-medium">วันที่</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y">
                    {latestReceipts.map((receipt) => (
                      <tr key={receipt.id}>
                        <td className="px-5 py-3 font-semibold text-gray-900">
                          {receipt.documentNo}
                        </td>

                        <td className="px-5 py-3 text-gray-600">
                          {receipt.customer?.name || "-"}
                        </td>

                        <td className="px-5 py-3 text-right font-semibold text-green-700">
                          {money(receipt.totalAmount)}
                        </td>

                        <td className="px-5 py-3 text-gray-600">
                          {new Date(receipt.receiptDate).toLocaleDateString(
                            "th-TH"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b px-6 py-4">
            <h2 className="font-bold text-gray-900">ค่าใช้จ่ายล่าสุด</h2>
            <TrendingDown size={20} className="text-gray-500" />
          </div>

          {latestExpenses.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">
              ยังไม่มีค่าใช้จ่ายในช่วงนี้
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">รายการ</th>
                    <th className="px-5 py-3 font-medium">หมวดหมู่</th>
                    <th className="px-5 py-3 text-right font-medium">
                      จำนวนเงิน
                    </th>
                    <th className="px-5 py-3 font-medium">วันที่จ่าย</th>
                    <th className="px-5 py-3 font-medium">หมายเหตุ</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {latestExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="px-5 py-3 font-semibold text-gray-900">
                        {expense.title}
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {expense.category}
                      </td>

                      <td className="px-5 py-3 text-right font-semibold text-red-600">
                        {money(expense.amount)}
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {new Date(expense.expenseDate).toLocaleDateString(
                          "th-TH"
                        )}
                      </td>

                      <td className="px-5 py-3 text-gray-600">
                        {expense.note || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot className="bg-gray-50 font-bold text-gray-900">
                  <tr>
                    <td className="px-5 py-3" colSpan={2}>
                      รวมค่าใช้จ่าย
                    </td>
                    <td className="px-5 py-3 text-right text-red-600">
                      {money(totalExpense)}
                    </td>
                    <td className="px-5 py-3" colSpan={2}></td>
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