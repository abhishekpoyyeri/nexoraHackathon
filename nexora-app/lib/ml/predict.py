import sys
import json
import joblib

# Expect input via stdin as JSON or as command-line args
# We'll read a JSON string from stdin

input_data = json.load(sys.stdin)

# load model
model = joblib.load("expense_model.pkl")

# prepare feature matrix (just single sample)
month_index = input_data.get("month_index")
income = input_data.get("income")

features = [[month_index, income]]

prediction = model.predict(features)

# output JSON
output = {"prediction": float(prediction[0])}
print(json.dumps(output))
