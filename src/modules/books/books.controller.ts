import { Request, Response, NextFunction } from 'express';
import { BooksService } from './books.service.js';
import { z } from 'zod';

const booksService = new BooksService();

const createBookSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  price: z.number().int().positive(),
  stock: z.number().int().nonnegative(),
});

const updateBookSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  price: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

const updateStockSchema = z.object({
  delta: z.number().int(),
});

export class BooksController {
  // Customer endpoints
  async listBooksInStock(req: Request, res: Response, next: NextFunction) {
    try {
      const books = await booksService.listBooksInStock();
      res.status(200).json({ data: books });
    } catch (error) {
      next(error);
    }
  }
  
  async getBookById(req: Request, res: Response, next: NextFunction) {
    try {
      const book = await booksService.getBookById(req.params.id);
      res.status(200).json({ data: book });
    } catch (error) {
      next(error);
    }
  }
  
  // Admin endpoints
  async listAllBooks(req: Request, res: Response, next: NextFunction) {
    try {
      const books = await booksService.listAllBooks();
      res.status(200).json({ data: books });
    } catch (error) {
      next(error);
    }
  }
  
  async createBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = createBookSchema.parse(req.body);
      const book = await booksService.createBook(validated);
      res.status(201).json({ 
        message: 'Book created successfully',
        data: book 
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateBook(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateBookSchema.parse(req.body);
      const book = await booksService.updateBook(req.params.id, validated);
      res.status(200).json({ 
        message: 'Book updated successfully',
        data: book 
      });
    } catch (error) {
      next(error);
    }
  }
  
  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = updateStockSchema.parse(req.body);
      const book = await booksService.updateStock(req.params.id, validated.delta);
      res.status(200).json({ 
        message: 'Stock updated successfully',
        data: book 
      });
    } catch (error) {
      next(error);
    }
  }
  
  async deleteBook(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await booksService.deleteBook(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
