"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SavingsGoal } from "@/lib/types";
import { analyzeGoal } from "@/lib/analytics";
import * as storage from "@/lib/storage";
import {
  Target,
  Plus,
  Trash2,
  Edit3,
  Trophy,
  Calendar,
  Sparkles,
  PiggyBank,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

function GoalDialog({
  open,
  onOpenChange,
  editGoal,
  userId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editGoal?: SavingsGoal | null;
  userId: string;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editGoal?.name || "");
  const [target, setTarget] = useState(editGoal?.targetAmount?.toString() || "");
  const [saved, setSaved] = useState(editGoal?.savedAmount?.toString() || "0");
  const [deadline, setDeadline] = useState(editGoal?.deadline || "");

  const handleSubmit = async () => {
    if (!name || !target || !deadline) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editGoal) {
      await storage.updateGoal({
        ...editGoal,
        name,
        targetAmount: parseFloat(target),
        savedAmount: parseFloat(saved),
        deadline,
      });
      toast.success("Goal updated");
    } else {
      await storage.addGoal({
        id: crypto.randomUUID(),
        userId,
        name,
        targetAmount: parseFloat(target),
        savedAmount: parseFloat(saved) || 0,
        deadline,
        createdAt: new Date().toISOString(),
      });
      toast.success("Goal created!");
    }
    await onSaved();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f0f] border-white/[0.08] text-white max-w-md">
        <DialogHeader>
          <DialogTitle>{editGoal ? "Edit Goal" : "Create Savings Goal"}</DialogTitle>
          <DialogDescription className="text-white/40">
            Set a financial goal and track your progress.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label className="text-white/70">Goal Name</Label>
            <Input
              placeholder="e.g., Buy a Car"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-white/[0.05] border-white/[0.1] text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-white/70">Target Amount (₹)</Label>
              <Input
                type="number"
                placeholder="500000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Already Saved (₹)</Label>
              <Input
                type="number"
                placeholder="0"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                className="bg-white/[0.05] border-white/[0.1] text-white"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/70">Deadline</Label>
            <Input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="bg-white/[0.05] border-white/[0.1] text-white"
            />
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
            {editGoal ? "Update" : "Create Goal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  onEdit,
  onDelete,
  index,
}: {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) {
  const analysis = analyzeGoal(goal);
  const isComplete = analysis.progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className={`bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] transition-colors group ${isComplete ? "border-emerald-500/30" : ""}`}>
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${isComplete ? "bg-emerald-500/20" : "bg-indigo-500/20"}`}>
                {isComplete ? (
                  <Trophy className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Target className="h-5 w-5 text-indigo-400" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">{goal.name}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3 w-3 text-white/30" />
                  <span className="text-xs text-white/30">
                    Due {format(parseISO(goal.deadline), "dd MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-white/[0.08] transition text-white/40 hover:text-white">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-500/[0.15] transition text-white/40 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-white/40">
                ₹{goal.savedAmount.toLocaleString("en-IN")} saved
              </span>
              <span className="text-white/60 font-medium">
                ₹{goal.targetAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <Progress value={analysis.progress} className="h-2.5 bg-white/[0.05]" />
            <div className="flex justify-between text-xs">
              <span className={`font-medium ${isComplete ? "text-emerald-400" : "text-indigo-400"}`}>
                {analysis.progress}% complete
              </span>
              <span className="text-white/30">
                ₹{analysis.remaining.toLocaleString("en-IN")} remaining
              </span>
            </div>
          </div>

          {/* Stats */}
          {!isComplete && (
            <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-2 text-sm">
                <PiggyBank className="h-4 w-4 text-amber-400" />
                <span className="text-white/50">
                  Save <span className="text-white font-medium">₹{analysis.requiredMonthly.toLocaleString("en-IN")}</span>/month
                  for <span className="text-white font-medium">{analysis.monthsLeft}</span> months
                </span>
              </div>
            </div>
          )}

          {isComplete && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/[0.15] text-center">
              <span className="text-sm text-emerald-400 font-medium">
                🎉 Goal achieved! Congratulations!
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function GoalsPage() {
  const { user, goals, refreshGoals } = useApp();
  const [showDialog, setShowDialog] = useState(false);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null);

  const handleDelete = async (goalId: string) => {
    if (!user) return;
    await storage.deleteGoal(user.id, goalId);
    await refreshGoals();
    toast.success("Goal deleted");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Savings Goals</h1>
          <p className="text-white/40 mt-1">
            Set financial goals and track your progress
          </p>
        </div>
        <Button
          onClick={() => { setEditGoal(null); setShowDialog(true); }}
          className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0"
        >
          <Plus className="h-4 w-4 mr-2" /> New Goal
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {goals.length === 0 ? (
            <Card className="col-span-full bg-white/[0.03] border-white/[0.06]">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Target className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/40 text-lg">No savings goals yet</p>
                <p className="text-white/25 text-sm mt-1 mb-4">
                  Create your first goal to start tracking
                </p>
                <Button
                  onClick={() => setShowDialog(true)}
                  variant="outline"
                  className="border-white/[0.1] text-white/70 hover:bg-white/[0.05] hover:text-white"
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            goals.map((goal, i) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={i}
                onEdit={() => { setEditGoal(goal); setShowDialog(true); }}
                onDelete={() => handleDelete(goal.id)}
              />
            ))
          )}
        </AnimatePresence>
      </div>

      <GoalDialog
        open={showDialog}
        onOpenChange={(v) => { setShowDialog(v); if (!v) setEditGoal(null); }}
        editGoal={editGoal}
        userId={user?.id || ""}
        onSaved={refreshGoals}
      />
    </div>
  );
}
