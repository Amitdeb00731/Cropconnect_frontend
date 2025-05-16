from flask import Flask, request, jsonify
import razorpay
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for local frontend development

# Razorpay API credentials
RAZORPAY_KEY_ID = "rzp_test_scet4UBwOD44XB"
RAZORPAY_KEY_SECRET = "qTCozJF8XO6ifc8ygpvA0R86"

# Razorpay client setup
client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


@app.route('/create-order', methods=['POST'])
def create_order():
    data = request.json
    try:
        amount = int(data.get("amount")) * 100  # ₹100 → 10000 paise
        currency = data.get("currency", "INR")

        razorpay_order = client.order.create({
            "amount": amount,
            "currency": currency,
            "payment_capture": 1  # Auto capture after payment
        })

        return jsonify({
            "order_id": razorpay_order["id"],
            "amount": razorpay_order["amount"],
            "currency": razorpay_order["currency"],
            "key": RAZORPAY_KEY_ID
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
   app.run(debug=True)

