import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine, ImagePlus, Loader2 } from "lucide-react";
import { parseReceiptOCR, ParsedReceipt } from "@/lib/ocr-parser";
import Tesseract from "tesseract.js";
import { toast } from "sonner";

interface OCRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScanComplete: (result: ParsedReceipt) => void;
}

export function OCRDialog({ open, onOpenChange, onScanComplete }: OCRDialogProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Start scanning
    setIsScanning(true);
    setProgress(0);

    try {
      const img = new Image();
      img.src = objectUrl;
      await new Promise((resolve) => { img.onload = resolve; });

      const loggerFn = (m: any) => {
        if (m.status === "recognizing text") {
          setProgress(Math.round(m.progress * 100));
        }
      };

      // Pass 1: Normal Image
      let { data: { text } } = await Tesseract.recognize(file, "eng", { logger: loggerFn });
      let parsed = parseReceiptOCR(text);

      // Pass 2: If we couldn't find an amount, Tesseract's binarization likely erased white text on a dark background (like Paytm)
      if (!parsed || parsed.amount === 0) {
        setProgress(0);
        console.log("Pass 1 failed to find amount. Retrying with inverted colors...");

        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          
          // Invert colors to make white text on dark blue become black text on light yellow (Tesseract loves this)
          for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];         // R
            data[i + 1] = 255 - data[i + 1]; // G
            data[i + 2] = 255 - data[i + 2]; // B
          }
          ctx.putImageData(imageData, 0, 0);

          const { data: { text: invertedText } } = await Tesseract.recognize(canvas, "eng", { logger: loggerFn });
          const invertedParsed = parseReceiptOCR(invertedText);
          
          if (invertedParsed && invertedParsed.amount > 0) {
             parsed = invertedParsed;
          }
        }
      }

      if (parsed && (parsed.amount > 0 || parsed.merchant !== "Unknown Merchant")) {
        toast.success("Receipt scanned successfully!");
        onScanComplete(parsed);
        // Clean up
        setTimeout(() => {
          setPreviewUrl(null);
          onOpenChange(false);
        }, 500);
      } else {
        toast.error("Could not extract meaningful details. Please enter manually.");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      toast.error("Failed to scan receipt. Please try again.");
    } finally {
      setIsScanning(false);
      setProgress(0);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (fileInputRef.current) {
         // Create a synthetic event to reuse logic
         const dataTransfer = new DataTransfer();
         dataTransfer.items.add(e.dataTransfer.files[0]);
         
         // Trigger the file input change handler
         fileInputRef.current.files = dataTransfer.files;
         const event = new Event("change", { bubbles: true });
         fileInputRef.current.dispatchEvent(event);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!isScanning) {
        setPreviewUrl(null);
        onOpenChange(val);
      }
    }}>
      <DialogContent className="bg-[#0f0f0f] border-white/[0.08] text-white max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-indigo-400" />
            Scan Receipt
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Upload a clear photo of your bill or receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {!previewUrl ? (
            <div 
              className="border-2 border-dashed border-white/[0.1] rounded-xl p-8 flex flex-col items-center justify-center gap-3 text-center cursor-pointer hover:bg-white/[0.02] transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="h-12 w-12 rounded-full bg-white/[0.05] flex items-center justify-center">
                <ImagePlus className="h-6 w-6 text-white/50" />
              </div>
              <div>
                <p className="text-sm font-medium">Click or drag image to upload</p>
                <p className="text-xs text-white/40 mt-1">Supports JPG, PNG, WEBP</p>
              </div>
            </div>
          ) : (
             <div className="relative aspect-[3/4] w-full max-h-64 rounded-lg overflow-hidden border border-white/[0.1] bg-black/50 flex items-center justify-center">
               <img src={previewUrl} alt="Receipt preview" className="object-contain w-full h-full opacity-50" />
               
               {isScanning && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                   <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-3" />
                   <div className="flex flex-col items-center">
                     <span className="text-sm font-medium">Scanning Receipt...</span>
                     <span className="text-xs text-white/60 mt-1">{progress}%</span>
                     <div className="w-48 h-1.5 bg-white/[0.1] rounded-full mt-3 overflow-hidden">
                       <div 
                         className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
                         style={{ width: `${progress}%` }}
                       />
                     </div>
                   </div>
                 </div>
               )}
             </div>
          )}

          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange}
          />
        </div>

        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)} 
            disabled={isScanning}
            className="text-white/50 hover:text-white hover:bg-white/[0.05]"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
