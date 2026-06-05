import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        balanceDue: {
          gt: 0,
        },
        status: {
          in: ["UNPAID", "PARTIAL"],
        },
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET UNPAID INVOICE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบแจ้งหนี้ค้างชำระได้" },
      { status: 500 }
    );
  }
}