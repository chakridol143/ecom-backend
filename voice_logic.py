import google.generativeai as genai
import os
from dotenv import load_dotenv

from logic import answer_question

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


# ============================================================
# CLASSIFIER
# ============================================================
def classify_query(message: str) -> str:
    text = message.lower().strip()

    # Quick rule-based greetings
    greetings = ["hi", "hello", "hey", "hai", "good morning", "morning", "good evening"]
    if text in greetings:
        return "greeting"

    # E-commerce keywords → DB query
    product_keywords = [
        "product", "price", "cost", "cheap", "expensive", "gold",
        "diamond", "jewellery", "stock", "available", "top",
        "bestseller", "latest", "collection"
    ]
    if any(word in text for word in product_keywords):
        return "db_query"

    # Ask Gemini when unclear
    prompt = f"""
    Classify the user message into ONE label:
    - greeting
    - db_query
    - general_chat

    Message:
    "{message}"

    Return only one word.
    """

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(prompt)
        result = response.text.strip().lower()
        if result in ["greeting", "db_query", "general_chat"]:
            return result
    except Exception:
        pass

    return "general_chat"


# ============================================================
# MAIN VOICE HANDLER
# ============================================================
def process_voice_command(user_text: str) -> str:

    if not user_text:
        return "I didn't hear anything. Please try again."

    category = classify_query(user_text)

    # Greeting
    if category == "greeting":
        return "Hello! How can I assist you with our products today?"

    # DB or product-related question
    if category == "db_query":
        sql_query, answer = answer_question(user_text)
        if not answer:
            return "I checked the database, but I couldn't find anything matching your request."
        return answer

    # Small talk / normal chat
    sql_query, reply = answer_question(user_text)
    return reply
