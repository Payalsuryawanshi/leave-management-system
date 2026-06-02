from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os

from rag_service import generate_response
from db import get_connection

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", os.getenv("FRONTEND_URL", "http://localhost:3000")]}})

@app.route('/chatbot/ask', methods=['POST'])
def ask_chatbot():
    """Handle chatbot questions"""
    data = request.get_json()
    
    if not data or 'question' not in data:
        return jsonify({"error": "Missing question"}), 400
    
    question = data['question']
    user_id = data.get('user_id')
    role = data.get('role', 'employee')
    
    result = generate_response(question, user_id, role)
    return jsonify(result)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok"})

@app.route('/', methods=['GET'])
def root():
    return jsonify({"service": "AI Leave Chatbot", "status": "running"})

if __name__ == '__main__':
    # Test DB connection on startup
    try:
        conn = get_connection()
        conn.close()
        print("AI Service: Database connected")
    except Exception as e:
        print(f"AI Service: Database error - {e}")
    
    app.run(host='0.0.0.0', port=5000, debug=True)