import { categorizeExpense } from "./categorizer";
import { ExpenseCategory, PaymentMethod, ALL_PAYMENT_METHODS } from "./types";

export interface ParsedReceipt {
    amount: number;
    merchant: string;
    category: ExpenseCategory;
    date?: string;
    paymentMethod?: PaymentMethod;
    rawText: string;
}

export function parseReceiptOCR(text: string): ParsedReceipt | null {
    if (!text || text.trim().length === 0) return null;

    console.log("--- OCR RAW TEXT START ---");
    console.log(text);
    console.log("--- OCR RAW TEXT END ---");

    // 1. Clean Text: Split into lines, trim whitespace, and remove empty lines
    const lines = text.split('\n')
        .map(line => line.replace(/\s+/g, ' ').trim()) // Normalize internal spaces
        .filter(line => line.length > 0);

    // 2. Amount Detection
    let maxScoringAmount = 0;

    // We will collect ALL valid numbers found in the text
    const allNumbers: { value: number; lineText: string; isLikelyAmount: boolean }[] = [];
    const numberCandidateRegex = /([\d,]+(?:\.\d{1,2})?)/g;

    for (const line of lines) {
        let match;
        numberCandidateRegex.lastIndex = 0;
        while ((match = numberCandidateRegex.exec(line)) !== null) {
            const rawValue = match[1];
            const val = parseFloat(rawValue.replace(/,/g, ''));

            // Ignore tiny numbers that are likely dates (like 15 for 15 Feb) or garbage 
            // unless they have decimals (like 2.50)
            if (isNaN(val) || (val < 10 && !rawValue.includes('.'))) continue;

            // Ignore phone numbers or massive IDs
            const digitsOnly = rawValue.replace(/[.,]/g, '');
            if (digitsOnly.length > 6) continue;

            const lowerLine = line.toLowerCase();
            const isLikelyAmount = /paid|payment|successful|amount|sent|₹|rs\.?|inr|\$|rupees?|rupee/i.test(lowerLine);

            allNumbers.push({ value: val, lineText: lowerLine, isLikelyAmount });
        }
    }

    // TIER 1: User Explicit Request - Immediately look for amount after Rupee symbol
    // Very aggressive match for symbol + space + number
    const strictCurrencyRegex = /(?:₹|rs\.?|inr|\$|rupees?|rupee)\s*([\d,]+(?:\.\d{1,2})?)/gi;
    let explicitMatch;
    while ((explicitMatch = strictCurrencyRegex.exec(text)) !== null) {
        const val = parseFloat(explicitMatch[1].replace(/,/g, ''));
        if (!isNaN(val) && val > maxScoringAmount) {
            maxScoringAmount = val;
        }
    }

    // TIER 2: Contextual Heuristics
    // If we didn't find a strict symbol attached to a number, look for the largest number
    // that exists on a line with payment context (e.g. "Payment Successful 500")
    if (maxScoringAmount === 0) {
        const contextualNumbers = allNumbers.filter(n => n.isLikelyAmount);
        if (contextualNumbers.length > 0) {
            maxScoringAmount = Math.max(...contextualNumbers.map(n => n.value));
        }
    }

    // TIER 3: Absolute Fallback
    // If Tesseract utterly garbled the text and we found NO symbols and NO keywords,
    // just take the largest sensible number on the entire receipt.
    // Receipts are ultimately about amounts, so the largest non-ID number is a very safe bet.
    if (maxScoringAmount === 0 && allNumbers.length > 0) {
        // Filter out things that are obviously times or dates or IDs
        const fallbackNumbers = allNumbers.filter(n => {
            const text = n.lineText;
            if (text.includes('upi') || text.includes('ref') || text.includes('id:') || text.includes('txn')) return false;
            if (/(?:am|pm)/.test(text) || /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(text)) return false;
            return true;
        });

        if (fallbackNumbers.length > 0) {
            maxScoringAmount = Math.max(...fallbackNumbers.map(n => n.value));
        } else {
            // Absolute last resort: just grab the largest number on the document
            maxScoringAmount = Math.max(...allNumbers.map(n => n.value));
        }
    }


    // 3. Extract Merchant
    let merchant = "Unknown Merchant";

    // Common UPI/payment prefixes for merchants
    const upiPrefixes = [/^to:\s*(.+)$/i, /^paid to\s*(.+)$/i, /^paying\s*(.+)$/i, /^sent to\s*(.+)$/i];

    let foundUpiMerchant = false;
    for (const line of lines) {
        for (const prefix of upiPrefixes) {
            const match = prefix.exec(line);
            if (match && match[1]) {
                merchant = match[1].trim();
                foundUpiMerchant = true;
                break;
            }
        }
        if (foundUpiMerchant) break;
    }

    if (!foundUpiMerchant) {
        // Exclude common header junk, dates, or payment app names
        const junkPatterns = [
            /tax/i, /invoice/i, /receipt/i, /date/i, /time/i, /cashier/i,
            /welcome/i, /store/i, /tel/i, /phone/i, /vat/i, /gst/i,
            /paytm/i, /gpay/i, /google pay/i, /phonepe/i, /bhim/i, /upi/i,
            /payment successful/i, /transaction/i, /success/i,
            /^\d+$/, /^\W+$/,
            /(?:am|pm)/i, /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i // Ignore dates as merchant names
        ];

        for (let i = 0; i < Math.min(8, lines.length); i++) {
            const candidate = lines[i];

            // Skip if the line itself was selected as the exact amount line without other text
            if (allNumbers.some(c => c.value === maxScoringAmount && c.lineText === candidate.toLowerCase() && c.lineText.replace(/[^0-9.]/g, '') === c.lineText.trim())) {
                continue;
            }

            if (candidate.length < 3) continue;

            const isJunk = junkPatterns.some(p => p.test(candidate));
            // Ensure the line has a good ratio of alphabetical characters (not just symbols/numbers)
            if (!isJunk && candidate.replace(/[^a-zA-Z]/g, '').length > candidate.length * 0.4) {
                merchant = candidate;
                break;
            }
        }
    }

    // 4. Extract Category
    const category = categorizeExpense(text, merchant);

    // 5. Extract Date 
    let date = undefined;
    const datePatterns = [
        // e.g. 15 Feb, 15 Feb 2024, 15/02/2024, 2024-02-15
        /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*(?:\s+\d{2,4})?)/i,
        /(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/,
        /(\d{4}[\/\.-]\d{1,2}[\/\.-]\d{1,2})/
    ];

    for (const line of lines) {
        for (const pattern of datePatterns) {
            const match = pattern.exec(line);
            if (match) {
                date = match[1].trim();
                break;
            }
        }
        if (date) break;
    }

    // 6. Extract Payment Method
    let paymentMethod: PaymentMethod = "Cash"; // Default
    const lowerText = text.toLowerCase();

    if (lowerText.includes('upi') || lowerText.includes('gpay') || lowerText.includes('paytm') || lowerText.includes('phonepe') || lowerText.includes('bhim')) {
        paymentMethod = "UPI";
    } else if (lowerText.includes('card') && (lowerText.includes('credit') || lowerText.includes('mastercard') || lowerText.includes('visa'))) {
        paymentMethod = "Credit Card";
    } else if (lowerText.includes('debit') || lowerText.includes('atm')) {
        paymentMethod = "Debit Card";
    } else if (lowerText.includes('net banking') || lowerText.includes('internet banking')) {
        paymentMethod = "Net Banking";
    }

    return {
        amount: maxScoringAmount,
        merchant,
        category,
        date,
        paymentMethod,
        rawText: text
    };
}
