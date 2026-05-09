import { categorizeExpense } from "./categorizer";
import { ExpenseCategory } from "./types";

export interface ParsedSMS {
    amount: number;
    merchant: string;
    category: ExpenseCategory;
    raw: string;
}

export function parseBankSMS(sms: string): ParsedSMS | null {
    const text = sms.trim();
    if (!text) return null;

    // Try to extract amount
    const amountPatterns = [
        /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)/i,
        /([\d,]+(?:\.\d{1,2})?)\s*(?:Rs\.?|INR|₹)/i,
        /(?:debited|spent|paid|charged|purchase)\s*(?:of|for|with|by)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
        /(?:amount|amt)\s*(?:of|:)?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ];

    let amount = 0;
    for (const pattern of amountPatterns) {
        const match = text.match(pattern);
        if (match) {
            amount = parseFloat(match[1].replace(/,/g, ""));
            break;
        }
    }

    if (amount === 0) return null;

    // Try to extract merchant
    const merchantPatterns = [
        /(?:at|to|for|on|@)\s+([A-Za-z][A-Za-z0-9\s&'.]+?)(?:\s+(?:on|using|via|through|from|ref|refno|txn|upi)|\.|$)/i,
        /(?:spent|paid|purchase)\s+(?:at|to|on|for)\s+([A-Za-z][A-Za-z0-9\s&'.]+?)(?:\s+(?:on|using|via)|\.|$)/i,
        /(?:Info:|VPA:?)\s*([A-Za-z][A-Za-z0-9@.\s]+?)(?:\s+|$)/i,
    ];

    let merchant = "Unknown";
    for (const pattern of merchantPatterns) {
        const match = text.match(pattern);
        if (match) {
            merchant = match[1].trim().replace(/\s+/g, " ");
            if (merchant.length > 30) merchant = merchant.substring(0, 30);
            break;
        }
    }

    const category = categorizeExpense(text, merchant);

    return { amount, merchant, category, raw: text };
}
