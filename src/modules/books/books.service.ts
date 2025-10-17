import prisma from '../../db/prisma.js';
import { AppError } from '../../middlewares/error.js';

export class BooksService {
  // Customer: List books in stock
  async listBooksInStock() {
    return await prisma.book.findMany({
      where: {
        stock: { gt: 0 },
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        author: true,
        price: true,
        stock: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  // Customer: Get book detail
  async getBookById(id: string) {
    const book = await prisma.book.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        author: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    if (!book) {
      throw new AppError(404, 'BOOK_NOT_FOUND', 'Book not found');
    }
    
    return book;
  }
  
  // Admin: List all books
  async listAllBooks() {
    return await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        price: true,
        stock: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
  
  // Admin: Create book
  async createBook(data: { title: string; author: string; price: number; stock: number }) {
    return await prisma.book.create({
      data: {
        title: data.title,
        author: data.author,
        price: data.price,
        stock: data.stock,
        isActive: true,
      },
    });
  }
  
  // Admin: Update book
  async updateBook(id: string, data: { title?: string; author?: string; price?: number; isActive?: boolean }) {
    const book = await prisma.book.findUnique({ where: { id } });
    
    if (!book) {
      throw new AppError(404, 'BOOK_NOT_FOUND', 'Book not found');
    }
    
    return await prisma.book.update({
      where: { id },
      data,
    });
  }
  
  // Admin: Update stock
  async updateStock(id: string, delta: number) {
    const book = await prisma.book.findUnique({ where: { id } });
    
    if (!book) {
      throw new AppError(404, 'BOOK_NOT_FOUND', 'Book not found');
    }
    
    const newStock = book.stock + delta;
    
    if (newStock < 0) {
      throw new AppError(400, 'INVALID_STOCK', 'Stock cannot be negative');
    }
    
    return await prisma.book.update({
      where: { id },
      data: { stock: newStock },
    });
  }
  
  // Admin: Delete book
  async deleteBook(id: string) {
    const book = await prisma.book.findUnique({ where: { id } });
    
    if (!book) {
      throw new AppError(404, 'BOOK_NOT_FOUND', 'Book not found');
    }
    
    await prisma.book.delete({ where: { id } });
    
    return { message: 'Book deleted successfully' };
  }
}
