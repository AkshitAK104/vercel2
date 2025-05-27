import os
from flask import Flask, request, jsonify
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)

app = Flask(__name__)

@app.route('/groq/metadata', methods=['POST'])
def extract_metadata():
    text = request.json.get('html', '')
    prompt = f"""
Extract the following as JSON from this Amazon product section text:
- title
- brand (if available)
- model (if available)

TEXT:
{text}
Return only JSON.
"""
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192",
    )
    output = chat_completion.choices[0].message.content
    try:
        import json
        return jsonify(json.loads(output))
    except Exception:
        return jsonify({"title": "", "brand": "", "model": ""})

@app.route('/groq/price', methods=['POST'])
def extract_price():
    text = request.json.get('html', '')
    prompt = f"""
Extract the product price from the following text. Return only the price as a number (no currency symbol or text). If not found, return null.

TEXT:
{text}
"""
    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192",
    )
    output = chat_completion.choices[0].message.content.strip()
    import re
    price = re.sub(r"[^\d.]", "", output)
    try:
        price_val = float(price)
        return jsonify({"price": price_val})
    except Exception:
        return jsonify({"price": None})

if __name__ == "__main__":
    app.run(port=8000)
