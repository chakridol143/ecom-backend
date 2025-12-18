import google.generativeai as genai
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

from db import get_connection
from prompts import SQL_PROMPT

# ------------------------
# Load environment
# ------------------------
load_dotenv()

# ------------------------
# Gemini setup
# ------------------------
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# ✅ FIX 1: Use the correct model version to prevent 404 errors
model = genai.GenerativeModel("gemini-2.5-flash") 

# ------------------------
# Helpers (LOGIC UNCHANGED)
# ------------------------
def clean_sql(sql: str) -> str:
    return (
        sql.replace("```sql", "")
           .replace("```", "")
           .strip()
    )

def is_db_related_question(question: str) -> bool:
    """
    Uses Gemini to decide whether the question
    can be answered using the given database schema.
    Returns True or False.
    """
    # Small tweak: Added 'created_at' and 'image_url' to prompt text only
    # This helps the AI understand "top" or "newest" questions better.
    check_prompt = f"""
You are a classifier.

Database schema:
products(product_id, name, description, price, stock_quantity, category_id, image_url, created_at)

Question:
{question}

Task:
Does this question require looking up products, prices, stock, or inventory in the database?

Answer ONLY one word:
YES or NO
"""
    response = model.generate_content(check_prompt)
    decision = response.text.strip().lower()
    return "yes" in decision

# ------------------------
# ✅ FIX 2: New General Chat Handler
# ------------------------
def handle_general_chat(question: str) -> str:
    """
    Handles 'Hi', 'Hello', 'Who are you', and other non-database questions.
    """
    chat_prompt = f"""
    You are 'Genperm', a friendly luxury jewelry specialist.
    
    User says: "{question}"
    
    Instructions:
    - If it's a greeting (Hi, Hello), welcome them warmly to Genperm.
    - If it's polite (Thanks), say "You're welcome".
    - If it's off-topic (Politics, Weather), politely say you only know about jewelry.
    - Keep it short and elegant.
    """
    response = model.generate_content(chat_prompt)
    return response.text.strip()

# ------------------------
# SQL Generation (LOGIC UNCHANGED)
# ------------------------
def generate_sql(question: str) -> str:
    prompt = SQL_PROMPT.format(question=question)
    response = model.generate_content(prompt)

    sql = clean_sql(response.text)

    # Enforce SELECT only
    if not sql.lower().startswith("select"):
        raise ValueError("Only SELECT queries are allowed")

    # Block unsafe keywords
    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate"]
    if any(word in sql.lower() for word in forbidden):
        raise ValueError("Unsafe SQL detected")

    return sql

# ------------------------
# Database Execution (LOGIC UNCHANGED)
# ------------------------
def run_query(sql: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()
    columns = cursor.column_names
    conn.close()
    return columns, rows

# ------------------------
# Question → Answer (LOGIC MODIFIED for General Chat)
# ------------------------
def answer_question(question: str):
    # 🔴 Check if question is outside DB scope
    if not is_db_related_question(question):
        # ✅ FIX 3: Instead of returning "sorry", we talk back!
        general_reply = handle_general_chat(question)
        return None, general_reply

    try:
        sql = generate_sql(question)
        columns, rows = run_query(sql)

        if not rows:
            return sql, "I checked our collection, but I couldn't find exactly that. Would you like to see our bestsellers?"

        answer_prompt = f"""
You are a database assistant.

RULES:
- Use ONLY the SQL result
- Do NOT add external knowledge

User question:
{question}

SQL result:
{rows}

Answer clearly in natural language.
"""
        final_answer = model.generate_content(answer_prompt)
        return sql, final_answer.text.strip()
    
    except Exception as e:
        print(f"Query Error: {e}")
        return None, "I encountered an issue checking the database. Please try again."

# ==========================================
# FLASK SERVER SETUP
# ==========================================

app = Flask(__name__)
CORS(app)  # Enables the Angular frontend to access this API

@app.route('/chat', methods=['POST'])
def chat():
    try:
        # 1. Get message from Frontend
        data = request.json
        user_input = data.get('message', '').strip()

        if not user_input:
            return jsonify({"error": "No message provided"}), 400

        # 2. Run logic
        sql_query, answer = answer_question(user_input)

        # 3. Send JSON response back to Frontend
        return jsonify({
            "reply": answer,
            "generated_sql": sql_query
        })

    except Exception as e:
        print(f"❌ Server Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 API Server running on http://localhost:5000")
    app.run(port=5000, debug=True)