import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Package,
  Receipt,
  Truck,
  Users,
  Wallet,
  Plus,
  Banknote,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value || 0);
}

export default async function HomePage() {
  const [
    products,
    customers,
    pickingLists,
    deliveryNotes,
    billingNotes,
    invoices,
    receipts,
    expenses,
  ] = await Promise.all([
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.pickingList.findMany(),
    prisma.deliveryNote.findMany(),
    prisma.billingNote.findMany(),
    prisma.invoice.findMany({
      include: {
        items: true,
      },
    }),
    prisma.receipt.findMany(),
    prisma.expense.findMany(),
  ]);

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

  const lowStockCount = products.filter(
    (product) => product.stock <= 5
  ).length;

  const menuItems = [
    {
      title: "Dashboard",
      description: "สรุปยอดขาย ต้นทุน กำไร และรายงานรายวัน/เดือน/ปี",
      href: "/dashboard",
      icon: BarChart3,
      count: "รายงาน",
    },
    {
      title: "สินค้า",
      description: "เพิ่ม/แก้ไขสินค้า ต้นทุน ราคาขาย และสต๊อก",
      href: "/products",
      newHref: "/products/new",
      icon: Package,
      count: `${products.length} รายการ`,
    },
    {
      title: "ลูกค้า",
      description: "เพิ่ม/แก้ไขข้อมูลลูกค้า เบอร์โทร อีเมล และที่อยู่",
      href: "/customers",
      newHref: "/customers/new",
      icon: Users,
      count: `${customers.length} ราย`,
    },
    {
      title: "ใบจัดสินค้า",
      description: "เอกสารให้คลังจัดเตรียมสินค้าก่อนส่ง",
      href: "/picking-list",
      newHref: "/picking-list/new",
      icon: ClipboardList,
      count: `${pickingLists.length} ใบ`,
    },
    {
      title: "ใบส่งสินค้า",
      description: "เอกสารส่งสินค้า พร้อมตัดสต๊อกสินค้า",
      href: "/delivery-note",
      newHref: "/delivery-note/new",
      icon: Truck,
      count: `${deliveryNotes.length} ใบ`,
    },
    {
      title: "ใบวางบิล",
      description: "รวม Invoice ค้างชำระ เพื่อวางบิลลูกค้า",
      href: "/billing-note",
      newHref: "/billing-note/new",
      icon: Wallet,
      count: `${billingNotes.length} ใบ`,
    },
    {
      title: "ใบแจ้งหนี้",
      description: "ออก Invoice แจ้งยอดที่ลูกค้าต้องชำระ",
      href: "/invoice",
      newHref: "/invoice/new",
      icon: FileText,
      count: `${invoices.length} ใบ`,
    },
    {
      title: "ใบเสร็จรับเงิน",
      description: "บันทึกรับเงิน และอัปเดตยอดชำระของ Invoice",
      href: "/receipt",
      newHref: "/receipt/new",
      icon: Receipt,
      count: `${receipts.length} ใบ`,
    },
    {
      title: "ค่าใช้จ่าย",
      description: "บันทึกค่าใช้จ่ายเพื่อคำนวณกำไรสุทธิ",
      href: "/expenses",
      newHref: "/expenses/new",
      icon: TrendingDown,
      count: `${expenses.length} รายการ`,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-6 rounded-[2rem] bg-gray-900 p-8 text-white shadow-sm">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d6b46a]">
                Stock & Billing System
              </p>

              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                ระบบสต๊อกสินค้า + เอกสารขาย
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-300">
                จัดการสินค้า ลูกค้า ใบจัดสินค้า ใบส่งสินค้า ใบวางบิล
                ใบแจ้งหนี้ ใบเสร็จรับเงิน พร้อม Dashboard สรุปต้นทุนและกำไร
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-100"
              >
                เปิด Dashboard
              </Link>

              <Link
                href="/invoice/new"
                className="rounded-2xl bg-[#d6b46a] px-5 py-3 text-sm font-semibold text-gray-900 hover:bg-[#caa24f]"
              >
                สร้างใบแจ้งหนี้
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-5 md:grid-cols-4">
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
        </section>

        <section className="mb-6 grid gap-5 md:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">ต้นทุนสินค้า</p>
            <p className="mt-2 text-2xl font-bold text-orange-700">
              {money(totalCost)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">กำไรขั้นต้น</p>
            <p
              className={`mt-2 text-2xl font-bold ${
                grossProfit >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              {money(grossProfit)}
            </p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">ค่าใช้จ่าย</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {money(totalExpense)}
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
        </section>

        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.href}
                className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#f1e3bf] text-[#8a6420]">
                    <Icon size={26} />
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {item.count}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-900">
                  {item.title}
                </h2>

                <p className="mt-2 min-h-[44px] text-sm leading-6 text-gray-500">
                  {item.description}
                </p>

                <div className="mt-5 flex gap-3">
                  <Link
                    href={item.href}
                    className="flex-1 rounded-2xl bg-gray-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
                  >
                    เปิดดู
                  </Link>

                  {item.newHref && (
                    <Link
                      href={item.newHref}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Plus size={16} />
                      เพิ่ม
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}