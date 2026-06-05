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

  return `PK-${year}${month}${day}-${time}`;
}

export async function GET() {
  try {
    const pickingLists = await prisma.pickingList.findMany({
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

    return NextResponse.json(pickingLists);
  } catch (error) {
    console.error("GET PICKING LIST ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลใบจัดสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const customerId = body.customerId ? Number(body.customerId) : null;
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
        (item: CleanItem) =>
          item.productId > 0 && item.quantity > 0
      );

    if (!cleanItems.length) {
      return NextResponse.json(
        { message: "รายการสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const pickingList = await prisma.pickingList.create({
      data: {
        documentNo: createDocumentNo(),
        customerId,
        note: note || null,
        status: "DRAFT",
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

    return NextResponse.json(pickingList, { status: 201 });
  } catch (error) {
    console.error("CREATE PICKING LIST ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถสร้างใบจัดสินค้าได้" },
      { status: 500 }
    );
  }
}