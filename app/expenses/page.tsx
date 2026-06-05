import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowLeft, Plus, Wallet } from "lucide-react";

function money(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function categoryText(value: string) {
  if (value === "PRODUCT_COST") return "ต้นทุนสินค้า";
  if (value === "SHIPPING") return "ค่าขนส่ง";
  if (value === "PACKAGING") return "แพ็กเกจจิ้ง";
  if (value === "SALARY") return "เงินเดือน";
  if (value === "RENT") return "ค่าเช่า";
  if (value === "MARKETING") return "การตลาด";
  if (value === "OTHER") return "อื่น ๆ";
  return value;
}

export default async function ExpensesPage() {
  const expenses = await prisma.expense.findMany({
    orderBy: {
      expenseDate: "desc",
    },
  });

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  return (
    <main className="min-h-screen bg-[#f7f3ea] px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <Link
              href="/dashboard"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900"
            >
              <ArrowLeft size={16} />
              กลับหน้า Dashboard
            </Link>

            <h1 className="text-2xl font-bold text-gray-900">รายจ่าย</h1>
            <p className="mt-1 text-sm text-gray-500">
              บันทึกรายจ่ายอื่น ๆ เพื่อนำไปคำนวณกำไรสุทธิ
            </p>
          </div>

          <Link
            href="/expenses/new"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={18} />
            เพิ่มรายจ่าย
          </Link>
        </div>

        <div className="mb-6 rounded-3xl bg-gray-900 p-6 text-white">
          <p className="text-sm text-gray-300">รายจ่ายรวม</p>
          <p className="mt-2 text-3xl font-bold">{money(totalExpense)}</p>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="border-b px-6 py-4">
            <h2 className="font-bold text-gray-900">รายการรายจ่าย</h2>
          </div>

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#f1e3bf] text-[#8a6420]">
                <Wallet size={30} />
              </div>

              <h3 className="text-lg font-bold text-gray-900">
                ยังไม่มีรายจ่าย
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                เพิ่มรายจ่าย เช่น ค่าขนส่ง ค่าแพ็กของ ค่าโฆษณา ค่าเช่า
              </p>

              <Link
                href="/expenses/new"
                className="mt-5 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
              >
                เพิ่มรายจ่ายแรก
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">รายการ</th>
                    <th className="px-6 py-4 font-medium">ประเภท</th>
                    <th className="px-6 py-4 font-medium text-right">
                      จำนวนเงิน
                    </th>
                    <th className="px-6 py-4 font-medium">หมายเหตุ</th>
                    <th className="px-6 py-4 font-medium">วันที่</th>
                  </tr>
                </thead>

                <tbody className="divide-y">
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {expense.title}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {categoryText(expense.category)}
                      </td>

                      <td className="px-6 py-4 text-right font-semibold text-red-600">
                        {money(expense.amount)}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {expense.note || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {new Date(expense.expenseDate).toLocaleDateString(
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
    </main>
  );
}