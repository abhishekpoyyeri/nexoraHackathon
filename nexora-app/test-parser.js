function categorizeExpense(text, merchant) { return "Other"; }

function parseReceiptOCR(text) {
    if (!text || text.trim().length === 0) return null;
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    let maxAmount = 0;
    const currencyRegex = /(?:rs\.?|inr|₹|\$|€|£)\s*([\d,]+\.\d{2}|[\d,]+)/gi;
    const generalAmountRegex = /(?:^|\s|\b)([\d,]+\.\d{2}|[\d,]+)(?:\b|\s|$)/g;

    const explicitAmounts = [];
    const generalAmounts = [];

    for (const line of lines) {
        let match;
        while ((match = currencyRegex.exec(line)) !== null) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(val)) {
                explicitAmounts.push(val);
                const lowerLine = line.toLowerCase();
                if (lowerLine.includes('total') || lowerLine.includes('sum') || lowerLine.includes('amount') || lowerLine.includes('due') || lowerLine.includes('net')) {
                    maxAmount = Math.max(maxAmount, val);
                }
            }
        }

        while ((match = generalAmountRegex.exec(line)) !== null) {
            const val = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(val) && val < 5000000) {
                generalAmounts.push(val);
            }
        }
    }

    if (maxAmount === 0) {
        if (explicitAmounts.length > 0) {
            maxAmount = Math.max(...explicitAmounts);
        } else if (generalAmounts.length > 0) {
            maxAmount = Math.max(...generalAmounts);
        }
    }

    let merchant = "Unknown Merchant";
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
        const junkPatterns = [
            /tax/i, /invoice/i, /receipt/i, /date/i, /time/i, /cashier/i,
            /welcome/i, /store/i, /tel/i, /phone/i, /vat/i, /gst/i,
            /paytm/i, /gpay/i, /google pay/i, /phonepe/i, /bhim/i, /upi/i,
            /payment successful/i, /transaction/i, /success/i,
            /^\d+$/, /^\W+$/
        ];

        for (let i = 0; i < Math.min(8, lines.length); i++) {
            const candidate = lines[i];
            if (candidate.length < 3) continue;

            const isJunk = junkPatterns.some(p => p.test(candidate));
            if (!isJunk && candidate.replace(/[^a-zA-Z]/g, '').length > candidate.length * 0.4) {
                merchant = candidate;
                break;
            }
        }
    }

    const category = categorizeExpense(text, merchant);

    return {
        amount: maxAmount,
        merchant,
        category,
        rawText: text
    };
}

const paytmText = "paytm\nPayment Successful\n₹500\nTo: Anuvind K\nUPI ID: 7994139460@naviaxis\nPaid in 2.67 Seconds\nFrom: Sreejith K\nKerala Gramin Bank - 9913\n15 Feb, 12:52 PM | Ref. No: 200183759357";
console.log(parseReceiptOCR(paytmText));
