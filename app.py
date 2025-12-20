from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import google.generativeai as genai

from logic import answer_question
from voice_logic import process_voice_command
from db import get_connection
from prompts import SQL_PROMPT


# =======================================================
# ENV + GEMINI SETUP
# =======================================================
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


# =======================================================
# HELPERS
# =======================================================
def clean_sql(sql: str) -> str:
    return (
        sql.replace("```sql", "")
           .replace("```", "")
           .strip()
    )


def is_db_related_question(question: str) -> bool:
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
    return "yes" in response.text.strip().lower()


def handle_general_chat(question: str) -> str:
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


def generate_sql(question: str) -> str:
    prompt = SQL_PROMPT.format(question=question)
    response = model.generate_content(prompt)

    sql = clean_sql(response.text)

    if not sql.lower().startswith("select"):
        raise ValueError("Only SELECT queries are allowed")

    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate"]
    if any(word in sql.lower() for word in forbidden):
        raise ValueError("Unsafe SQL detected")

    return sql


def run_query(sql: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(sql)
    rows = cursor.fetchall()
    columns = cursor.column_names
    conn.close()
    return columns, rows


def answer_question(question: str):
    if not is_db_related_question(question):
        return None, handle_general_chat(question)

    try:
        sql = generate_sql(question)
        columns, rows = run_query(sql)

        if not rows:
            return sql, "I checked our collection, but I couldn't find exactly that. Would you like to see our bestsellers?"

        answer_prompt = f"""
        You are a database assistant.
        Use ONLY the SQL result.

        User question:
        {question}

        SQL result:
        {rows}

        Answer clearly in natural language.
        """

        final = model.generate_content(answer_prompt)
        return sql, final.text.strip()

    except Exception as e:
        print(f"Query Error: {e}")
        return None, "I encountered an issue checking the database. Please try again."


# =======================================================
# FLASK SERVER
# =======================================================
app = Flask(__name__)
CORS(app)


# ----------------------------
# 1️⃣ VOICE BOT ENDPOINT
# ----------------------------
@app.route('/voice-chat', methods=['POST'])
def voice_chat():
    try:
        data = request.json
        user_text = data.get('message', '')

        reply = process_voice_command(user_text)

        return jsonify({
            "response": reply,
            "status": "success"
        })
    except Exception as e:
        print("Voice Error:", str(e))
        return jsonify({
            "response": "Server error while processing voice request.",
            "status": "error"
        }), 500


# ----------------------------
# 2️⃣ TEXT CHATBOT (PRODUCTS + GEMINI)
# ----------------------------
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('message', '').strip()

        if not user_input:
            return jsonify({"error": "No message provided"}), 400

        sql_query, answer = answer_question(user_input)

        return jsonify({
            "reply": answer,
            "generated_sql": sql_query
        })

    except Exception as e:
        print("Chat Error:", str(e))
        return jsonify({"error": str(e)}), 500


# =======================================================
# START SERVER
# =======================================================
if __name__ == '__main__':
    print("🚀 Unified API running at: http://localhost:5000")
    app.run(debug=True, port=5000)
