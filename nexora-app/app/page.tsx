"use client";

import { HeroGeometric } from "@/components/ui/shape-landing-hero";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Brain,
  BarChart3,
  MessageSquare,
  Target,
  TrendingUp,
  Shield,
  ArrowRight,
  Sparkles,
  PieChart,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { useApp } from "@/lib/context";

const features = [
  {
    icon: Brain,
    title: "AI Categorization",
    description: "Automatically categorize expenses using intelligent keyword matching and pattern recognition.",
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: MessageSquare,
    title: "SMS Parsing",
    description: "Paste bank SMS messages and instantly extract expense details — amount, merchant, and category.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Financial Dashboard",
    description: "Interactive charts showing category distribution, monthly trends, and spending comparisons.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: TrendingUp,
    title: "Expense Predictions",
    description: "AI-powered predictions for next month's expenses based on your spending patterns.",
    gradient: "from-orange-500 to-amber-500",
  },
  {
    icon: Target,
    title: "Savings Goals",
    description: "Set financial goals, track progress with visual indicators, and get smart suggestions.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Bell,
    title: "Budget Alerts",
    description: "Real-time alerts when you approach or exceed your monthly spending limits.",
    gradient: "from-red-500 to-rose-500",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group relative p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-500"
    >
      <div
        className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${gradient} mb-4 shadow-lg`}
      >
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-white/50 leading-relaxed">{description}</p>
    </motion.div>
  );
}

export default function LandingPage() {
  const { user } = useApp();

  return (
    <div className="bg-[#030303]">
      {/* Hero Section */}
      <div className="relative">
        <HeroGeometric
          badge="FinTrack — Smart Finance"
          title1="Track Expenses"
          title2="Grow Savings"
        />
        {/* CTA Overlay */}
        <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center gap-4">
          <Link href={user ? "/dashboard" : "/register"}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-indigo-500 to-rose-500 hover:from-indigo-600 hover:to-rose-600 text-white border-0 rounded-full px-8 h-12 text-base font-medium shadow-xl shadow-indigo-500/20"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          {!user && (
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 h-12 text-base text-white/80 border-white/20 hover:bg-white/10 hover:border-white/30"
              >
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-24 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] mb-6">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-white/60">Powered by AI</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              Everything You Need to{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-rose-400">
                Master Your Finances
              </span>
            </h2>
            <p className="text-lg text-white/40 max-w-2xl mx-auto">
              From automatic expense tracking to predictive analytics — all in
              one beautiful dashboard.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 border-t border-white/[0.05]">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "12+", label: "Features" },
              { value: "AI", label: "Powered" },
              { value: "100%", label: "Free" },
              { value: "∞", label: "Insights" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
                  {stat.value}
                </div>
                <div className="text-sm text-white/40 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-white/[0.05] text-center">
        <p className="text-sm text-white/30">
          © 2026 FinTrack — Built for Nexora Hackathon
        </p>
      </footer>
    </div>
  );
}
