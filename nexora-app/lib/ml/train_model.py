import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error
import joblib

# Load dataset

data = pd.read_csv("ml_expense_dataset_5000.csv")

# Convert date column to datetime
data['date'] = pd.to_datetime(data['date'])

# Aggregate monthly expense per user
monthly_expense = data.groupby(['user_id','month']).agg({
    'amount':'sum',
    'income':'mean'
}).reset_index()

# Rename columns
monthly_expense.rename(columns={'amount':'total_expense'}, inplace=True)

# Convert month to numerical index
monthly_expense['month_index'] = monthly_expense.groupby('user_id').cumcount()

# Features and target
X = monthly_expense[['month_index','income']]
y = monthly_expense['total_expense']

# Train-test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# Create model
model = LinearRegression()

# Train model
model.fit(X_train, y_train)

# Save model to disk
joblib.dump(model, "expense_model.pkl")

# Evaluate model
predictions = model.predict(X_test)
mae = mean_absolute_error(y_test, predictions)

print("Model trained and saved successfully")
print("Mean Absolute Error:", mae)
