import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// 1. Create the adapter with your connection string
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL as string,
});

// 2. Pass the adapter to the PrismaClient
const prisma = new PrismaClient({ adapter }) as PrismaClient;

export const auth = betterAuth({
  baseURL: 'http://localhost:3000',

  trustedOrigins: ['http://localhost:5173'],

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  basePath: '/api/auth',
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },
});
