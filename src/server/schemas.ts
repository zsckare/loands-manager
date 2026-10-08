import { z } from 'zod';
export const moneyField = z.string().regex(/^\d{1,14}(\.\d{1,2})?$/);
export const clientSchema = z.object({ firstName: z.string().trim().min(1).max(100), lastName: z.string().trim().min(1).max(150), phone: z.string().max(30).optional(), address: z.string().max(500).optional(), notes: z.string().max(2000).optional() });
export const planSchema = z.object({ name: z.string().trim().min(1).max(100), installmentCount: z.number().int().min(1).max(730), interestRate: z.string().regex(/^\d{1,3}(\.\d{1,4})?$/), frequency: z.enum(['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY']), collectionDays: z.array(z.number().int().min(1).max(7)).min(1).default([1, 2, 3, 4, 5, 6, 7]) });
export const loanSchema = z.object({ clientId: z.uuid(), planId: z.uuid(), principal: moneyField, startDate: z.iso.date() });
export const paymentSchema = z.object({ amount: moneyField, effectiveDate: z.iso.date(), note: z.string().max(500).optional() });
