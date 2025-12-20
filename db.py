import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

# ==========================================================
# DATABASE CONNECTION
# ==========================================================
def get_connection():
    """
    Creates and returns a MySQL connection using .env vars.
    """
    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT")),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        database=os.getenv("DB_NAME")
    )


# ==========================================================
# OPTIONAL SQL CLEANER (shared by both modules)
# ==========================================================
def clean_sql(sql: str) -> str:
    """
    Removes markdown formatting from SQL text.
    """
    return (
        sql.replace("```sql", "")
           .replace("```", "")
           .strip()
    )
