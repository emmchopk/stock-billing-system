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
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      return NextResponse.json(
        { message: "ไม่พบสินค้า" },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("GET PRODUCT BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลสินค้าได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const productId = Number(id);

    if (!productId) {
      return NextResponse.json(
        { message: "รหัสสินค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const sku = String(body.sku || "").trim();
    const description = String(body.description || "").trim();
    const unit = String(body.unit || "").trim();

    const costPrice = Number(body.costPrice || 0);
    const salePrice = Number(body.salePrice || 0);
    const stock = Number(body.stock || 0);
    const isActive = Boolean(body.isActive);

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อสินค้า" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        name,
        sku: sku || null,
        description: description || null,
        unit: unit || null,
        costPrice,
        salePrice,
        stock,
        isActive,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("UPDATE PRODUCT ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขสินค้าได้" },
      { status: 500 }
    );
  }
}