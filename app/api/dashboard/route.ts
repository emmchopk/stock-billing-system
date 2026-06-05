import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        items: true,
      },
    });

    const receipts = await prisma.receipt.findMany();

    const expenses = await prisma.expense.findMany();

    const products = await prisma.product.findMany({
      orderBy: {
        stock: "asc",
      },
      take: 10,
    });

    const totalSales = invoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0
    );

    const totalPaid = receipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0
    );

    const totalBalanceDue = invoices.reduce(
      (sum, invoice) => sum + invoice.balanceDue,
      0
    );

    const totalProductCost = invoices.reduce((sum, invoice) => {
      const invoiceCost = invoice.items.reduce(
        (itemSum, item) => itemSum + item.totalCost,
        0
      );

      return sum + invoiceCost;
    }, 0);

    const totalExpense = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const grossProfit = totalSales - totalProductCost;
    const netProfit = grossProfit - totalExpense;

    const invoiceCount = invoices.length;
    const receiptCount = receipts.length;
    const expenseCount = expenses.length;

    const unpaidInvoiceCount = invoices.filter(
      (invoice) => invoice.balanceDue > 0
    ).length;

    return NextResponse.json({
      totalSales,
      totalPaid,
      totalBalanceDue,
      totalProductCost,
      totalExpense,
      grossProfit,
      netProfit,
      invoiceCount,
      receiptCount,
      expenseCount,
      unpaidInvoiceCount,
      lowStockProducts: products,
    });
  } catch (error) {
    console.error("GET DASHBOARD ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูล Dashboard ได้" },
      { status: 500 }
    );
  }
}