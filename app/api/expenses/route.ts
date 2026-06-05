import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        expenseDate: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("GET EXPENSES ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลรายจ่ายได้" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const title = String(body.title || "").trim();
    const category = String(body.category || "OTHER");
    const amount = Number(body.amount || 0);
    const note = String(body.note || "").trim();

    if (!title) {
      return NextResponse.json(
        { message: "กรุณากรอกชื่อรายจ่าย" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { message: "กรุณากรอกจำนวนเงินมากกว่า 0" },
        { status: 400 }
      );
    }

    const expense = await prisma.expense.create({
      data: {
        title,
        category:
          category as
            | "PRODUCT_COST"
            | "SHIPPING"
            | "PACKAGING"
            | "SALARY"
            | "RENT"
            | "MARKETING"
            | "OTHER",
        amount,
        note: note || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("CREATE EXPENSE ERROR:", error);

    return NextResponse.json(
      { message: "ไม่สามารถเพิ่มรายจ่ายได้" },
      { status: 500 }
    );
  }
}