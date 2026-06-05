import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("GET PRODUCTS ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "").trim();
    const sku = String(body.sku || "").trim();
    const description = String(body.description || "").trim();
    const unit = String(body.unit || "").trim();

    const costPrice = Number(body.costPrice || 0);
    const salePrice = Number(body.salePrice || 0);
    const stock = Number(body.stock || 0);

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อสินค้า" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku: sku || null,
        description: description || null,
        unit: unit || null,
        costPrice,
        salePrice,
        stock,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("CREATE PRODUCT ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มสินค้าได้" },
      { status: 500 }
    );
  }
}