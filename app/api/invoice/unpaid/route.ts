import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        balanceDue: {
          gt: 0,
        },
        status: {
          notIn: ["CANCELLED", "DRAFT"],
        },
      },
      include: {
        customer: true,
        items: true,
        receipts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET UNPAID INVOICES ERROR:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถดึงรายการ Invoice ค้างชำระได้",
      },
      {
        status: 500,
      }
    );
  }
}