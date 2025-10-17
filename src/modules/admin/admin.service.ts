import prisma from "../../db/prisma.js";
import ExcelJS from "exceljs";

export class AdminService {
  async getAllTransactions() {
    return await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        items: {
          include: {
            book: {
              select: {
                id: true,
                title: true,
                author: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSalesReport() {
    // Get all paid orders
    const paidOrders = await prisma.order.findMany({
      where: { status: "PAID" },
      include: {
        items: {
          include: {
            book: true,
          },
        },
      },
    });

    // Calculate sales per book
    const bookSales = new Map<
      string,
      {
        bookId: string;
        title: string;
        author: string;
        totalSold: number;
        currentStock: number;
        revenue: number;
      }
    >();

    for (const order of paidOrders) {
      for (const item of order.items) {
        const existing = bookSales.get(item.bookId);

        if (existing) {
          existing.totalSold += item.qty;
          existing.revenue += item.qty * item.price;
        } else {
          bookSales.set(item.bookId, {
            bookId: item.bookId,
            title: item.book.title,
            author: item.book.author,
            totalSold: item.qty,
            currentStock: item.book.stock,
            revenue: item.qty * item.price,
          });
        }
      }
    }

    // Get all books to include those with no sales
    const allBooks = await prisma.book.findMany();

    for (const book of allBooks) {
      if (!bookSales.has(book.id)) {
        bookSales.set(book.id, {
          bookId: book.id,
          title: book.title,
          author: book.author,
          totalSold: 0,
          currentStock: book.stock,
          revenue: 0,
        });
      } else {
        // Update current stock
        const existing = bookSales.get(book.id);
        if (existing) {
          existing.currentStock = book.stock;
        }
      }
    }

    const salesArray = Array.from(bookSales.values());
    const totalRevenue = salesArray.reduce(
      (sum, item) => sum + item.revenue,
      0
    );
    const totalSold = salesArray.reduce((sum, item) => sum + item.totalSold, 0);

    return {
      summary: {
        totalRevenue,
        totalBooksSold: totalSold,
        totalOrders: paidOrders.length,
      },
      bookSales: salesArray.sort((a, b) => b.revenue - a.revenue),
    };
  }

  async generateSalesExcel() {
    // Get sales report data
    const report = await this.getSalesReport();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Book E-Commerce System";
    workbook.created = new Date();

    // Add Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary", {
      properties: { tabColor: { argb: "FF4A90E2" } },
    });

    // Summary Sheet - Title
    summarySheet.mergeCells("A1:D1");
    summarySheet.getCell("A1").value = "SALES REPORT SUMMARY";
    summarySheet.getCell("A1").font = { size: 16, bold: true };
    summarySheet.getCell("A1").alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    summarySheet.getCell("A1").fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF4A90E2" },
    };
    summarySheet.getCell("A1").font = {
      ...summarySheet.getCell("A1").font,
      color: { argb: "FFFFFFFF" },
    };
    summarySheet.getRow(1).height = 30;

    // Summary Sheet - Generated Date
    summarySheet.getCell("A2").value = "Generated Date:";
    summarySheet.getCell("B2").value = new Date().toLocaleString("id-ID");
    summarySheet.getCell("A2").font = { bold: true };

    // Summary Sheet - Metrics
    summarySheet.getCell("A4").value = "Metric";
    summarySheet.getCell("B4").value = "Value";
    summarySheet.getRow(4).font = { bold: true };
    summarySheet.getRow(4).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };

    summarySheet.getCell("A5").value = "Total Revenue";
    summarySheet.getCell("B5").value = report.summary.totalRevenue;
    summarySheet.getCell("B5").numFmt = "Rp#,##0";

    summarySheet.getCell("A6").value = "Total Books Sold";
    summarySheet.getCell("B6").value = report.summary.totalBooksSold;
    summarySheet.getCell("B6").numFmt = "#,##0";

    summarySheet.getCell("A7").value = "Total Orders";
    summarySheet.getCell("B7").value = report.summary.totalOrders;
    summarySheet.getCell("B7").numFmt = "#,##0";

    // Summary Sheet - Column Widths
    summarySheet.getColumn("A").width = 25;
    summarySheet.getColumn("B").width = 20;

    // Add borders
    ["A4", "B4", "A5", "B5", "A6", "B6", "A7", "B7"].forEach((cell) => {
      summarySheet.getCell(cell).border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
    });

    // Add Book Sales Detail Sheet
    const detailSheet = workbook.addWorksheet("Book Sales Detail", {
      properties: { tabColor: { argb: "FF50C878" } },
    });

    // Detail Sheet - Headers
    const headers = [
      "Book ID",
      "Title",
      "Author",
      "Total Sold",
      "Current Stock",
      "Revenue (Rp)",
    ];
    detailSheet.addRow(headers);

    // Style headers
    detailSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    detailSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF50C878" },
    };
    detailSheet.getRow(1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    detailSheet.getRow(1).height = 25;

    // Add data rows
    report.bookSales.forEach((book, index) => {
      const row = detailSheet.addRow([
        book.bookId,
        book.title,
        book.author,
        book.totalSold,
        book.currentStock,
        book.revenue,
      ]);

      // Format numbers
      row.getCell(4).numFmt = "#,##0";
      row.getCell(5).numFmt = "#,##0";
      row.getCell(6).numFmt = "Rp#,##0";

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF9F9F9" },
        };
      }

      // Add borders
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Column widths
    detailSheet.getColumn(1).width = 38; // Book ID (UUID)
    detailSheet.getColumn(2).width = 35; // Title
    detailSheet.getColumn(3).width = 25; // Author
    detailSheet.getColumn(4).width = 15; // Total Sold
    detailSheet.getColumn(5).width = 15; // Current Stock
    detailSheet.getColumn(6).width = 18; // Revenue

    // Add totals row
    const totalRow = detailSheet.addRow([
      "",
      "",
      "TOTAL",
      report.summary.totalBooksSold,
      "",
      report.summary.totalRevenue,
    ]);

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFEB3B" },
    };
    totalRow.getCell(4).numFmt = "#,##0";
    totalRow.getCell(6).numFmt = "Rp#,##0";
    totalRow.eachCell((cell) => {
      cell.border = {
        top: { style: "double" },
        left: { style: "thin" },
        bottom: { style: "double" },
        right: { style: "thin" },
      };
    });

    return workbook;
  }
}
