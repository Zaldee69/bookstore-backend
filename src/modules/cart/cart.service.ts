import prisma from "../../db/prisma.js";
import { AppError } from "../../middlewares/error.js";

export class CartService {
  async getOrCreateCart(userId: string) {
    let cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
        include: {
          items: {
            include: {
              book: true,
            },
          },
        },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        bookId: item.bookId,
        title: item.book.title,
        author: item.book.author,
        qty: item.qty,
        unitPrice: item.unitPrice,
        subtotal: item.qty * item.unitPrice,
        stock: item.book.stock,
      })),
      total: cart.items.reduce(
        (sum, item) => sum + item.qty * item.unitPrice,
        0
      ),
    };
  }

  async addItem(userId: string, bookId: string, qty: number) {
    if (qty <= 0) {
      throw new AppError(400, "INVALID_QUANTITY", "Quantity must be positive");
    }

    const book = await prisma.book.findUnique({ where: { id: bookId } });

    if (!book) {
      throw new AppError(404, "BOOK_NOT_FOUND", "Book not found");
    }

    if (!book.isActive) {
      throw new AppError(400, "BOOK_INACTIVE", "Book is not available");
    }

    if (book.stock < qty) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        "Not enough stock available"
      );
    }

    const cart = await this.getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        cartId_bookId: {
          cartId: cart.id,
          bookId,
        },
      },
    });

    if (existingItem) {
      const newQty = existingItem.qty + qty;

      if (book.stock < newQty) {
        throw new AppError(
          409,
          "INSUFFICIENT_STOCK",
          "Not enough stock available"
        );
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { qty: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          bookId,
          qty,
          unitPrice: book.price,
        },
      });
    }

    return await this.getCart(userId);
  }

  async updateItem(userId: string, itemId: string, qty: number) {
    if (qty <= 0) {
      throw new AppError(400, "INVALID_QUANTITY", "Quantity must be positive");
    }

    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
      include: { book: true },
    });

    if (!item) {
      throw new AppError(404, "ITEM_NOT_FOUND", "Cart item not found");
    }

    if (item.book.stock < qty) {
      throw new AppError(
        409,
        "INSUFFICIENT_STOCK",
        "Not enough stock available"
      );
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { qty },
    });

    return await this.getCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    });

    if (!item) {
      throw new AppError(404, "ITEM_NOT_FOUND", "Cart item not found");
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return await this.getCart(userId);
  }
}
