import google.generativeai as genai
import os
from dotenv import load_dotenv
from db import get_connection
from prompts import SQL_PROMPT

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("gemini-2.5-flash")


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
    Does this require database lookup?

    Answer YES or NO.
    """

    response = model.generate_content(check_prompt)
    return "yes" in response.text.strip().lower()


def generate_sql(question: str) -> str:
    prompt = SQL_PROMPT.format(question=question)
    response = model.generate_content(prompt)

    sql = clean_sql(response.text)

    if not sql.lower().startswith("select"):
        raise ValueError("Only SELECT queries allowed")

    forbidden = ["insert", "update", "delete", "drop", "alter", "truncate"]
    if any(w in sql.lower() for w in forbidden):
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


def handle_general_chat(question: str):
    prompt = f"""
    You are Genperm, a friendly jewelry assistant.

    User: "{question}"

    Keep reply short, elegant, contextual.
    """

    reply = model.generate_content(prompt)
    return reply.text.strip()


def answer_question(question: str):
    if not is_db_related_question(question):
        return None, handle_general_chat(question)

    try:
        sql = generate_sql(question)
        columns, rows = run_query(sql)

        if not rows:
            return sql, "I checked our collection, but nothing matched."

        answer_prompt = f"""
        Based only on this SQL result, answer clearly:

        User question:
        {question}

        SQL result:
        {rows}
        """

        final = model.generate_content(answer_prompt)
        return sql, final.text.strip()

    except:
        return None, "I had trouble checking the database."
