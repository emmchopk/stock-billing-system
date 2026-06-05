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
    const pickingListId = Number(id);

    if (!pickingListId) {
      return NextResponse.json(
        { message: "รหัสใบจัดสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const pickingList = await prisma.pickingList.findUnique({
      where: {
        id: pickingListId,
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

    if (!pickingList) {
      return NextResponse.json(
        { message: "ไม่พบใบจัดสินค้า" },
        { status: 404 }
      );
    }

    return NextResponse.json(pickingList);
  } catch (error) {
    console.error("GET PICKING LIST BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบจัดสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const pickingListId = Number(id);

    if (!pickingListId) {
      return NextResponse.json(
        { message: "รหัสใบจัดสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
    const status = String(body.status || "DRAFT");
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

    const oldDoc = await prisma.pickingList.findUnique({
      where: {
        id: pickingListId,
      },
    });

    if (!oldDoc) {
      return NextResponse.json(
        { message: "ไม่พบใบจัดสินค้า" },
        { status: 404 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.pickingListItem.deleteMany({
        where: {
          pickingListId,
        },
      });

      const doc = await tx.pickingList.update({
        where: {
          id: pickingListId,
        },
        data: {
          customerId,
          status:
            status as "DRAFT" | "PICKING" | "COMPLETED" | "CANCELLED",
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
    console.error("UPDATE PICKING LIST ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขใบจัดสินค้าได้" },
      { status: 500 }
    );
  }
}