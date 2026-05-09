import { ExpenseCategory } from "./types";

const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
    Food: [
        "swiggy", "zomato", "restaurant", "café", "cafe", "pizza", "burger",
        "food", "lunch", "dinner", "breakfast", "biryani", "dominos", "mcdonalds",
        "kfc", "subway", "starbucks", "chai", "tea", "coffee", "bakery", "snack",
        "eat", "dine", "canteen", "mess", "tiffin",
    ],
    Transport: [
        "uber", "ola", "rapido", "metro", "bus", "train", "fuel", "petrol",
        "diesel", "parking", "toll", "cab", "auto", "rickshaw", "ride",
        "irctc", "flight", "airline", "taxi",
    ],
    Shopping: [
        "amazon", "flipkart", "myntra", "ajio", "shopping", "mall", "store",
        "purchase", "buy", "order", "nykaa", "meesho", "snapdeal", "clothes",
        "shoes", "fashion", "electronics",
    ],
    Entertainment: [
        "netflix", "prime", "hotstar", "disney", "movie", "cinema", "pvr",
        "inox", "game", "gaming", "spotify", "music", "concert", "show",
        "theatre", "theater", "youtube", "subscription",
    ],
    Bills: [
        "electricity", "water", "gas", "internet", "wifi", "broadband",
        "phone", "mobile", "recharge", "bill", "postpaid", "prepaid",
        "airtel", "jio", "vodafone", "bsnl",
    ],
    Health: [
        "hospital", "doctor", "medicine", "pharmacy", "medical", "health",
        "clinic", "lab", "test", "diagnosis", "apollo", "medplus", "gym",
        "fitness", "yoga", "dental",
    ],
    Education: [
        "course", "udemy", "coursera", "book", "tuition", "school",
        "college", "university", "education", "class", "exam", "study",
        "library", "stationery",
    ],
    Travel: [
        "hotel", "resort", "booking", "trip", "travel", "vacation",
        "holiday", "makemytrip", "goibibo", "airbnb", "oyo", "tourism",
    ],
    Groceries: [
        "grocery", "bigbasket", "blinkit", "zepto", "instamart", "vegetables",
        "fruits", "milk", "bread", "rice", "oil", "supermarket", "dmart",
        "reliance", "fresh",
    ],
    Rent: [
        "rent", "lease", "tenant", "landlord", "housing", "apartment",
        "flat", "room", "pg", "hostel",
    ],
    Subscriptions: [
        "subscription", "plan", "premium", "membership", "annual",
        "monthly", "renewal", "recurring",
    ],
    Other: [],
};

export function categorizeExpense(description: string, merchant?: string): ExpenseCategory {
    const text = `${description} ${merchant || ""}`.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (category === "Other") continue;
        for (const keyword of keywords) {
            if (text.includes(keyword)) {
                return category as ExpenseCategory;
            }
        }
    }

    return "Other";
}
