import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type RequestInvoice = {
  invoiceId: string | number;
};

type CleanInvoice = {
  invoiceId: number;
};

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const billingNoteId = Number(id);

    if (!billingNoteId) {
      return NextResponse.json(
        { message: "รหัสใบวางบิลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const billingNote = await prisma.billingNote.findUnique({
      where: {
        id: billingNoteId,
      },
      include: {
        customer: true,
        invoices: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!billingNote) {
      return NextResponse.json(
        { message: "ไม่พบใบวางบิล" },
        { status: 404 }
      );
    }

    return NextResponse.json(billingNote);
  } catch (error) {
    console.error("GET BILLING NOTE BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบวางบิลได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const billingNoteId = Number(id);

    if (!billingNoteId) {
      return NextResponse.json(
        { message: "รหัสใบวางบิลไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
    const status = String(body.status || "DRAFT");
    const billingDate = body.billingDate
      ? new Date(`${body.billingDate}T00:00:00`)
      : new Date();

    const dueDate = body.dueDate
      ? new Date(`${body.dueDate}T00:00:00`)
      : null;

    const discount = Number(body.discount || 0);
    const vat = Number(body.vat || 0);
    const note = String(body.note || "").trim();

    const invoices: RequestInvoice[] = Array.isArray(body.invoices)
      ? body.invoices
      : [];

    if (!customerId) {
      return NextResponse.json(
        { message: "กรุณาเลือกลูกค้า" },
        { status: 400 }
      );
    }

    if (!invoices.length) {
      return NextResponse.json(
        { message: "กรุณาเลือก Invoice อย่างน้อย 1 ใบ" },
        { status: 400 }
      );
    }

    const cleanInvoices: CleanInvoice[] = invoices
      .map((item: RequestInvoice) => ({
        invoiceId: Number(item.invoiceId),
      }))
      .filter((item: CleanInvoice) => item.invoiceId > 0);

    if (!cleanInvoices.length) {
      return NextResponse.json(
        { message: "รายการ Invoice ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const oldDoc = await prisma.billingNote.findUnique({
      where: {
        id: billingNoteId,
      },
    });

    if (!oldDoc) {
      return NextResponse.json(
        { message: "ไม่พบใบวางบิล" },
        { status: 404 }
      );
    }

    const invoiceIds = cleanInvoices.map((item) => item.invoiceId);

    const selectedInvoices = await prisma.invoice.findMany({
      where: {
        id: {
          in: invoiceIds,
        },
      },
    });

    if (selectedInvoices.length !== invoiceIds.length) {
      return NextResponse.json(
        { message: "พบ Invoice บางใบไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const subtotal = selectedInvoices.reduce(
      (sum, invoice) => sum + invoice.balanceDue,
      0
    );

    const totalAmount = subtotal - discount + vat;

    const updated = await prisma.billingNote.update({
      where: {
        id: billingNoteId,
      },
      data: {
        customerId,
        billingDate,
        dueDate,
        subtotal,
        discount,
        vat,
        totalAmount,
        status:
          status as "DRAFT" | "WAITING_PAYMENT" | "PAID" | "CANCELLED",
        note: note || null,
        invoices: {
          set: invoiceIds.map((invoiceId) => ({
            id: invoiceId,
          })),
        },
      },
      include: {
        customer: true,
        invoices: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE BILLING NOTE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขใบวางบิลได้" },
      { status: 500 }
    );
  }
}