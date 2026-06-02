import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from dotenv import load_dotenv

from db import fetch_faq_context, fetch_user_balance, fetch_active_leave_types

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_URL = os.getenv("GROQ_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2")


def ask_groq_ai(prompt: str) -> str:
    """Generate an answer using Groq's OpenAI-compatible API."""
    payload = {
        "model": GROQ_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 300,
    }
    request = Request(
        GROQ_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0",
        },
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"].strip()


def ask_local_ai(prompt: str) -> str:
    """Generate an answer using a local Ollama model."""
    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3,
            "num_predict": 300,
        },
    }
    request = Request(
        OLLAMA_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    with urlopen(request, timeout=60) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data.get("response", "").strip()

def generate_response(question: str, user_id: int | None = None, role: str = "employee") -> dict:
    """Generate AI response using RAG approach. Tailor responses based on user role."""
    # Step 1: Fetch relevant FAQ context
    faq_context = fetch_faq_context(question)
    active_leave_types = fetch_active_leave_types()

    # Step 2: Fetch user's leave balance if available
    if user_id is not None:
        balance_info = fetch_user_balance(user_id)
        balance_section = f"Employee Current Balance:\n{balance_info}\n\n"
    else:
        balance_section = "No user-specific balance information is available. Answer general policy questions without inventing a balance.\n\n"

    # Step 3: Build role-aware prompt
    base = (
        "You are a friendly AI assistant for a company leave management system. Use the policy information to answer.\n\n"
        f"Company Leave Policy:\n{faq_context}\n\n"
        f"Active Leave Types in the system:\n{active_leave_types}\n\n"
        f"{balance_section}"
    )

    if role and role.lower() == "manager":
        role_prefix = (
            "You are answering as a manager using this leave management app. Managers can review pending leave requests on the Manager Dashboard and view team leave events on the Team Calendar. "
            "Do not invent UI options that do not exist. If the question is general, answer the process clearly without assuming a specific employee ID.\n\n"
        )
    else:
        role_prefix = (
            "Answer as the HR assistant to the employee: be friendly, concise, and indicate the employee's options where relevant. "
            "If no user balance is available, answer with general leave policy guidance.\n\n"
        )

    prompt = base + role_prefix + f"User Question: {question}\n\nAnswer in 2-3 sentences, be specific and friendly:"
    
    # Step 4: Use Groq if configured, otherwise use local Ollama.
    source = f"policy+balance+local-ai:{OLLAMA_MODEL}"
    try:
        if GROQ_API_KEY:
            source = f"policy+balance+groq:{GROQ_MODEL}"
            answer = ask_groq_ai(prompt)
        else:
            answer = ask_local_ai(prompt)

        if not answer:
            answer = "I found your leave details, but the AI model returned an empty response."
    except HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        answer = "I'm sorry, Groq returned an error. Please check the Flask terminal for details."
        print(f"Groq HTTP Error {e.code}: {error_body}")
    except (URLError, TimeoutError, ConnectionError) as e:
        answer = "I'm sorry, I can't connect to the AI service. Please check Groq or start Ollama and try again."
        print(f"AI Error: {e}")
    except Exception as e:
        answer = "I'm sorry, the AI service had trouble generating a response. Please try again later."
        print(f"AI Error: {e}")
    
    return {
        "answer": answer,
        "source": source
    }
