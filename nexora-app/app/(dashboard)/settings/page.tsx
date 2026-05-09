"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Download,
  IndianRupee,
  Shield,
  FileSpreadsheet,
  FileText,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function SettingsPage() {
  const { user, expenses, updateUserProfile } = useApp();
  const [income, setIncome] = useState(user?.monthlyIncome?.toString() || "");
  const [budget, setBudget] = useState(user?.monthlyBudget?.toString() || "");
  const [name, setName] = useState(user?.name || "");

  const handleSaveProfile = async () => {
    await updateUserProfile({
      name,
      monthlyIncome: parseFloat(income) || 0,
      monthlyBudget: parseFloat(budget) || 0,
    });
    toast.success("Profile updated!");
  };

  const exportCSV = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    const data = expenses.map((e) => ({
      Date: format(new Date(e.date), "dd/MM/yyyy"),
      Amount: e.amount,
      Category: e.category,
      Description: e.description,
      Merchant: e.merchant,
      "Payment Method": e.paymentMethod,
    }));
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintrack-expenses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const exportPDF = () => {
    if (expenses.length === 0) {
      toast.error("No expenses to export");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("FinTrack — Expense Report", 14, 22);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on ${format(new Date(), "dd MMM yyyy")}`, 14, 30);
    doc.text(`User: ${user?.name || ""}`, 14, 36);

    const total = expenses.reduce((s, e) => s + e.amount, 0);
    doc.text(`Total Expenses: ₹${total.toLocaleString("en-IN")}`, 14, 42);

    autoTable(doc, {
      startY: 50,
      head: [["Date", "Description", "Category", "Amount (₹)", "Payment"]],
      body: expenses
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((e) => [
          format(new Date(e.date), "dd/MM/yyyy"),
          e.description,
          e.category,
          e.amount.toLocaleString("en-IN"),
          e.paymentMethod,
        ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [99, 102, 241] },
    });

    doc.save(`fintrack-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    toast.success("PDF exported!");
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 mt-1">
          Manage your profile, budget, and export data
        </p>
      </div>

      {/* Profile */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-400" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-white/70">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.05] border-white/[0.1] text-white"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Email</Label>
            <Input
              value={user?.email || ""}
              disabled
              className="bg-white/[0.03] border-white/[0.06] text-white/40"
            />
          </div>
        </CardContent>
      </Card>

      {/* Budget Settings */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-emerald-400" />
            Budget Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-white/70">Monthly Income (₹)</Label>
              <Input
                type="number"
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Monthly Budget Limit (₹)</Label>
              <Input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card className="bg-white/[0.03] border-white/[0.06]">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <Download className="h-5 w-5 text-amber-400" />
            Export Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-white/40 mb-4">
            Download your expense records for personal analysis or tax documentation.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={exportCSV}
              variant="outline"
              className="border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white"
            >
              <FileSpreadsheet className="h-4 w-4 mr-2 text-green-400" />
              Export CSV
            </Button>
            <Button
              onClick={exportPDF}
              variant="outline"
              className="border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white"
            >
              <FileText className="h-4 w-4 mr-2 text-red-400" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
