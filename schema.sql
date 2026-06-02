-- SEQUENCES
CREATE SEQUENCE USER_SEQ     START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE LEAVE_SEQ    START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE APPROVAL_SEQ START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE LTYPE_SEQ    START WITH 10 INCREMENT BY 1;
CREATE SEQUENCE HOLIDAY_SEQ  START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE BALANCE_SEQ  START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE FAQ_SEQ      START WITH 1 INCREMENT BY 1;

-- TABLE: USERS
CREATE TABLE USERS (
    user_id       NUMBER PRIMARY KEY,
    name          VARCHAR2(100)  NOT NULL,
    email         VARCHAR2(150)  UNIQUE NOT NULL,
    password_hash VARCHAR2(255)  NOT NULL,
    role          VARCHAR2(20)   DEFAULT 'employee',   -- employee | manager | hr
    department    VARCHAR2(100),
    manager_id    NUMBER REFERENCES USERS(user_id),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: LEAVE_TYPES
CREATE TABLE LEAVE_TYPES (
    type_id        NUMBER PRIMARY KEY,
    name           VARCHAR2(50)  NOT NULL,
    description    VARCHAR2(255),
    quota_per_year NUMBER        NOT NULL,
    is_active      NUMBER(1)     DEFAULT 1
);

-- TABLE: LEAVES
CREATE TABLE LEAVES (
    leave_id   NUMBER PRIMARY KEY,
    user_id    NUMBER NOT NULL REFERENCES USERS(user_id),
    type_id    NUMBER NOT NULL REFERENCES LEAVE_TYPES(type_id),
    start_date DATE   NOT NULL,
    end_date   DATE   NOT NULL,
    days_count NUMBER NOT NULL,
    reason     VARCHAR2(500) NOT NULL,
    status     VARCHAR2(20)  DEFAULT 'Pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: LEAVE_BALANCE
CREATE TABLE LEAVE_BALANCE (
    balance_id NUMBER PRIMARY KEY,
    user_id    NUMBER NOT NULL REFERENCES USERS(user_id),
    type_id    NUMBER NOT NULL REFERENCES LEAVE_TYPES(type_id),
    year       NUMBER NOT NULL,
    total      NUMBER NOT NULL,
    used       NUMBER DEFAULT 0,
    remaining  NUMBER GENERATED ALWAYS AS (total - used) VIRTUAL
);

-- TABLE: APPROVALS
CREATE TABLE APPROVALS (
    approval_id NUMBER PRIMARY KEY,
    leave_id    NUMBER NOT NULL REFERENCES LEAVES(leave_id),
    manager_id  NUMBER NOT NULL REFERENCES USERS(user_id),
    approval_action      VARCHAR2(20)  NOT NULL,   -- Approved | Rejected
    manager_comment     VARCHAR2(500),
    actioned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- TABLE: LEAVE_POLICY_FAQS
CREATE TABLE LEAVE_POLICY_FAQS (
    faq_id   NUMBER PRIMARY KEY,
    question VARCHAR2(500) NOT NULL,
    answer   CLOB          NOT NULL,
    category VARCHAR2(100),
    keywords VARCHAR2(300)
);

-- TABLE: HOLIDAYS
CREATE TABLE HOLIDAYS (
    holiday_id  NUMBER PRIMARY KEY,
    name        VARCHAR2(100) NOT NULL,
    date_col    DATE          NOT NULL,
    is_optional NUMBER(1)     DEFAULT 0
);

-- SEED DATA
INSERT INTO LEAVE_TYPES VALUES (1, 'Casual Leave',   'For personal work',         12, 1);
INSERT INTO LEAVE_TYPES VALUES (2, 'Sick Leave',     'Medical purposes',          10, 1);
INSERT INTO LEAVE_TYPES VALUES (3, 'Earned Leave',   'Earned by service',         15, 1);
INSERT INTO LEAVE_TYPES VALUES (4, 'Comp-off',       'Worked on holiday/weekend',  5, 1);
INSERT INTO LEAVE_TYPES VALUES (5, 'Maternity Leave','Maternity benefit',         90, 1);

INSERT INTO HOLIDAYS VALUES (HOLIDAY_SEQ.NEXTVAL, 'Republic Day',     DATE '2025-01-26', 0);
INSERT INTO HOLIDAYS VALUES (HOLIDAY_SEQ.NEXTVAL, 'Holi',             DATE '2025-03-14', 1);
INSERT INTO HOLIDAYS VALUES (HOLIDAY_SEQ.NEXTVAL, 'Independence Day', DATE '2025-08-15', 0);
INSERT INTO HOLIDAYS VALUES (HOLIDAY_SEQ.NEXTVAL, 'Diwali',           DATE '2025-10-20', 1);
INSERT INTO HOLIDAYS VALUES (HOLIDAY_SEQ.NEXTVAL, 'Christmas',        DATE '2025-12-25', 0);

-- SEED: First HR Admin (generated bcrypt hash for 'admin123' — replace via Python)
-- Run in Python once: from passlib.context import CryptContext; print(CryptContext(schemes=["bcrypt"]).hash("admin123"))
INSERT INTO USERS (user_id, name, email, password_hash, role, department, manager_id, created_at)
VALUES (USER_SEQ.NEXTVAL, 'HR Admin', 'hr@company.com', '<PASTE_BCRYPT_HASH_HERE>', 'hr', 'HR', NULL, CURRENT_TIMESTAMP);

COMMIT;

INSERT INTO LEAVE_POLICY_FAQS VALUES (FAQ_SEQ.NEXTVAL, 'How many casual leaves per year?', 'Each employee gets 12 casual leaves per calendar year. They cannot be carried forward.', 'Casual', 'casual leave per year count');
INSERT INTO LEAVE_POLICY_FAQS VALUES (FAQ_SEQ.NEXTVAL, 'Can sick leave be carried forward?', 'Sick leave can be carried forward up to 30 days maximum to the next year.', 'Sick', 'sick leave carry forward next year');
INSERT INTO LEAVE_POLICY_FAQS VALUES (FAQ_SEQ.NEXTVAL, 'What is the minimum notice for earned leave?', 'Earned leave requires at least 3 days advance notice to your manager.', 'Earned', 'earned leave notice advance');
INSERT INTO LEAVE_POLICY_FAQS VALUES (FAQ_SEQ.NEXTVAL, 'Can I take earned leave in first 6 months?', 'Earned leave can only be availed after completing 6 months of service.', 'Earned', 'earned leave first 6 months new joinee');
INSERT INTO LEAVE_POLICY_FAQS VALUES (FAQ_SEQ.NEXTVAL, 'What happens if I have negative leave balance?', 'You cannot apply for leave if your balance is zero. The system blocks the application automatically.', 'General', 'negative balance insufficient leave block');
commit;
