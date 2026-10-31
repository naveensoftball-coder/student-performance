"""
Automated Verification Test for SQLite Database & Flask API
File: test_sqlite.py
"""

import os
import json
import sqlite3
import database as db
from server import app

def run_tests():
    print("=" * 60)
    print("RUNNING AUTOMATED SQLITE VERIFICATION TESTS")
    print("=" * 60)

    # 1. Test database file and tables
    db.init_db()
    assert os.path.exists(db.DB_FILE), f"Database file missing: {db.DB_FILE}"
    print(f"[PASS] SQLite database file confirmed: {db.DB_FILE}")

    with db.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [r['name'] for r in cursor.fetchall()]
        print(f"[PASS] SQLite Tables confirmed: {tables}")
        assert 'students' in tables, "Table 'students' not found"
        assert 'admins' in tables, "Table 'admins' not found"
        assert 'notifications' in tables, "Table 'notifications' not found"

    # 2. Test saving student into SQLite
    test_student = {
        'candidateId': 'TEST1001',
        'fullName': 'Aarav Sharma',
        'email': 'aarav.sharma@college.edu',
        'mobile': '9876543210',
        'collegeName': 'SV College of Engineering',
        'course': 'B.Tech',
        'branch': 'Computer Science',
        'yearOfStudy': '3rd Year',
        'year1Score': 82.5,
        'year2Score': 85.0,
        'year3Score': 88.0,
        'previousScore': 85.2,
        'attendance': 92.0,
        'studyHours': 5.5,
        'extracurricular': 'Yes',
        'password': 'password123',
        'skills': [
            {
                'id': 'sk_test_1',
                'name': 'Python & Backend',
                'category': 'Coding',
                'proficiency': 90,
                'level': 'Expert'
            },
            {
                'id': 'sk_test_2',
                'name': 'UI/UX Design in Figma',
                'category': 'Designing',
                'proficiency': 86,
                'level': 'Advanced'
            }
        ]
    }

    saved = db.save_student(test_student)
    assert saved is not None, "Failed to save student in SQLite"
    assert saved['candidateId'] == 'TEST1001'
    assert saved['fullName'] == 'Aarav Sharma'
    assert len(saved['skills']) == 2
    print(f"[PASS] Successfully inserted student into SQLite: {saved['fullName']} ({saved['candidateId']})")

    # 3. Test retrieving student by email and ID
    retrieved_by_id = db.get_student_by_id('TEST1001')
    assert retrieved_by_id is not None
    assert retrieved_by_id['email'] == 'aarav.sharma@college.edu'

    retrieved_by_email = db.get_student_by_id('aarav.sharma@college.edu')
    assert retrieved_by_email is not None
    assert retrieved_by_email['candidateId'] == 'TEST1001'
    print(f"[PASS] Successfully queried student by candidateId and email")

    # 4. Test skill addition and deletion in SQLite
    new_skill = {
        'id': 'sk_test_3',
        'name': '3D Modeling & Blender',
        'category': 'Designing',
        'proficiency': 76,
        'level': 'Intermediate'
    }
    db.save_student_skill('TEST1001', new_skill)
    updated_skills = db.get_student_skills('TEST1001')
    assert len(updated_skills) == 3
    print(f"[PASS] Successfully added new designing skill to student in SQLite (Total skills: {len(updated_skills)})")

    # 5. Test Flask API endpoints using test_client
    client = app.test_client()

    # Health check
    res_health = client.get('/api/health')
    assert res_health.status_code == 200
    health_json = json.loads(res_health.data)
    assert health_json['database'] == 'SQLite'
    print(f"[PASS] API /api/health returned 200 OK: {health_json}")

    # Students list
    res_students = client.get('/api/students')
    assert res_students.status_code == 200
    students_json = json.loads(res_students.data)
    assert students_json['count'] >= 1
    print(f"[PASS] API /api/students returned 200 OK (count: {students_json['count']})")

    # Student Login
    res_login = client.post('/api/auth/login', json={
        'candidateId': 'TEST1001',
        'password': 'password123'
    })
    assert res_login.status_code == 200
    login_json = json.loads(res_login.data)
    assert login_json['success'] is True
    print(f"[PASS] API /api/auth/login authenticated successfully against SQLite")

    # Admin Login
    res_admin_login = client.post('/api/auth/admin-login', json={
        'email': 'anil9963@gmail.com',
        'password': 'admin@2005'
    })
    assert res_admin_login.status_code == 200
    admin_login_json = json.loads(res_admin_login.data)
    assert admin_login_json['success'] is True
    print(f"[PASS] API /api/auth/admin-login authenticated successfully against SQLite")

    # Clean up test student
    db.delete_student('TEST1001')
    assert db.get_student_by_id('TEST1001') is None
    print(f"[PASS] Cleaned up test record from SQLite")

    print("\n" + "=" * 60)
    print("ALL SQLITE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()
