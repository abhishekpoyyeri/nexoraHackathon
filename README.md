# Nexora - Smart Personal Finance & Expense Tracker

Nexora is an intelligent, AI-powered personal finance and expense tracking application built for a hackathon. It goes beyond simple expense logging by providing OCR-based receipt parsing, machine learning-driven expense predictions, automated categorization, and deep financial insights.

## ✨ Core Features

*   **📊 Smart Expense Dashboard:** 
    *   Get a bird's-eye view of your finances with interactive Recharts visualizations (Pie charts for category spending, Line charts for monthly trends, and Bar charts for comparisons).
    *   Track your remaining monthly budget, daily average spending, and your highest spending categories at a glance.
*   **📷 Automated Receipt Parsing (OCR):**
    *   Simply upload a receipt image or UPI payment screenshot. Using `tesseract.js`, the app automatically extracts the amount, date, and merchant name, reducing manual data entry.
*   **🤖 Machine Learning Expense Prediction:**
    *   Leverages a custom-trained Python Scikit-learn model (`LinearRegression`) to predict your total future monthly expenses based on your income and historical spending timeline.
*   **🏷️ Intelligent Categorization:**
    *   A built-in categorization engine automatically tags your expenses (e.g., Food, Transport, Bills, Entertainment) based on the merchant name and description keywords.
*   **💡 Smart Insights & Budget Alerts:**
    *   Automatically generates tailored financial insights (e.g., spending increases/decreases in specific categories).
    *   Alerts you proactively when you are approaching or exceeding your predefined monthly budget.
*   **📄 PDF Report Generation:**
    *   Generate and download clean, formatted PDF reports of your expense history for your personal records or reimbursement processes using `jspdf`.
*   **🔒 Secure Authentication & Cloud Sync:**
    *   User authentication and real-time database synchronization powered by Firebase (Auth & Firestore) ensure your financial data is secure and accessible anywhere.

## 🛠️ Tech Stack

**Frontend & App Framework**
*   **Framework:** Next.js (App Router), React
*   **Styling & UI:** Tailwind CSS, Shadcn UI, Framer Motion (for animations)
*   **Data Visualization:** Recharts
*   **Utility:** `lucide-react` (icons), `date-fns` (date formatting)

**Backend & Data Integration**
*   **Database & Auth:** Firebase (Firestore, Authentication)
*   **OCR Engine:** Tesseract.js
*   **PDF Generation:** `jspdf`, `jspdf-autotable`
*   **CSV Parsing:** PapaParse

**Machine Learning (Python)**
*   **Libraries:** Pandas, Scikit-learn (`LinearRegression`), Joblib
*   *(Located in the `/hackathon` directory for training the expense prediction model)*

## 🚀 Getting Started

### 1. Web Application Setup

Navigate to the application folder and install dependencies:

```bash
cd nexora-app
npm install
```

Set up your Firebase credentials in your `.env.local` file, then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app in action.

### 2. Machine Learning Model Training (Optional)

If you want to re-train the predictive expense model:

```bash
cd hackathon
# Ensure you have python and pip installed
pip install pandas scikit-learn joblib
python train_model.py
```
This will read the provided dataset (`ml_expense_dataset_5000.csv`), train the linear regression model, and output the compiled `expense_model.pkl` file.

## 🤝 Contributing

This project was built for a hackathon. Feel free to fork the repository, submit pull requests, or open issues to improve the ML algorithms, OCR accuracy, or UI components!
