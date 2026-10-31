"""
SQLite Database Layer for Student Performance Prediction & Analytics System
Database file: student_performance.db
"""

import os
import json
import sqlite3
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'student_performance.db')


def get_connection():
    """Returns a SQLite connection with Row factory enabled."""
    conn = sqlite3.connect(DB_FILE, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db():
    """Initializes SQLite tables and default data."""
    with get_connection() as conn:
        cursor = conn.cursor()

        # 1. Students Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                candidate_id TEXT PRIMARY KEY,
                full_name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                mobile TEXT,
                college_name TEXT DEFAULT 'ALTS',
                course TEXT DEFAULT 'B.Tech',
                branch TEXT DEFAULT 'Computer Science',
                gender TEXT DEFAULT 'Male',
                semester TEXT DEFAULT '1st Sem',
                year_of_study TEXT DEFAULT '1st Year',
                year1_score REAL,
                year2_score REAL,
                year3_score REAL,
                mid1_score REAL DEFAULT 82.0,
                mid2_score REAL DEFAULT 85.0,
                mid_score REAL DEFAULT 83.5,
                sem1_score REAL DEFAULT 76.0,
                sem2_score REAL DEFAULT 78.5,
                sem3_score REAL DEFAULT 80.0,
                sem4_score REAL DEFAULT 81.0,
                sem5_score REAL DEFAULT 82.0,
                sem6_score REAL DEFAULT 83.5,
                sem7_score REAL DEFAULT 84.0,
                sem8_score REAL DEFAULT 85.0,
                previous_score REAL DEFAULT 75.0,
                attendance REAL DEFAULT 80.0,
                study_hours REAL DEFAULT 4.0,
                extracurricular TEXT DEFAULT 'Medium',
                password TEXT DEFAULT 'password123',
                skills TEXT DEFAULT '[]',
                prediction TEXT DEFAULT '{}',
                avatar TEXT DEFAULT 'images/avatars/avatar-1.svg',
                created_at TEXT,
                updated_at TEXT
            )
        """)

        # Ensure gender, semester, and semester marks columns exist on existing databases
        for col, col_type in [
            ('gender', "TEXT DEFAULT 'Male'"),
            ('semester', "TEXT DEFAULT '1st Sem'"),
            ('mid1_score', "REAL DEFAULT 82.0"),
            ('mid2_score', "REAL DEFAULT 85.0"),
            ('mid_score', "REAL DEFAULT 83.5"),
            ('sem1_score', "REAL DEFAULT 76.0"),
            ('sem2_score', "REAL DEFAULT 78.5"),
            ('sem3_score', "REAL DEFAULT 80.0"),
            ('sem4_score', "REAL DEFAULT 81.0"),
            ('sem5_score', "REAL DEFAULT 82.0"),
            ('sem6_score', "REAL DEFAULT 83.5"),
            ('sem7_score', "REAL DEFAULT 84.0"),
            ('sem8_score', "REAL DEFAULT 85.0"),
            ('avatar', "TEXT DEFAULT 'images/avatars/avatar-1.svg'")
        ]:
            try:
                cursor.execute(f"ALTER TABLE students ADD COLUMN {col} {col_type}")
            except Exception:
                pass

        # 2. Admins Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admins (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                role TEXT DEFAULT 'Administrator',
                created_at TEXT
            )
        """)

        # 3. Institutional Notifications Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                sender TEXT NOT NULL,
                priority TEXT DEFAULT 'info',
                category TEXT DEFAULT 'Academic Notice',
                target_candidate_id TEXT,
                timestamp TEXT,
                reactions TEXT DEFAULT '{}',
                created_at TEXT
            )
        """)

        # Indexes for fast lookup
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_student_email ON students(email)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_admin_email ON admins(email)")

        # Ensure default administrator exists
        cursor.execute("UPDATE admins SET email = 'anil9963@gmail.com', password = 'admin@2005' WHERE LOWER(email) = 'admin@gmail.com'")
        cursor.execute("SELECT id FROM admins WHERE LOWER(email) = 'anil9963@gmail.com'")
        if not cursor.fetchone():
            cursor.execute("""
                INSERT INTO admins (email, password, full_name, role, created_at)
                VALUES (?, ?, ?, ?, ?)
            """, (
                'anil9963@gmail.com',
                'admin@2005',
                'Principal Administrator',
                'Super Administrator',
                datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            ))

        # Seed initial starter notifications if table is empty
        cursor.execute("SELECT COUNT(*) AS cnt FROM notifications")
        if cursor.fetchone()['cnt'] == 0:
            now_str = datetime.now().strftime("%Y-%m-%d %I:%M %p")
            cursor.execute("""
                INSERT INTO notifications (id, title, message, sender, priority, category, target_candidate_id, timestamp, reactions, created_at)
                VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                'notif_1',
                'Mid-Semester Performance Review & Coding Milestone',
                'Welcome to the Student Analytics Portal. Please update your academic percentages and technical skills portfolio.',
                'Dean of Academics',
                'high',
                'Academic Review',
                None,
                now_str,
                '{"CAND2026": {"reaction": "👍", "studentName": "Rahul Kumar"}}',
                datetime.now().isoformat(),

                'notif_2',
                'UI/UX & Design Hackathon Registration Open',
                'Annual Design & Frontend Hackathon registrations are live. Showcase your Figma and UI design skills.',
                'Department Coordinator',
                'info',
                'Hackathon',
                None,
                now_str,
                '{}',
                datetime.now().isoformat()
            ))

        conn.commit()


# =====================================================================
# STUDENT CRUD OPERATIONS
# =====================================================================

def student_row_to_dict(row):
    """Converts a SQLite row into a camelCase student dictionary."""
    if not row:
        return None
    d = dict(row)
    skills = []
    if d.get('skills'):
        try:
            skills = json.loads(d['skills'])
        except Exception:
            skills = []

    prediction = {}
    if d.get('prediction'):
        try:
            prediction = json.loads(d['prediction'])
        except Exception:
            prediction = {}

    return {
        'candidateId': d.get('candidate_id'),
        'fullName': d.get('full_name'),
        'email': d.get('email'),
        'mobile': d.get('mobile'),
        'collegeName': d.get('college_name') or 'ALTS',
        'course': d.get('course') or 'B.Tech',
        'branch': d.get('branch') or 'Computer Science',
        'gender': d.get('gender') or 'Male',
        'semester': d.get('semester') or '1st Sem',
        'yearOfStudy': d.get('year_of_study') or '1st Year',
        'year1Score': d.get('year1_score'),
        'year2Score': d.get('year2_score'),
        'year3Score': d.get('year3_score'),
        'sem1Score': d.get('sem1_score'),
        'sem2Score': d.get('sem2_score'),
        'sem3Score': d.get('sem3_score'),
        'sem4Score': d.get('sem4_score'),
        'sem5Score': d.get('sem5_score'),
        'sem6Score': d.get('sem6_score'),
        'sem7Score': d.get('sem7_score'),
        'sem8Score': d.get('sem8_score'),
        'mid1Score': d.get('mid1_score'),
        'mid2Score': d.get('mid2_score'),
        'midScore': d.get('mid_score'),
        'previousScore': d.get('previous_score') or 75.0,
        'attendance': d.get('attendance') or 80.0,
        'studyHours': d.get('study_hours') or 4.0,
        'extracurricular': d.get('extracurricular') or 'Medium',
        'password': d.get('password') or 'password123',
        'skills': skills,
        'prediction': prediction,
        'avatar': d.get('avatar') or 'images/avatars/avatar-1.svg',
        'createdAt': d.get('created_at'),
        'updatedAt': d.get('updated_at')
    }


def get_all_students():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM students ORDER BY candidate_id ASC")
        rows = cursor.fetchall()
        return [student_row_to_dict(r) for r in rows]


def get_student_by_id(candidate_id_or_email):
    if not candidate_id_or_email:
        return None
    q = str(candidate_id_or_email).strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM students 
            WHERE LOWER(candidate_id) = ? OR LOWER(email) = ?
            LIMIT 1
        """, (q, q))
        row = cursor.fetchone()
        return student_row_to_dict(row)


def save_student(data):
    """Inserts or updates a student in SQLite."""
    candidate_id = str(data.get('candidateId') or '').strip().upper()
    email = str(data.get('email') or '').strip().lower()

    # Check if student exists by candidate_id or email
    existing = (get_student_by_id(candidate_id) if candidate_id else None) or (get_student_by_id(email) if email else None)
    if existing and not email:
        email = existing.get('email', '')
    if existing and not candidate_id:
        candidate_id = existing['candidateId']

    if not email:
        raise ValueError("Student email is required.")
    elif not candidate_id:
        # Generate new ID
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) as cnt FROM students")
            cnt = cursor.fetchone()['cnt']
            candidate_id = f"CAND{2026 + cnt}"

    # Handle semester scores
    s1 = float(data['sem1Score']) if data.get('sem1Score') is not None and str(data.get('sem1Score')).strip() != '' else (existing.get('sem1Score') if existing else None)
    s2 = float(data['sem2Score']) if data.get('sem2Score') is not None and str(data.get('sem2Score')).strip() != '' else (existing.get('sem2Score') if existing else None)
    s3 = float(data['sem3Score']) if data.get('sem3Score') is not None and str(data.get('sem3Score')).strip() != '' else (existing.get('sem3Score') if existing else None)
    s4 = float(data['sem4Score']) if data.get('sem4Score') is not None and str(data.get('sem4Score')).strip() != '' else (existing.get('sem4Score') if existing else None)
    s5 = float(data['sem5Score']) if data.get('sem5Score') is not None and str(data.get('sem5Score')).strip() != '' else (existing.get('sem5Score') if existing else None)
    s6 = float(data['sem6Score']) if data.get('sem6Score') is not None and str(data.get('sem6Score')).strip() != '' else (existing.get('sem6Score') if existing else None)
    s7 = float(data['sem7Score']) if data.get('sem7Score') is not None and str(data.get('sem7Score')).strip() != '' else (existing.get('sem7Score') if existing else None)
    s8 = float(data['sem8Score']) if data.get('sem8Score') is not None and str(data.get('sem8Score')).strip() != '' else (existing.get('sem8Score') if existing else None)

    # Handle scores
    y1 = float(data['year1Score']) if data.get('year1Score') is not None and str(data.get('year1Score')).strip() != '' else None
    y2 = float(data['year2Score']) if data.get('year2Score') is not None and str(data.get('year2Score')).strip() != '' else None
    y3 = float(data['year3Score']) if data.get('year3Score') is not None and str(data.get('year3Score')).strip() != '' else None

    # Derive y1 from s1 & s2 if not provided explicitly
    if (y1 is None or y1 == 0) and (s1 is not None or s2 is not None):
        valid_y1_sems = [s for s in [s1, s2] if s is not None and s > 0]
        if valid_y1_sems:
            y1 = round(sum(valid_y1_sems) / len(valid_y1_sems), 1)

    # Derive y2 from s3 & s4 if not provided explicitly
    if (y2 is None or y2 == 0) and (s3 is not None or s4 is not None):
        valid_y2_sems = [s for s in [s3, s4] if s is not None and s > 0]
        if valid_y2_sems:
            y2 = round(sum(valid_y2_sems) / len(valid_y2_sems), 1)

    # Derive y3 from s5 & s6 if not provided explicitly
    if (y3 is None or y3 == 0) and (s5 is not None or s6 is not None):
        valid_y3_sems = [s for s in [s5, s6] if s is not None and s > 0]
        if valid_y3_sems:
            y3 = round(sum(valid_y3_sems) / len(valid_y3_sems), 1)

    year_of_study = data.get('yearOfStudy') or (existing['yearOfStudy'] if existing else '1st Year')

    if year_of_study == '1st Year':
        valid_s = [s for s in [s1, s2] if s is not None and s > 0]
        if valid_s:
            prev_score = round(sum(valid_s) / len(valid_s), 1)
        elif y1 is not None and y1 > 0:
            prev_score = y1
        else:
            prev_score = float(data.get('previousScore') or 75.0)
    elif year_of_study == '2nd Year':
        comps = []
        if y1 is not None and y1 > 0:
            comps.append(y1)
        for s in [s3, s4]:
            if s is not None and s > 0:
                comps.append(s)
        if comps:
            prev_score = round(sum(comps) / len(comps), 1)
        else:
            prev_score = float(data.get('previousScore') or 75.0)
    elif year_of_study == '3rd Year':
        comps = []
        if y1 is not None and y1 > 0:
            comps.append(y1)
        if y2 is not None and y2 > 0:
            comps.append(y2)
        for s in [s5, s6]:
            if s is not None and s > 0:
                comps.append(s)
        if comps:
            prev_score = round(sum(comps) / len(comps), 1)
        else:
            prev_score = float(data.get('previousScore') or 75.0)
    elif year_of_study == '4th Year':
        comps = []
        for y in [y1, y2, y3]:
            if y is not None and y > 0:
                comps.append(y)
        for s in [s7, s8]:
            if s is not None and s > 0:
                comps.append(s)
        if comps:
            prev_score = round(sum(comps) / len(comps), 1)
        else:
            prev_score = float(data.get('previousScore') or 75.0)
    else:
        valid_years = [y for y in [y1, y2, y3] if y is not None and y > 0]
        if valid_years:
            prev_score = round(sum(valid_years) / len(valid_years), 1)
        else:
            prev_score = float(data.get('previousScore') or 75.0)

    # Handle mid marks
    m1 = float(data['mid1Score']) if data.get('mid1Score') is not None and data.get('mid1Score') != '' else None
    m2 = float(data['mid2Score']) if data.get('mid2Score') is not None and data.get('mid2Score') != '' else None
    valid_mids = [m for m in [m1, m2] if m is not None and m >= 0]
    mid_avg = round(sum(valid_mids) / len(valid_mids), 1) if valid_mids else float(data.get('midScore') or 83.5)

    # ML prediction calculation fallback
    prediction = data.get('prediction') or {}
    if not prediction or not prediction.get('predictedScore'):
        pred_score = round(prev_score * 0.45 + (float(data.get('attendance') or 80) * 0.35) + (float(data.get('studyHours') or 4) * 4), 1)
        pred_score = min(99.0, max(40.0, pred_score))
        classification = 'Good' if pred_score >= 80 else ('Average' if pred_score >= 60 else 'At-Risk')
        prediction = {
            'predictedScore': pred_score,
            'predictedPercentage': pred_score,
            'classification': classification,
            'performanceLabel': f"{classification} Standing",
            'confidence': 88,
            'suggestions': [
                "Maintain consistent attendance above 85% throughout the term.",
                "Review academic modules daily and complete practice assessments.",
                "Expand portfolio with hands-on coding and design capstone projects."
            ]
        }

    skills = data.get('skills') or []
    if isinstance(skills, str):
        try:
            skills = json.loads(skills)
        except Exception:
            skills = []

    avatar = data.get('avatar') or (existing.get('avatar') if existing else 'images/avatars/avatar-1.svg')
    now_iso = datetime.now().isoformat()
    created_at = data.get('createdAt') or (existing['createdAt'] if existing else now_iso)

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO students (
                candidate_id, full_name, email, mobile, college_name,
                course, branch, gender, semester, year_of_study, year1_score, year2_score,
                year3_score, sem1_score, sem2_score, sem3_score, sem4_score,
                sem5_score, sem6_score, sem7_score, sem8_score,
                mid1_score, mid2_score, mid_score, previous_score, attendance, study_hours,
                extracurricular, password, skills, prediction, avatar, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(candidate_id) DO UPDATE SET
                full_name = excluded.full_name,
                email = excluded.email,
                mobile = excluded.mobile,
                college_name = excluded.college_name,
                course = excluded.course,
                branch = excluded.branch,
                gender = excluded.gender,
                semester = excluded.semester,
                year_of_study = excluded.year_of_study,
                year1_score = excluded.year1_score,
                year2_score = excluded.year2_score,
                year3_score = excluded.year3_score,
                sem1_score = excluded.sem1_score,
                sem2_score = excluded.sem2_score,
                sem3_score = excluded.sem3_score,
                sem4_score = excluded.sem4_score,
                sem5_score = excluded.sem5_score,
                sem6_score = excluded.sem6_score,
                sem7_score = excluded.sem7_score,
                sem8_score = excluded.sem8_score,
                mid1_score = excluded.mid1_score,
                mid2_score = excluded.mid2_score,
                mid_score = excluded.mid_score,
                previous_score = excluded.previous_score,
                attendance = excluded.attendance,
                study_hours = excluded.study_hours,
                extracurricular = excluded.extracurricular,
                password = excluded.password,
                skills = excluded.skills,
                prediction = excluded.prediction,
                avatar = excluded.avatar,
                updated_at = excluded.updated_at
        """, (
            candidate_id,
            (data.get('fullName') or 'Student').strip(),
            email,
            (data.get('mobile') or '').strip(),
            (data.get('collegeName') or 'ALTS').strip(),
            data.get('course') or 'B.Tech',
            data.get('branch') or 'Computer Science',
            data.get('gender') or 'Male',
            data.get('semester') or '1st Sem',
            year_of_study,
            y1, y2, y3,
            s1, s2, s3, s4,
            s5, s6, s7, s8,
            m1, m2, mid_avg,
            prev_score,
            float(data.get('attendance') or 80.0),
            float(data.get('studyHours') or 4.0),
            data.get('extracurricular') or 'Medium',
            data.get('password') or 'password123',
            json.dumps(skills),
            json.dumps(prediction),
            avatar,
            created_at,
            now_iso
        ))
        conn.commit()

    return get_student_by_id(candidate_id)


def delete_student(candidate_id):
    if not candidate_id:
        return False
    q = str(candidate_id).strip().lower()
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM students WHERE LOWER(candidate_id) = ? OR LOWER(email) = ?", (q, q))
        conn.commit()
        return cursor.rowcount > 0


def clear_all_students():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM students")
        conn.commit()
        return True


# =====================================================================
# SKILLS SPECIFIC OPERATIONS
# =====================================================================

def get_student_skills(candidate_id):
    student = get_student_by_id(candidate_id)
    if not student:
        return []
    return student.get('skills', [])


def save_student_skill(candidate_id, skill_data):
    student = get_student_by_id(candidate_id)
    if not student:
        return None

    skills = list(student.get('skills') or [])
    skill_id = skill_data.get('id') or f"sk_{int(datetime.now().timestamp() * 1000)}"
    skill_data['id'] = skill_id

    # If already exists, update in-place; else prepend
    idx = next((i for i, s in enumerate(skills) if s.get('id') == skill_id), -1)
    if idx >= 0:
        skills[idx] = {**skills[idx], **skill_data}
    else:
        skills.insert(0, skill_data)

    student['skills'] = skills
    save_student(student)
    return skill_data


def delete_student_skill(candidate_id, skill_id):
    student = get_student_by_id(candidate_id)
    if not student:
        return False

    skills = [s for s in (student.get('skills') or []) if s.get('id') != skill_id]
    student['skills'] = skills
    save_student(student)
    return True


# =====================================================================
# ADMIN OPERATIONS
# =====================================================================

def get_all_admins():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, password, full_name, role, created_at FROM admins ORDER BY id ASC")
        rows = cursor.fetchall()
        return [
            {
                'id': r['id'],
                'email': r['email'],
                'password': r['password'],
                'fullName': r['full_name'],
                'role': r['role'],
                'createdAt': r['created_at']
            }
            for r in rows
        ]


def get_admin_by_email(email):
    if not email:
        return None
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM admins WHERE LOWER(email) = ? LIMIT 1", (email.strip().lower(),))
        r = cursor.fetchone()
        if not r:
            return None
        return {
            'id': r['id'],
            'email': r['email'],
            'password': r['password'],
            'fullName': r['full_name'],
            'role': r['role'],
            'createdAt': r['created_at']
        }


def add_admin(admin_data):
    email = (admin_data.get('email') or '').strip().lower()
    password = admin_data.get('password') or 'admin@2005'
    full_name = (admin_data.get('fullName') or 'Administrator').strip()
    role = admin_data.get('role') or 'Administrator'

    if not email:
        raise ValueError("Email is required for admin.")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO admins (email, password, full_name, role, created_at)
            VALUES (?, ?, ?, ?, ?)
        """, (email, password, full_name, role, datetime.now().strftime("%Y-%m-%d %H:%M:%S")))
        conn.commit()

    return get_admin_by_email(email)


# =====================================================================
# NOTIFICATIONS OPERATIONS
# =====================================================================

def get_all_notifications():
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM notifications ORDER BY datetime(created_at) DESC")
        rows = cursor.fetchall()
        result = []
        for r in rows:
            reactions = {}
            if r['reactions']:
                try:
                    reactions = json.loads(r['reactions'])
                except Exception:
                    reactions = {}
            result.append({
                'id': r['id'],
                'title': r['title'],
                'message': r['message'],
                'sender': r['sender'],
                'priority': r['priority'],
                'category': r['category'],
                'targetCandidateId': r['target_candidate_id'],
                'timestamp': r['timestamp'],
                'reactions': reactions,
                'createdAt': r['created_at']
            })
        return result


def add_notification(notif_data):
    notif_id = notif_data.get('id') or f"notif_{int(datetime.now().timestamp() * 1000)}"
    reactions = notif_data.get('reactions') or {}
    if isinstance(reactions, str):
        try:
            reactions = json.loads(reactions)
        except Exception:
            reactions = {}

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO notifications (
                id, title, message, sender, priority, category,
                target_candidate_id, timestamp, reactions, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            notif_id,
            notif_data.get('title') or 'Announcement',
            notif_data.get('message') or '',
            notif_data.get('sender') or 'Faculty Administrator',
            notif_data.get('priority') or 'info',
            notif_data.get('category') or 'Academic Notice',
            notif_data.get('targetCandidateId'),
            notif_data.get('timestamp') or datetime.now().strftime("%Y-%m-%d %I:%M %p"),
            json.dumps(reactions),
            notif_data.get('createdAt') or datetime.now().isoformat()
        ))
        conn.commit()

    return notif_id


def add_notification_reaction(notif_id, candidate_id, student_name, emoji):
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT reactions FROM notifications WHERE id = ?", (notif_id,))
        row = cursor.fetchone()
        if not row:
            return False

        reactions = {}
        if row['reactions']:
            try:
                reactions = json.loads(row['reactions'])
            except Exception:
                reactions = {}

        reactions[candidate_id] = {
            'reaction': emoji,
            'studentName': student_name or 'Student',
            'timestamp': datetime.now().strftime("%Y-%m-%d %I:%M %p")
        }

        cursor.execute("UPDATE notifications SET reactions = ? WHERE id = ?", (json.dumps(reactions), notif_id))
        conn.commit()
        return True


if __name__ == '__main__':
    init_db()
    print("SQLite database initialized successfully at:", DB_FILE)
    print("Total admins in SQLite:", len(get_all_admins()))
    print("Total students in SQLite:", len(get_all_students()))
