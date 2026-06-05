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
    const customerId = Number(id);

    if (!customerId) {
      return NextResponse.json(
        { message: "รหัสลูกค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.findUnique({
      where: {
        id: customerId,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { message: "ไม่พบลูกค้า" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("GET CUSTOMER BY ID ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลลูกค้าได้" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: RouteProps) {
  try {
    const { id } = await params;
    const customerId = Number(id);

    if (!customerId) {
      return NextResponse.json(
        { message: "รหัสลูกค้าไม่ถูกต้อง" },
        { status: 400 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const phone = String(body.phone || "").trim();
    const email = String(body.email || "").trim();
    const address = String(body.address || "").trim();

    if (!name) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อลูกค้า" },
        { status: 400 }
      );
    }

    const customer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error("UPDATE CUSTOMER ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขลูกค้าได้" },
      { status: 500 }
    );
  }
}