"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/lib/context";
import { TrendingUp, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useApp();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await register({
        name,
        email,
        password,
        monthlyIncome: parseFloat(income) || 0,
        monthlyBudget: parseFloat(income) * 0.7 || 0,
      });

      if (success) {
        toast.success("Account created! Welcome to FinTrack.");
        router.push("/dashboard");
      } else {
        toast.error("An account with this email already exists");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#030303] px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white/80 transition mb-6">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to home</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-500">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">FinTrack</span>
          </div>
        </div>

        <Card className="bg-white/[0.03] border-white/[0.08] backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-white">Create your account</CardTitle>
            <CardDescription className="text-white/40">
              Start tracking your finances today
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white/70">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30 focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/70">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30 focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="income" className="text-white/70">Monthly Income (₹)</Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="30000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30 focus:border-indigo-500/50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white/70">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="bg-white/[0.05] border-white/[0.1] text-white placeholder:text-white/30 focus:border-indigo-500/50"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0 h-11"
              >
                {loading ? "Creating account..." : "Create Account"}
              </Button>
              <p className="text-sm text-white/40">
                Already have an account?{" "}
                <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition">
                  Sign in
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
