import { Request, Response, NextFunction } from "express";
import { AdminService } from "./admin.service.js";

const adminService = new AdminService();

export class AdminController {
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const transactions = await adminService.getAllTransactions();
      res.status(200).json({ data: transactions });
    } catch (error) {
      next(error);
    }
  }

  async getSalesReport(req: Request, res: Response, next: NextFunction) {
    try {
      const report = await adminService.getSalesReport();
      res.status(200).json({ data: report });
    } catch (error) {
      next(error);
    }
  }

  async downloadSalesExcel(req: Request, res: Response, next: NextFunction) {
    try {
      const workbook = await adminService.generateSalesExcel();

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `Sales_Report_${timestamp}.xlsx`;

      // Set headers for file download
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      // Write workbook to response
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      next(error);
    }
  }
}
