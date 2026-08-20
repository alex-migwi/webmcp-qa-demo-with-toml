// payment.service.ts
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaymentService {
    async processPayment(args: { amount: number; card?: string }) {
        if (args?.card === '00000000' || args.amount < 0) {
            return { error: 'Invalid Card or Amount' };
        }
        return { transactionId: 'tx_123' };
    }

    async refund(args: { txId: string }) {
        return { refunded: true };
    }

    // Buggy Discount Function in PaymentService
    // BUG: Subtracts discount percent directly from amount (e.g., 200 - 15 = 185 instead of 200 * 0.85 = 170)
    async applyDiscount(args: { amount: number; discount: number }) {
        const finalAmount = args.amount - args.discount;
        return { finalAmount };
    }

    async getTransactionHistory() {
        return [];
    }
}