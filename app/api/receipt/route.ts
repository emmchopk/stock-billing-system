import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function createDocumentNo() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-5);

  return `RC-${year}${month}${day}-${time}`;
}

export async function GET() {
  try {
    const receipts = await prisma.receipt.findMany({
      include: {
        customer: true,
        invoice: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("GET RECEIPT ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบเสร็จรับเงินได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const invoiceId = Number(body.invoiceId || 0);
    const paymentAmount = Number(body.paymentAmount || 0);
    const paymentMethod = String(body.paymentMethod || "CASH");
    const paymentRef = String(body.paymentRef || "").trim();
    const note = String(body.note || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        { message: "กรุณาเลือกใบแจ้งหนี้" },
        { status: 400 }
      );
    }

    if (paymentAmount <= 0) {
      return NextResponse.json(
        { message: "กรุณากรอกยอดรับเงินมากกว่า 0" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "ไม่พบใบแจ้งหนี้" },
        { status: 404 }
      );
    }

    if (invoice.balanceDue <= 0) {
      return NextResponse.json(
        { message: "ใบแจ้งหนี้นี้ชำระครบแล้ว" },
        { status: 400 }
      );
    }

    if (paymentAmount > invoice.balanceDue) {
      return NextResponse.json(
        {
          message: `ยอดรับเงินมากกว่ายอดค้างชำระ ค้างชำระอยู่ ${invoice.balanceDue}`,
        },
        { status: 400 }
      );
    }

    const newPaidAmount = invoice.paidAmount + paymentAmount;
    const newBalanceDue = invoice.totalAmount - newPaidAmount;

    let newStatus: "PARTIAL" | "PAID" = "PARTIAL";

    if (newBalanceDue <= 0) {
      newStatus = "PAID";
    }

    const receipt = await prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.receipt.create({
        data: {
          documentNo: createDocumentNo(),
          customerId: invoice.customerId,
          invoiceId: invoice.id,
          subtotal: paymentAmount,
          discount: 0,
          vat: 0,
          totalAmount: paymentAmount,
          paymentMethod:
            paymentMethod as "CASH" | "TRANSFER" | "CREDIT_CARD" | "QR" | "OTHER",
          paymentRef: paymentRef || null,
          note: note || null,
          items: {
            create: invoice.items.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              quantity: item.quantity,
              costPrice: item.costPrice,
              unitPrice: item.unitPrice,
              totalCost: item.totalCost,
              totalPrice: item.totalPrice,
              note: item.note,
            })),
          },
        },
        include: {
          customer: true,
          invoice: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      await tx.invoice.update({
        where: {
          id: invoice.id,
        },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: newStatus,
        },
      });

      return createdReceipt;
    });

    return NextResponse.json(receipt, { status: 201 });
  } catch (error) {
    console.error("CREATE RECEIPT ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถสร้างใบเสร็จรับเงินได้" },
      { status: 500 }
    );
  }
}