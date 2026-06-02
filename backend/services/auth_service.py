import oracledb
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from db import get_connection

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# ─── Password Utilities ───────────────────────────────────────────

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ─── JWT Utilities ────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
        role = payload.get("role")
        if user_id is None or role is None:
            return None
        return {"user_id": user_id, "role": role}
    except (JWTError, TypeError, ValueError):
        return None

# ─── DB Queries ───────────────────────────────────────────────────

def get_user_by_email(email: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, name, email, password_hash, role, department, manager_id "
        "FROM USERS WHERE email = :email",
        {"email": email}
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return {
            "user_id": row[0],
            "name":    row[1],
            "email":   row[2],
            "password_hash": row[3],
            "role":       row[4],
            "department": row[5],
            "manager_id": row[6]
        }
    return None

def get_user_by_id(user_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, name, email, role, department, manager_id "
        "FROM USERS WHERE user_id = :user_id",
        {"user_id": user_id}
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if row:
        return {
            "user_id":    row[0],
            "name":       row[1],
            "email":      row[2],
            "role":       row[3],
            "department": row[4],
            "manager_id": row[5]
        }
    return None

def create_user_in_db(user_data: dict) -> int:
    conn = get_connection()
    cursor = conn.cursor()

    # Step 1 — Insert into USERS, then fetch the generated user_id from the sequence
    cursor.execute(
        """INSERT INTO USERS (user_id, name, email, password_hash, role, department, manager_id, created_at)
           VALUES (USER_SEQ.NEXTVAL, :uname, :uemail, :uhash, :urole, :udept, :umgr_id, CURRENT_TIMESTAMP)""",
        {
            "uname":   user_data["name"],
            "uemail":  user_data["email"],
            "uhash":   user_data["password_hash"],
            "urole":   user_data["role"],
            "udept":   user_data.get("department"),
            "umgr_id": user_data.get("manager_id")
        }
    )
    cursor.execute("SELECT USER_SEQ.CURRVAL FROM DUAL")
    user_id = int(cursor.fetchone()[0])

    # Step 2 — Auto create leave balance if employee
    if user_data["role"] == "employee":
        cursor.execute(
            "SELECT type_id, quota_per_year FROM LEAVE_TYPES WHERE is_active = 1"
        )
        leave_types = cursor.fetchall()
        for type_id, quota in leave_types:
            cursor.execute(
                """INSERT INTO LEAVE_BALANCE (balance_id, user_id, type_id, year, total, used)
                   VALUES (BALANCE_SEQ.NEXTVAL, :1, :2, EXTRACT(YEAR FROM SYSDATE), :3, 0)""",
                [user_id, int(type_id), int(quota)]
            )

    # Step 3 — Single commit saves both USERS and LEAVE_BALANCE
    conn.commit()
    cursor.close()
    conn.close()
    return user_id

# ─── FastAPI Dependencies ─────────────────────────────────────────

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = get_user_by_id(payload["user_id"])
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles):
    def checker(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return user
    return checker