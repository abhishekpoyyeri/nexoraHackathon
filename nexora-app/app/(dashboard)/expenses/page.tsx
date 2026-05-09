"use client";

import { useState, useMemo, useEffect } from "react";
import { useApp } from "@/lib/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  MessageSquare,
  Sparkles,
  Filter,
  Receipt,
  ScanLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { Expense, ALL_CATEGORIES, ALL_PAYMENT_METHODS, ExpenseCategory, PaymentMethod, CATEGORY_COLORS } from "@/lib/types";
import * as storage from "@/lib/storage";
import { categorizeExpense } from "@/lib/categorizer";
import { parseBankSMS } from "@/lib/sms-parser";
import { ParsedReceipt } from "@/lib/ocr-parser";
import { OCRDialog } from "@/components/ocr-dialog";
import { toast } from "sonner";

function ExpenseDialog({
  open,
  onOpenChange,
  editExpense,
  prefillData,
  userId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editExpense?: Expense | null;
  prefillData?: Partial<Expense> | null;
  userId: string;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState(editExpense?.amount?.toString() || "");
  const [description, setDescription] = useState(editExpense?.description || "");
  const [merchant, setMerchant] = useState(editExpense?.merchant || "");
  const [category, setCategory] = useState<ExpenseCategory>(editExpense?.category || "Other");
  const [date, setDate] = useState(editExpense?.date || format(new Date(), "yyyy-MM-dd"));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(editExpense?.paymentMethod || "UPI");
  const [aiSuggested, setAiSuggested] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount(editExpense?.amount?.toString() || prefillData?.amount?.toString() || "");
      setDescription(editExpense?.description || prefillData?.description || "");
      setMerchant(editExpense?.merchant || prefillData?.merchant || "");
      setCategory(editExpense?.category || (prefillData?.category as ExpenseCategory) || "Other");
      setDate(editExpense?.date || prefillData?.date || format(new Date(), "yyyy-MM-dd"));
      setPaymentMethod(editExpense?.paymentMethod || prefillData?.paymentMethod || "UPI");
      setAiSuggested(!!prefillData?.category && prefillData.category !== "Other");
    }
  }, [open, editExpense, prefillData]);

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    if (!editExpense) {
      const suggested = categorizeExpense(value, merchant);
      if (suggested !== "Other") {
        setCategory(suggested);
        setAiSuggested(true);
      }
    }
  };

  const handleMerchantChange = (value: string) => {
    setMerchant(value);
    if (!editExpense) {
      const suggested = categorizeExpense(description, value);
      if (suggested !== "Other") {
        setCategory(suggested);
        setAiSuggested(true);
      }
    }
  };

  const handleSubmit = async () => {
    if (!amount || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (editExpense) {
      await storage.updateExpense({
        ...editExpense,
        amount: parseFloat(amount),
        description,
        merchant,
        category,
        date,
        paymentMethod,
      });
      toast.success("Expense updated");
    } else {
      await storage.addExpense({
        id: crypto.randomUUID(),
        userId,
        amount: parseFloat(amount),
        description,
        merchant,
        category,
        date,
        paymentMethod,
        createdAt: new Date().toISOString(),
      });
      toast.success("Expense added");
    }

    await onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f0f] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editExpense ? "Edit Expense" : "Add Expense"}</DialogTitle>
          <DialogDescription className="text-white/40">
            {editExpense ? "Update the expense details." : "Enter expense details. Category will be auto-suggested."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/70">Amount (₹) *</Label>
              <Input
                type="number"
                placeholder="250"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Date</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Description *</Label>
            <Input
              placeholder="e.g., Lunch at Swiggy"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="bg-white/[0.05] border-white/[0.1] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Merchant</Label>
            <Input
              placeholder="e.g., Swiggy"
              value={merchant}
              onChange={(e) => handleMerchantChange(e.target.value)}
              className="bg-white/[0.05] border-white/[0.1] text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/70 flex items-center gap-1.5">
                Category
                {aiSuggested && (
                  <Badge className="bg-indigo-500/20 text-indigo-400 text-[10px] border-0 px-1.5 py-0">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> AI
                  </Badge>
                )}
              </Label>
              <Select value={category} onValueChange={(v) => { setCategory(v as ExpenseCategory); setAiSuggested(false); }}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/[0.1]">
                  {ALL_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-white/80 focus:bg-white/[0.08] focus:text-white">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger className="bg-white/[0.05] border-white/[0.1] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/[0.1]">
                  {ALL_PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-white/80 focus:bg-white/[0.08] focus:text-white">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-white/50 hover:text-white hover:bg-white/[0.05]">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0"
          >
            {editExpense ? "Update" : "Add Expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SMSDialog({
  open,
  onOpenChange,
  userId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  onSaved: () => void;
}) {
  const [smsText, setSmsText] = useState("");
  const [parsed, setParsed] = useState<ReturnType<typeof parseBankSMS>>(null);

  const handleParse = () => {
    const result = parseBankSMS(smsText);
    if (result) {
      setParsed(result);
      toast.success(`Extracted: ₹${result.amount} at ${result.merchant}`);
    } else {
      toast.error("Could not extract expense details from this SMS");
    }
  };

  const handleAdd = async () => {
    if (!parsed) return;
    await storage.addExpense({
      id: crypto.randomUUID(),
      userId,
      amount: parsed.amount,
      description: `SMS: ${parsed.merchant}`,
      merchant: parsed.merchant,
      category: parsed.category,
      date: format(new Date(), "yyyy-MM-dd"),
      paymentMethod: "Debit Card",
      createdAt: new Date().toISOString(),
    });
    toast.success("Expense added from SMS!");
    await onSaved();
    onOpenChange(false);
    setSmsText("");
    setParsed(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f0f] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Parse Bank SMS
          </DialogTitle>
          <DialogDescription className="text-white/40">
            Paste a bank transaction SMS and we&apos;ll extract the details automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <textarea
            placeholder="e.g., Rs.450 spent on Swiggy using HDFC card on 09-Mar-26"
            value={smsText}
            onChange={(e) => { setSmsText(e.target.value); setParsed(null); }}
            rows={4}
            className="w-full rounded-xl bg-white/[0.05] border border-white/[0.1] text-white placeholder:text-white/30 p-3 text-sm resize-none focus:outline-none focus:border-indigo-500/50"
          />
          {!parsed && (
            <Button onClick={handleParse} disabled={!smsText.trim()} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              <Sparkles className="h-4 w-4 mr-2" /> Extract Details
            </Button>
          )}
          {parsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.08] space-y-2"
            >
              <h4 className="text-sm font-medium text-white/60 mb-3">Extracted Data:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-white/40">Amount:</span>
                <span className="text-white font-medium">₹{parsed.amount.toLocaleString("en-IN")}</span>
                <span className="text-white/40">Merchant:</span>
                <span className="text-white font-medium">{parsed.merchant}</span>
                <span className="text-white/40">Category:</span>
                <Badge className="w-fit" style={{ backgroundColor: `${CATEGORY_COLORS[parsed.category]}20`, color: CATEGORY_COLORS[parsed.category], borderColor: `${CATEGORY_COLORS[parsed.category]}40` }} variant="outline">
                  {parsed.category}
                </Badge>
              </div>
            </motion.div>
          )}
        </div>
        {parsed && (
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setParsed(null); setSmsText(""); }} className="text-white/50 hover:text-white hover:bg-white/[0.05]">
              Clear
            </Button>
            <Button onClick={handleAdd} className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0">
              Add Expense
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function ExpensesPage() {
  const { user, expenses, refreshExpenses } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [showSMS, setShowSMS] = useState(false);
  const [showOCR, setShowOCR] = useState(false);
  const [ocrData, setOcrData] = useState<Partial<Expense> | null>(null);
  const [editExp, setEditExp] = useState<Expense | null>(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");

  const filtered = useMemo(() => {
    return expenses
      .filter((e) => {
        if (search) {
          const q = search.toLowerCase();
          if (!e.description.toLowerCase().includes(q) && !e.merchant.toLowerCase().includes(q)) return false;
        }
        if (filterCategory !== "all" && e.category !== filterCategory) return false;
        if (filterMonth !== "all" && !e.date.startsWith(filterMonth)) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, search, filterCategory, filterMonth]);

  const months = useMemo(() => {
    const m = new Set<string>();
    expenses.forEach((e) => m.add(e.date.substring(0, 7)));
    return Array.from(m).sort().reverse();
  }, [expenses]);

  const handleDelete = async (id: string) => {
    if (!user) return;
    await storage.deleteExpense(user.id, id);
    await refreshExpenses();
    toast.success("Expense deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Expenses</h1>
          <p className="text-white/40 mt-1">
            {expenses.length} total transactions
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            onClick={() => setShowOCR(true)}
            variant="outline"
            className="border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white"
          >
            <ScanLine className="h-4 w-4 mr-2" /> Scan Receipt
          </Button>
          <Button
            onClick={() => setShowSMS(true)}
            variant="outline"
            className="border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white"
          >
            <MessageSquare className="h-4 w-4 mr-2" /> Parse SMS
          </Button>
          <Button
            onClick={() => { setEditExp(null); setShowAdd(true); }}
            className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Expense
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
              <Input
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30"
              />
            </div>
            <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white/[0.05] border-white/[0.1] text-white">
                <Filter className="h-4 w-4 mr-2 text-white/40" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.1]">
                <SelectItem value="all" className="text-white/80 focus:bg-white/[0.08] focus:text-white">All Categories</SelectItem>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="text-white/80 focus:bg-white/[0.08] focus:text-white">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={(v) => setFilterMonth(v ?? "all")}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white/[0.05] border-white/[0.1] text-white">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/[0.1]">
                <SelectItem value="all" className="text-white/80 focus:bg-white/[0.08] focus:text-white">All Months</SelectItem>
                {months.map((m) => (
                  <SelectItem key={m} value={m} className="text-white/80 focus:bg-white/[0.08] focus:text-white">
                    {format(parseISO(`${m}-01`), "MMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Expense List */}
      <div className="space-y-2">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <Card className="bg-white/[0.03] border-white/[0.06]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Receipt className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/40 text-lg">No expenses found</p>
                <p className="text-white/25 text-sm mt-1">
                  {expenses.length === 0
                    ? "Add your first expense to get started"
                    : "Try adjusting your filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((expense, i) => (
              <motion.div
                key={expense.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] transition-colors group">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: `${CATEGORY_COLORS[expense.category]}20` }}
                        >
                          <span style={{ color: CATEGORY_COLORS[expense.category] }}>₹</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {expense.description}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-white/30">
                              {expense.merchant && `${expense.merchant} · `}
                              {format(parseISO(expense.date), "dd MMM yyyy")}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 border-white/10 text-white/50"
                            >
                              {expense.paymentMethod}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="hidden sm:flex"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[expense.category]}15`,
                            color: CATEGORY_COLORS[expense.category],
                            borderColor: `${CATEGORY_COLORS[expense.category]}30`,
                          }}
                        >
                          {expense.category}
                        </Badge>
                        <span className="text-base font-semibold text-white whitespace-nowrap">
                          ₹{expense.amount.toLocaleString("en-IN")}
                        </span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditExp(expense); setShowAdd(true); }}
                            className="p-1.5 rounded-lg hover:bg-white/[0.08] transition text-white/40 hover:text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/[0.15] transition text-white/40 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <ExpenseDialog
        open={showAdd}
        onOpenChange={(v) => { 
          setShowAdd(v); 
          if (!v) { setEditExp(null); setOcrData(null); } 
        }}
        editExpense={editExp}
        prefillData={ocrData}
        userId={user?.id || ""}
        onSaved={refreshExpenses}
      />
      <SMSDialog
        open={showSMS}
        onOpenChange={setShowSMS}
        userId={user?.id || ""}
        onSaved={refreshExpenses}
      />
      <OCRDialog
        open={showOCR}
        onOpenChange={setShowOCR}
        onScanComplete={(result) => {
          setOcrData({
            amount: result.amount,
            merchant: result.merchant,
            category: result.category || "Other",
            description: result.merchant !== "Unknown Merchant" ? `Receipt: ${result.merchant}` : "Receipt Scan",
          });
          setShowOCR(false);
          setShowAdd(true);
        }}
      />
    </div>
  );
}
