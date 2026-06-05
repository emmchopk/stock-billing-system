import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type RequestItem = {
  productId?: string | number | null;
  productName?: string;
  quantity: string | number;
  unitPrice: string | number;
  note?: string;
};

type CleanItem = {
  productId: number | null;
  productName: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
  note: string;
};

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (!invoiceId) {
      return NextResponse.json(
        { message: "รหัสใบแจ้งหนี้ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        customer: true,
        billingNote: true,
        items: {
          include: {
            product: true,
          },
        },
        receipts: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "ไม่พบใบแจ้งหนี้" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("GET INVOICE BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (!invoiceId) {
      return NextResponse.json(
        { message: "รหัสใบแจ้งหนี้ไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;

    const invoiceDate = body.invoiceDate
      ? new Date(`${body.invoiceDate}T00:00:00`)
      : new Date();

    const dueDate = body.dueDate
      ? new Date(`${body.dueDate}T00:00:00`)
      : null;

    const discount = Number(body.discount || 0);
    const vat = Number(body.vat || 0);
    const paidAmount = Number(body.paidAmount || 0);
    const note = String(body.note || "").trim();

    const items: RequestItem[] = Array.isArray(body.items)
      ? body.items
      : [];

    if (!items.length) {
      return NextResponse.json(
        { message: "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    const oldInvoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
    });

    if (!oldInvoice) {
      return NextResponse.json(
        { message: "ไม่พบใบแจ้งหนี้" },
        { status: 404 }
      );
    }

    const cleanItems: CleanItem[] = [];

    for (const item of items) {
      const productId = item.productId ? Number(item.productId) : null;
      const quantity = Number(item.quantity || 1);
      const unitPrice = Number(item.unitPrice || 0);
      const noteItem = String(item.note || "").trim();

      if (quantity <= 0) {
        continue;
      }

      let productName = String(item.productName || "").trim();
      let costPrice = 0;

      if (productId) {
        const product = await prisma.product.findUnique({
          where: {
            id: productId,
          },
        });

        if (!product) {
          return NextResponse.json(
            { message: "พบสินค้าบางรายการไม่ถูกต้อง" },
            { status: 400 }
          );
        }

        productName = product.name;
        costPrice = product.costPrice;
      }

      if (!productName) {
        return NextResponse.json(
          { message: "กรุณากรอกชื่อสินค้าให้ครบ" },
          { status: 400 }
        );
      }

      cleanItems.push({
        productId,
        productName,
        quantity,
        costPrice,
        unitPrice,
        totalCost: costPrice * quantity,
        totalPrice: unitPrice * quantity,
        note: noteItem,
      });
    }

    if (!cleanItems.length) {
      return NextResponse.json(
        { message: "รายการสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const subtotal = cleanItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0
    );

    const totalAmount = subtotal - discount + vat;
    const balanceDue = totalAmount - paidAmount;

    let status: "DRAFT" | "UNPAID" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" =
      "UNPAID";

    if (String(body.status || "") === "CANCELLED") {
      status = "CANCELLED";
    } else if (String(body.status || "") === "DRAFT") {
      status = "DRAFT";
    } else if (paidAmount <= 0) {
      status = "UNPAID";
    } else if (paidAmount >= totalAmount) {
      status = "PAID";
    } else {
      status = "PARTIAL";
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({
        where: {
          invoiceId,
        },
      });

      const doc = await tx.invoice.update({
        where: {
          id: invoiceId,
        },
        data: {
          customerId,
          invoiceDate,
          dueDate,
          subtotal,
          discount,
          vat,
          totalAmount,
          paidAmount,
          balanceDue,
          status,
          note: note || null,
          items: {
            create: cleanItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              costPrice: item.costPrice,
              unitPrice: item.unitPrice,
              totalCost: item.totalCost,
              totalPrice: item.totalPrice,
              note: item.note || null,
            })),
          },
        },
        include: {
          customer: true,
          items: true,
        },
      });

      return doc;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE INVOICE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขใบแจ้งหนี้ได้" },
      { status: 500 }
    );
  }
}