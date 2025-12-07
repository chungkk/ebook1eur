import { Types } from "mongoose";

export type BookType = "ebook" | "audiobook";
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "blocked";
export type PaymentMethod = "stripe" | "paypal";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type DownloadStatus = "active" | "used" | "expired";

export interface IUser {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBook {
  _id: Types.ObjectId;
  title: string;
  description: string;
  author: string;
  type: BookType;
  duration?: number;
  price: number;
  coverImage: string;
  filePath: string;
  fileSize: number;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchase {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  bookId: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId: string;
  purchaseMonth: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDownload {
  _id: Types.ObjectId;
  purchaseId: Types.ObjectId;
  token: string;
  status: DownloadStatus;
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

export interface IMonthlyQuota {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  month: string;
  ebookCount: number;
  audiobookCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuotaInfo {
  month: string;
  ebook: {
    used: number;
    remaining: number;
    limit: number;
  };
  audiobook: {
    used: number;
    remaining: number;
    limit: number;
  };
}
