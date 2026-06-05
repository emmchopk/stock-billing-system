import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestItem = {
  productId: string | number;
  quantity: string | number;
  note?: string;
};

type CleanItem = {
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
  unitPrice: number;
  totalCost: number;
  totalPrice: number;
  note: string;
};

function createDocumentNo() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-5);

  return `INV-${year}${month}${day}-${time}`;
}

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
        receipts: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error("GET INVOICE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบแจ้งหนี้ได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
    const discount = Number(body.discount || 0);
    const vat = Number(body.vat || 0);
    const paidAmount = Number(body.paidAmount || 0);
    const note = String(body.note || "").trim();

    const items: RequestItem[] = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json(
        { message: "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    const cleanItems: CleanItem[] = [];

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity || 1);

      if (!productId || quantity <= 0) continue;

      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
      });

      if (!product) {
        return NextResponse.json(
          { message: "ไม่พบสินค้าบางรายการ" },
          { status: 400 }
        );
      }

      cleanItems.push({
        productId: product.id,
        productName: product.name,
        quantity,
        costPrice: product.costPrice,
        unitPrice: product.salePrice,
        totalCost: product.costPrice * quantity,
        totalPrice: product.salePrice * quantity,
        note: String(item.note || "").trim(),
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

    let status: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";

    if (paidAmount >= totalAmount) {
      status = "PAID";
    } else if (paidAmount > 0) {
      status = "PARTIAL";
    }

    const invoice = await prisma.invoice.create({
      data: {
        documentNo: createDocumentNo(),
        customerId,
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
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("CREATE INVOICE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถสร้างใบแจ้งหนี้ได้" },
      { status: 500 }
    );
  }
}