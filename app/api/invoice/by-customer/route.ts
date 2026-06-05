import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = Number(searchParams.get("customerId") || 0);

    if (!customerId) {
      return NextResponse.json([]);
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        customerId,
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
    console.error("GET INVOICE BY CUSTOMER ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึง Invoice ของลูกค้านี้ได้" },
      { status: 500 }
    );
  }
}