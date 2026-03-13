import { z } from 'zod';

export const emailSchema = z.string().email();

export const passwordSchema = z.string().min(8).max(100);

export const uuidSchema = z.string().uuid();

export const fileTypeSchema = z.enum([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'application/msword'
]);

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};

export const validatePassword = (password: string): boolean => {
  return passwordSchema.safeParse(password).success;
};

export const validateUUID = (id: string): boolean => {
  return uuidSchema.safeParse(id).success;
};
