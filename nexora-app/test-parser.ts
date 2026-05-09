import { parseReceiptOCR } from "./lib/ocr-parser";

const paytmText = `
paytm
Payment Successful
₹500
To: Anuvind K
UPI ID: 7994139460@naviaxis
Paid in 2.67 Seconds
From: Sreejith K
Kerala Gramin Bank - 9913
15 Feb, 12:52 PM | Ref. No: 200183759357
`;

console.log(parseReceiptOCR(paytmText));
