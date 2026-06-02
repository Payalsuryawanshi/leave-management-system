import os
from dotenv import load_dotenv

load_dotenv()

# Database
DB_USER     = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

# Build DSN from components so containers can use DB_HOST
DB_HOST     = os.getenv("DB_HOST")
DB_PORT     = os.getenv("DB_PORT")
DB_SERVICE  = os.getenv("DB_SERVICE")
DB_DSN      = os.getenv("DB_DSN", f"{DB_HOST}:{DB_PORT}/{DB_SERVICE}")

# JWT
SECRET_KEY                  = os.getenv("SECRET_KEY", "dev_secret_change_in_production")
ALGORITHM                   = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
