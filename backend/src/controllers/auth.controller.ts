import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { calculateExpiration } from '../utils/jwtUtils';

function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value || typeof value !== 'string') {
    throw new Error(
      `Environment variable ${name} is required and must be a string`
    );
  }
  return value;
}

const JWT_ACCESS_SECRET: string = getRequiredEnvVar('JWT_ACCESS_SECRET');
const JWT_REFRESH_SECRET: string = getRequiredEnvVar('JWT_REFRESH_SECRET');
const JWT_ACCESS_EXPIRATION = (process.env.JWT_ACCESS_EXPIRATION ||
  '15m') as SignOptions['expiresIn'];
const JWT_REFRESH_EXPIRATION = (process.env.JWT_REFRESH_EXPIRATION ||
  '7d') as SignOptions['expiresIn'];

export function generateAccessToken(userId: number): string {
  const payload = { userId };
  const options: SignOptions = {
    expiresIn: JWT_ACCESS_EXPIRATION,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
}

export function generateRefreshToken(userId: number): string {
  const payload = { userId };
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRATION,
    algorithm: 'HS256',
  };

  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
}

export const signup = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: { email, name, password: hashedPassword },
    });

    const accessToken = generateAccessToken(newUser.id);
    const refreshToken = generateRefreshToken(newUser.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: newUser.id,
        expiresAt: calculateExpiration(JWT_REFRESH_EXPIRATION),
      },
    });

    res.status(201).json({
      message: 'User created successfully',
      accessToken,
      refreshToken,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: calculateExpiration(JWT_REFRESH_EXPIRATION),
      },
    });

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
