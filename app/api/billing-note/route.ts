import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestInvoice = {
  invoiceId: string | number;
};

function createDocumentNo() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-5);

  return `BN-${year}${month}${day}-${time}`;
}

export async function GET() {
  try {
    const billingNotes = await prisma.billingNote.findMany({
      include: {
        customer: true,
        invoices: {
          include: {
            items: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(billingNotes);
  } catch (error) {
    console.error("GET BILLING NOTE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบวางบิลได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
    const note = String(body.note || "").trim();

    const invoiceItems: RequestInvoice[] = Array.isArray(body.invoices)
      ? body.invoices
      : [];

    if (!customerId) {
      return NextResponse.json(
        { message: "กรุณาเลือกลูกค้า" },
        { status: 400 }
      );
    }

    if (!invoiceItems.length) {
      return NextResponse.json(
        { message: "กรุณาเลือก Invoice อย่างน้อย 1 ใบ" },
        { status: 400 }
      );
    }

    const invoiceIds = invoiceItems
      .map((item) => Number(item.invoiceId))
      .filter((id) => id > 0);

    if (!invoiceIds.length) {
      return NextResponse.json(
        { message: "รายการ Invoice ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: invoiceIds,
        },
        customerId,
        balanceDue: {
          gt: 0,
        },
        status: {
          in: ["UNPAID", "PARTIAL"],
        },
      },
    });

    if (!invoices.length) {
      return NextResponse.json(
        { message: "ไม่พบ Invoice ที่สามารถนำมาวางบิลได้" },
        { status: 400 }
      );
    }

    const subtotal = invoices.reduce((sum, invoice) => sum + invoice.subtotal, 0);
    const discount = invoices.reduce((sum, invoice) => sum + invoice.discount, 0);
    const vat = invoices.reduce((sum, invoice) => sum + invoice.vat, 0);
    const totalAmount = invoices.reduce(
      (sum, invoice) => sum + invoice.balanceDue,
      0
    );

    const billingNote = await prisma.billingNote.create({
      data: {
        documentNo: createDocumentNo(),
        customerId,
        subtotal,
        discount,
        vat,
        totalAmount,
        status: "WAITING_PAYMENT",
        note: note || null,
        invoices: {
          connect: invoices.map((invoice) => ({
            id: invoice.id,
          })),
        },
      },
      include: {
        customer: true,
        invoices: true,
      },
    });

    return NextResponse.json(billingNote, { status: 201 });
  } catch (error) {
    console.error("CREATE BILLING NOTE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถสร้างใบวางบิลได้" },
      { status: 500 }
    );
  }
}