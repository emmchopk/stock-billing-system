import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function createDocumentNo() {
  const now = new Date();

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-5);

  return `RC-${y}${m}${d}-${time}`;
}

export async function GET() {
  try {
    const receipts = await prisma.receipt.findMany({
      include: {
        customer: true,
        invoice: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error("GET RECEIPTS ERROR:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถดึงข้อมูลใบเสร็จรับเงินได้",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const invoiceId = body.invoiceId ? Number(body.invoiceId) : null;
    const totalAmount = Number(body.totalAmount || 0);

    const receiptDate = body.receiptDate
      ? new Date(`${body.receiptDate}T00:00:00`)
      : new Date();

    const paymentMethod = String(body.paymentMethod || "CASH");
    const paymentRef = String(body.paymentRef || "").trim();
    const note = String(body.note || "").trim();

    if (!invoiceId) {
      return NextResponse.json(
        {
          message: "กรุณาเลือกใบแจ้งหนี้",
        },
        {
          status: 400,
        }
      );
    }

    if (totalAmount <= 0) {
      return NextResponse.json(
        {
          message: "ยอดรับเงินต้องมากกว่า 0",
        },
        {
          status: 400,
        }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        customer: true,
        items: true,
        receipts: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        {
          message: "ไม่พบใบแจ้งหนี้",
        },
        {
          status: 404,
        }
      );
    }

    if (!invoice.customerId) {
      return NextResponse.json(
        {
          message: "ใบแจ้งหนี้นี้ยังไม่มีข้อมูลลูกค้า",
        },
        {
          status: 400,
        }
      );
    }

    if (invoice.status === "CANCELLED") {
      return NextResponse.json(
        {
          message: "ไม่สามารถออกใบเสร็จให้ใบแจ้งหนี้ที่ยกเลิกแล้ว",
        },
        {
          status: 400,
        }
      );
    }

    if (invoice.status === "DRAFT") {
      return NextResponse.json(
        {
          message: "กรุณาเปลี่ยนใบแจ้งหนี้จากร่างเป็นยังไม่ชำระก่อน",
        },
        {
          status: 400,
        }
      );
    }

    if (invoice.balanceDue <= 0) {
      return NextResponse.json(
        {
          message: "ใบแจ้งหนี้นี้ชำระครบแล้ว ไม่สามารถออกใบเสร็จซ้ำได้",
        },
        {
          status: 400,
        }
      );
    }

    if (totalAmount > invoice.balanceDue) {
      return NextResponse.json(
        {
          message: `ยอดรับเงินมากกว่ายอดค้างชำระ ค้างชำระปัจจุบัน ${invoice.balanceDue} บาท`,
        },
        {
          status: 400,
        }
      );
    }

    const newPaidAmount = invoice.paidAmount + totalAmount;
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
    } else if (newBalanceDue <= 0) {
      invoiceStatus = "PAID";
    } else {
      invoiceStatus = "PARTIAL";
    }

    const receipt = await prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.receipt.create({
        data: {
          documentNo: createDocumentNo(),
          invoiceId: invoice.id,
          customerId: invoice.customerId,
          receiptDate,

          subtotal: totalAmount,
          discount: 0,
          vat: 0,
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
          id: invoice.id,
        },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: newBalanceDue,
          status: invoiceStatus,
        },
      });

      return createdReceipt;
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error("CREATE RECEIPT ERROR:", error);

    return NextResponse.json(
      {
        message: "ไม่สามารถสร้างใบเสร็จรับเงินได้",
      },
      {
        status: 500,
      }
    );
  }
}