import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const receiptId = Number(id);

    if (!receiptId) {
      return NextResponse.json(
        { message: "รหัสใบเสร็จไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const receipt = await prisma.receipt.findUnique({
      where: {
        id: receiptId,
      },
      include: {
        customer: true,
        invoice: {
          include: {
            customer: true,
            items: true,
          },
        },
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!receipt) {
      return NextResponse.json(
        { message: "ไม่พบใบเสร็จรับเงิน" },
        { status: 404 }
      );
    }

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("GET RECEIPT BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบเสร็จรับเงินได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const receiptId = Number(id);

    if (!receiptId) {
      return NextResponse.json(
        { message: "รหัสใบเสร็จไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const invoiceId = body.invoiceId ? Number(body.invoiceId) : null;
    const customerId = body.customerId ? Number(body.customerId) : null;

    const receiptDate = body.receiptDate
      ? new Date(`${body.receiptDate}T00:00:00`)
      : new Date();

    const discount = Number(body.discount || 0);
    const vat = Number(body.vat || 0);
    const totalAmount = Number(body.totalAmount || 0);

    const paymentMethod = String(body.paymentMethod || "CASH");
    const paymentRef = String(body.paymentRef || "").trim();
    const note = String(body.note || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        { message: "กรุณาเลือก Invoice" },
        { status: 400 }
      );
    }

    if (!customerId) {
      return NextResponse.json(
        { message: "ไม่พบข้อมูลลูกค้า" },
        { status: 400 }
      );
    }

    if (totalAmount <= 0) {
      return NextResponse.json(
        { message: "ยอดรับเงินต้องมากกว่า 0" },
        { status: 400 }
      );
    }

    const oldReceipt = await prisma.receipt.findUnique({
      where: {
        id: receiptId,
      },
      include: {
        items: true,
      },
    });

    if (!oldReceipt) {
      return NextResponse.json(
        { message: "ไม่พบใบเสร็จรับเงิน" },
        { status: 404 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        items: true,
        receipts: {
          where: {
            id: {
              not: receiptId,
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { message: "ไม่พบ Invoice" },
        { status: 404 }
      );
    }

    const otherPaidAmount = invoice.receipts.reduce(
      (sum, receipt) => sum + receipt.totalAmount,
      0
    );

    const newPaidAmount = otherPaidAmount + totalAmount;
    const newBalanceDue = invoice.totalAmount - newPaidAmount;

    let invoiceStatus:
      | "DRAFT"
      | "UNPAID"
      | "PARTIAL"
      | "PAID"
      | "OVERDUE"
      | "CANCELLED" = "UNPAID";

    if (newPaidAmount <= 0) {
      invoiceStatus = "UNPAID";
    } else if (newPaidAmount >= invoice.totalAmount) {
      invoiceStatus = "PAID";
    } else {
      invoiceStatus = "PARTIAL";
    }

    const receiptSubtotal = totalAmount - vat + discount;

    const updated = await prisma.$transaction(async (tx) => {
      await tx.receiptItem.deleteMany({
        where: {
          receiptId,
        },
      });

      const receipt = await tx.receipt.update({
        where: {
          id: receiptId,
        },
        data: {
          invoiceId,
          customerId,
          receiptDate,
          subtotal: receiptSubtotal,
          discount,
          vat,
          totalAmount,
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
          items: true,
        },
      });

      await tx.invoice.update({
        where: {
          id: invoiceId,
        },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: invoiceStatus,
        },
      });

      return receipt;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE RECEIPT ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขใบเสร็จรับเงินได้" },
      { status: 500 }
    );
  }
}