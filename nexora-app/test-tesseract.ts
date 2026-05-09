import * as Tesseract from "tesseract.js";
import { parseReceiptOCR } from "./lib/ocr-parser";
import { appendFileSync } from 'fs';

async function run() {
    const urls = [
        "C:\\Users\\ACER\\.gemini\\antigravity\\brain\\5398f315-11ff-46c1-b5c3-bc836d2d634a\\media__1773041006535.jpg",
        "C:\\Users\\ACER\\.gemini\\antigravity\\brain\\5398f315-11ff-46c1-b5c3-bc836d2d634a\\media__1773042890121.jpg"
    ];

    for (const url of urls) {
        console.log(`\n\n=== Processing ${url} ===`);
        try {
            console.log("TESTING PSM 4");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res4 = await Tesseract.recognize(url, "eng", { logger: () => { }, tessedit_pageseg_mode: 4 } as any);
            console.log(res4.data.text);

            console.log("TESTING PSM 6");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res6 = await Tesseract.recognize(url, "eng", { logger: () => { }, tessedit_pageseg_mode: 6 } as any);
            console.log(res6.data.text);

            console.log("TESTING PSM 11");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const res11 = await Tesseract.recognize(url, "eng", { logger: () => { }, tessedit_pageseg_mode: 11 } as any);
            console.log(res11.data.text);

            const result = "--- RAW TESSERACT TEXT (PSM 11) ---\n" + res11.data.text + "\n--- PARSED RESULT ---\n" + JSON.stringify(parseReceiptOCR(res11.data.text), null, 2);
            appendFileSync('tesseract-output2.txt', `\n\n=== Processing ${url} ===\n` + result, 'utf8');
            console.log("Finished " + url);
        } catch (e: unknown) {
            console.error("Error recognizing", url, e instanceof Error ? e.message : String(e));
        }
    }
}
run();
