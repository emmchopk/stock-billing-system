import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { formatThaiDate, getDateRange } from "@/lib/reportDate";

export const dynamic = "force-dynamic";

type ExcelValue = string | number | boolean | null;
type ExcelRow = Record<string, ExcelValue>;

function makeExcel(rows: ExcelRow[], sheetName: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const buffer = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
  }) as Buffer;

  return buffer;
}

function excelResponse(buffer: Buffer, filename: string) {
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const report = searchParams.get("report") || "dashboard";
    const from = searchParams.get("from") || undefined;
    const to = searchParams.get("to") || undefined;

    const dateRange = getDateRange({
      from,
      to,
    });

    if (report === "products") {
      const products = await prisma.product.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
        orderBy: {
          createdAt: "desc",
        },
      });

      const rows: ExcelRow[] = products.map((product) => ({
        รหัสสินค้า: product.sku || "-",
        ชื่อสินค้า: product.name,
        รายละเอียด: product.description || "-",
        หน่วย: product.unit || "-",
        ต้นทุน: product.costPrice,
        ราคาขาย: product.salePrice,
        กำไรต่อชิ้น: product.salePrice - product.costPrice,
        สต๊อก: product.stock,
        สถานะ: product.isActive ? "ใช้งาน" : "ปิดใช้งาน",
        วันที่เพิ่ม: formatThaiDate(product.createdAt),
      }));

      return excelResponse(makeExcel(rows, "Products"), "products-report.xlsx");
    }

    if (report === "customers") {
      const customers = await prisma.customer.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
        include: {
          invoices: true,
          receipts: true,
          deliveryNotes: true,
          billingNotes: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const rows: ExcelRow[] = customers.map((customer) => ({
        ชื่อลูกค้า: customer.name,
        เบอร์โทร: customer.phone || "-",
        อีเมล: customer.email || "-",
        ที่อยู่: customer.address || "-",
        จำนวนใบส่งสินค้า: customer.deliveryNotes.length,
        จำนวนใบวางบิล: customer.billingNotes.length,
        จำนวนใบแจ้งหนี้: customer.invoices.length,
        จำนวนใบเสร็จ: customer.receipts.length,
        วันที่เพิ่ม: formatThaiDate(customer.createdAt),
      }));

      return excelResponse(
        makeExcel(rows, "Customers"),
        "customers-report.xlsx"
      );
    }

    if (report === "picking-list") {
      const pickingLists = await prisma.pickingList.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
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

      const rows: ExcelRow[] = pickingLists.flatMap((doc) =>
        doc.items.map((item, index) => ({
          เลขใบจัดสินค้า: doc.documentNo,
          ลูกค้า: doc.customer?.name || "-",
          ลำดับ: index + 1,
          รหัสสินค้า: item.product.sku || "-",
          สินค้า: item.product.name,
          จำนวน: item.quantity,
          หน่วย: item.product.unit || "-",
          สถานะ: doc.status,
          หมายเหตุเอกสาร: doc.note || "-",
          หมายเหตุรายการ: item.note || "-",
          วันที่สร้าง: formatThaiDate(doc.createdAt),
        }))
      );

      return excelResponse(
        makeExcel(rows, "Picking List"),
        "picking-list-report.xlsx"
      );
    }

    if (report === "delivery-note") {
      const deliveryNotes = await prisma.deliveryNote.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
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

      const rows: ExcelRow[] = deliveryNotes.flatMap((doc) =>
        doc.items.map((item, index) => ({
          เลขใบส่งสินค้า: doc.documentNo,
          ลูกค้า: doc.customer?.name || "-",
          ผู้รับ: doc.receiverName || "-",
          เบอร์ผู้รับ: doc.receiverPhone || "-",
          ที่อยู่จัดส่ง: doc.deliveryAddress || "-",
          ลำดับ: index + 1,
          รหัสสินค้า: item.product.sku || "-",
          สินค้า: item.product.name,
          จำนวน: item.quantity,
          หน่วย: item.product.unit || "-",
          สถานะ: doc.status,
          หมายเหตุเอกสาร: doc.note || "-",
          หมายเหตุรายการ: item.note || "-",
          วันที่ส่งสินค้า: formatThaiDate(doc.deliveryDate),
          วันที่สร้าง: formatThaiDate(doc.createdAt),
        }))
      );

      return excelResponse(
        makeExcel(rows, "Delivery Note"),
        "delivery-note-report.xlsx"
      );
    }

    if (report === "billing-note") {
      const billingNotes = await prisma.billingNote.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
        include: {
          customer: true,
          invoices: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const rows: ExcelRow[] = [];

      billingNotes.forEach((doc) => {
        if (doc.invoices.length > 0) {
          doc.invoices.forEach((invoice, index) => {
            rows.push({
              เลขใบวางบิล: doc.documentNo,
              ลูกค้า: doc.customer?.name || "-",
              ลำดับ: index + 1,
              เลขใบแจ้งหนี้: invoice.documentNo,
              วันที่ใบแจ้งหนี้: formatThaiDate(invoice.invoiceDate),
              ยอดรวมใบแจ้งหนี้: invoice.totalAmount,
              ชำระแล้ว: invoice.paidAmount,
              ค้างชำระ: invoice.balanceDue,
              ยอดวางบิลรวม: doc.totalAmount,
              สถานะใบวางบิล: doc.status,
              หมายเหตุ: doc.note || "-",
              วันที่วางบิล: formatThaiDate(doc.billingDate),
              วันครบกำหนด: formatThaiDate(doc.dueDate),
            });
          });
        } else {
          rows.push({
            เลขใบวางบิล: doc.documentNo,
            ลูกค้า: doc.customer?.name || "-",
            ลำดับ: "-",
            เลขใบแจ้งหนี้: "-",
            วันที่ใบแจ้งหนี้: "-",
            ยอดรวมใบแจ้งหนี้: 0,
            ชำระแล้ว: 0,
            ค้างชำระ: 0,
            ยอดวางบิลรวม: doc.totalAmount,
            สถานะใบวางบิล: doc.status,
            หมายเหตุ: doc.note || "-",
            วันที่วางบิล: formatThaiDate(doc.billingDate),
            วันครบกำหนด: formatThaiDate(doc.dueDate),
          });
        }
      });

      return excelResponse(
        makeExcel(rows, "Billing Note"),
        "billing-note-report.xlsx"
      );
    }

    if (report === "invoice") {
      const invoices = await prisma.invoice.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
        include: {
          customer: true,
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const rows: ExcelRow[] = invoices.map((invoice) => ({
        เลขใบแจ้งหนี้: invoice.documentNo,
        ลูกค้า: invoice.customer?.name || "-",
        วันที่ใบแจ้งหนี้: formatThaiDate(invoice.invoiceDate),
        วันครบกำหนด: formatThaiDate(invoice.dueDate),
        จำนวนรายการ: invoice.items.length,
        ยอดสินค้า: invoice.subtotal,
        ส่วนลด: invoice.discount,
        ภาษี: invoice.vat,
        ยอดรวมที่ต้องชำระ: invoice.totalAmount,
        ชำระแล้ว: invoice.paidAmount,
        ค้างชำระ: invoice.balanceDue,
        สถานะ: invoice.status,
        หมายเหตุ: invoice.note || "-",
      }));

      return excelResponse(makeExcel(rows, "Invoice"), "invoice-report.xlsx");
    }

    if (report === "receipt") {
      const receipts = await prisma.receipt.findMany({
        where: dateRange
          ? {
              createdAt: dateRange,
            }
          : undefined,
        include: {
          customer: true,
          invoice: true,
          items: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      const rows: ExcelRow[] = receipts.map((receipt) => ({
        เลขใบเสร็จ: receipt.documentNo,
        อ้างอิงใบแจ้งหนี้: receipt.invoice?.documentNo || "-",
        ลูกค้า: receipt.customer?.name || "-",
        วันที่รับเงิน: formatThaiDate(receipt.receiptDate),
        จำนวนรายการ: receipt.items.length,
        ยอดรับเงิน: receipt.totalAmount,
        ส่วนลด: receipt.discount,
        ภาษี: receipt.vat,
        ช่องทางชำระเงิน: receipt.paymentMethod,
        เลขอ้างอิง: receipt.paymentRef || "-",
        หมายเหตุ: receipt.note || "-",
        วันที่สร้าง: formatThaiDate(receipt.createdAt),
      }));

      return excelResponse(makeExcel(rows, "Receipt"), "receipt-report.xlsx");
    }

    if (report === "expenses") {
      const expenses = await prisma.expense.findMany({
        where: dateRange
          ? {
              expenseDate: dateRange,
            }
          : undefined,
        orderBy: {
          expenseDate: "desc",
        },
      });

      const rows: ExcelRow[] = expenses.map((expense) => ({
        รายการ: expense.title,
        หมวดหมู่: expense.category,
        จำนวนเงิน: expense.amount,
        วันที่จ่าย: formatThaiDate(expense.expenseDate),
        หมายเหตุ: expense.note || "-",
        วันที่สร้าง: formatThaiDate(expense.createdAt),
      }));

      return excelResponse(makeExcel(rows, "Expenses"), "expenses-report.xlsx");
    }

    const invoices = await prisma.invoice.findMany({
      where: dateRange
        ? {
            createdAt: dateRange,
          }
        : undefined,
      include: {
        customer: true,
        items: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const expenses = await prisma.expense.findMany({
      where: dateRange
        ? {
            expenseDate: dateRange,
          }
        : undefined,
    });

    const totalRevenue = invoices.reduce(
      (sum, invoice) => sum + invoice.totalAmount,
      0
    );

    const totalPaid = invoices.reduce(
      (sum, invoice) => sum + invoice.paidAmount,
      0
    );

    const totalBalanceDue = invoices.reduce(
      (sum, invoice) => sum + invoice.balanceDue,
      0
    );

    const totalCost = invoices.reduce((sum, invoice) => {
      const itemCost = invoice.items.reduce(
        (itemSum, item) => itemSum + item.totalCost,
        0
      );

      return sum + itemCost;
    }, 0);

    const totalExpense = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpense;

    const rows: ExcelRow[] = [
      {
        รายการ: "ยอดขายรวม",
        จำนวนเงิน: totalRevenue,
      },
      {
        รายการ: "รับชำระแล้ว",
        จำนวนเงิน: totalPaid,
      },
      {
        รายการ: "ค้างชำระ",
        จำนวนเงิน: totalBalanceDue,
      },
      {
        รายการ: "ต้นทุนสินค้า",
        จำนวนเงิน: totalCost,
      },
      {
        รายการ: "กำไรขั้นต้น",
        จำนวนเงิน: grossProfit,
      },
      {
        รายการ: "ค่าใช้จ่าย",
        จำนวนเงิน: totalExpense,
      },
      {
        รายการ: "กำไรสุทธิ",
        จำนวนเงิน: netProfit,
      },
    ];

    return excelResponse(makeExcel(rows, "Dashboard"), "dashboard-report.xlsx");
  } catch (error) {
    console.error("EXPORT REPORT ERROR:", error);

    return NextResponse.json(
      {
        message: "Export Excel ไม่สำเร็จ",
      },
      {
        status: 500,
      }
    );
  }
}