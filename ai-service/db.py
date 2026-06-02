import oracledb
import os
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER", "leave_app")
DB_PASSWORD = os.getenv("DB_PASSWORD", "leave123")
DB_DSN = os.getenv("DB_DSN", "localhost:1521/XEPDB1")

def get_connection():
    return oracledb.connect(user=DB_USER, password=DB_PASSWORD, dsn=DB_DSN)

def to_text(value) -> str:
    """Convert Oracle LOB/string values into plain text."""
    if value is None:
        return ""
    if hasattr(value, "read"):
        return value.read()
    return str(value)

def fetch_faq_context(question: str) -> str:
    """Search FAQs for relevant policy information"""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Split question into keywords
    keywords = question.lower().split()
    answers = set()
    
    for word in keywords:
        if len(word) < 3:  # Skip short words
            continue
        cursor.execute(
            """SELECT answer FROM LEAVE_POLICY_FAQS 
               WHERE LOWER(keywords) LIKE :kw OR LOWER(question) LIKE :kw
               FETCH FIRST 2 ROWS ONLY""",
            {"kw": f"%{word}%"}
        )
        for row in cursor.fetchall():
            answer = to_text(row[0]).strip()
            if answer:
                answers.add(answer)
    
    cursor.close()
    conn.close()
    
    # Return top 3 answers joined
    return "\n".join(list(answers)[:3]) if answers else "No specific policy found."


def fetch_active_leave_types() -> str:
    """Fetch the list of active leave types available in the system."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT name FROM LEAVE_TYPES WHERE is_active = 1 ORDER BY type_id"""
    )
    types = [to_text(row[0]).strip() for row in cursor.fetchall() if row[0] is not None]
    cursor.close()
    conn.close()
    return ", ".join(types) if types else "No active leave types found."


def fetch_user_balance(user_id: int) -> str:
    """Fetch user's current leave balances"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """SELECT lt.name, (lb.total - lb.used) as remaining 
           FROM LEAVE_BALANCE lb
           JOIN LEAVE_TYPES lt ON lb.type_id = lt.type_id
           WHERE lb.user_id = :user_id_param AND lb.year = EXTRACT(YEAR FROM SYSDATE)
           AND lt.is_active = 1""",
        {"user_id_param": user_id}
    )
    
    balances = []
    for row in cursor.fetchall():
        balances.append(f"{row[0]}: {row[1]} days remaining")
    
    cursor.close()
    conn.close()
    return ", ".join(balances) if balances else "No leave balances found."
