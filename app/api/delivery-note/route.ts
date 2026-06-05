import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RequestItem = {
  productId: string | number;
  quantity: string | number;
  note?: string;
};

type CleanItem = {
  productId: number;
  quantity: number;
  note: string;
};

function createDocumentNo() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const time = String(now.getTime()).slice(-5);

  return `DN-${year}${month}${day}-${time}`;
}

export async function GET() {
  try {
    const deliveryNotes = await prisma.deliveryNote.findMany({
      include: {
        customer: true,
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

    return NextResponse.json(deliveryNotes);
  } catch (error) {
    console.error("GET DELIVERY NOTE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบส่งสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
    const receiverName = String(body.receiverName || "").trim();
    const receiverPhone = String(body.receiverPhone || "").trim();
    const deliveryAddress = String(body.deliveryAddress || "").trim();
    const note = String(body.note || "").trim();

    const items: RequestItem[] = Array.isArray(body.items) ? body.items : [];

    if (!items.length) {
      return NextResponse.json(
        { message: "กรุณาเพิ่มสินค้าอย่างน้อย 1 รายการ" },
        { status: 400 }
      );
    }

    const cleanItems: CleanItem[] = items
      .map((item: RequestItem) => ({
        productId: Number(item.productId),
        quantity: Number(item.quantity || 1),
        note: String(item.note || "").trim(),
      }))
      .filter(
        (item: CleanItem) => item.productId > 0 && item.quantity > 0
      );

    if (!cleanItems.length) {
      return NextResponse.json(
        { message: "รายการสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    for (const item of cleanItems) {
      const product = await prisma.product.findUnique({
        where: {
          id: item.productId,
        },
      });

      if (!product) {
        return NextResponse.json(
          { message: "ไม่พบสินค้าบางรายการ" },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          {
            message: `สินค้า ${product.name} มีสต๊อกไม่พอ คงเหลือ ${product.stock}`,
          },
          { status: 400 }
        );
      }
    }

    const deliveryNote = await prisma.$transaction(async (tx) => {
      const created = await tx.deliveryNote.create({
        data: {
          documentNo: createDocumentNo(),
          customerId,
          receiverName: receiverName || null,
          receiverPhone: receiverPhone || null,
          deliveryAddress: deliveryAddress || null,
          note: note || null,
          status: "DELIVERED",
          items: {
            create: cleanItems.map((item: CleanItem) => ({
              productId: item.productId,
              quantity: item.quantity,
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

      for (const item of cleanItems) {
        await tx.product.update({
          where: {
            id: item.productId,
          },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return created;
    });

    return NextResponse.json(deliveryNote, { status: 201 });
  } catch (error) {
    console.error("CREATE DELIVERY NOTE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถสร้างใบส่งสินค้าได้" },
      { status: 500 }
    );
  }
}