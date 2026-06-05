import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function GET(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const deliveryNoteId = Number(id);

    if (!deliveryNoteId) {
      return NextResponse.json(
        { message: "รหัสใบส่งสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const deliveryNote = await prisma.deliveryNote.findUnique({
      where: {
        id: deliveryNoteId,
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

    if (!deliveryNote) {
      return NextResponse.json(
        { message: "ไม่พบใบส่งสินค้า" },
        { status: 404 }
      );
    }

    return NextResponse.json(deliveryNote);
  } catch (error) {
    console.error("GET DELIVERY NOTE BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบส่งสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const deliveryNoteId = Number(id);

    if (!deliveryNoteId) {
      return NextResponse.json(
        { message: "รหัสใบส่งสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
    const status = String(body.status || "DRAFT");

    const receiverName = String(body.receiverName || "").trim();
    const receiverPhone = String(body.receiverPhone || "").trim();
    const deliveryAddress = String(body.deliveryAddress || "").trim();
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

    const oldDoc = await prisma.deliveryNote.findUnique({
      where: {
        id: deliveryNoteId,
      },
      include: {
        items: true,
      },
    });

    if (!oldDoc) {
      return NextResponse.json(
        { message: "ไม่พบใบส่งสินค้า" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      for (const oldItem of oldDoc.items) {
        await tx.product.update({
          where: {
            id: oldItem.productId,
          },
          data: {
            stock: {
              increment: oldItem.quantity,
            },
          },
        });
      }

      await tx.deliveryNoteItem.deleteMany({
        where: {
          deliveryNoteId,
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

      const doc = await tx.deliveryNote.update({
        where: {
          id: deliveryNoteId,
        },
        data: {
          customerId,
          status:
            status as "DRAFT" | "DELIVERING" | "DELIVERED" | "CANCELLED",
          receiverName: receiverName || null,
          receiverPhone: receiverPhone || null,
          deliveryAddress: deliveryAddress || null,
          note: note || null,
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

      return doc;
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("UPDATE DELIVERY NOTE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขใบส่งสินค้าได้" },
      { status: 500 }
    );
  }
}