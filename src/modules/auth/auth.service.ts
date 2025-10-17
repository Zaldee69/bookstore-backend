import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import prisma from '../../db/prisma.js';
import { generateToken } from '../../utils/jwt.js';
import { AppError } from '../../middlewares/error.js';
import { RegisterInput, LoginInput } from './auth.validation.js';

export class AuthService {
  async register(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (existingUser) {
      throw new AppError(409, 'EMAIL_EXISTS', 'Email already registered');
    }
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        role: 'CUSTOMER',
      },
      select: {
        id: true,
        email: true,
        role: true,
      },
    });
    
    return {
      user,
    };
  }
  
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });
    
    if (!user) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    
    const isValidPassword = await bcrypt.compare(data.password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }
    
    // Generate new JTI for single session
    const jti = randomBytes(16).toString('hex');
    
    // Update user with new session info
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        currentJti: jti,
        tokenVersion: user.tokenVersion + 1,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tokenVersion: true,
      },
    });
    
    const token = generateToken({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      jti,
      tv: updatedUser.tokenVersion,
    });
    
    return {
      token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }
  
  async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        currentJti: null,
      },
    });
    
    return { message: 'Logged out successfully' };
  }
}
