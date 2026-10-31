"""
SQLite Database Management & Inspection Utility
Run: python init_db.py
"""

import sys
import database as db

def main():
    print("=" * 60)
    print("  SQLite Database Manager: student_performance.db")
    print("=" * 60)

    db.init_db()
    students = db.get_all_students()
    admins = db.get_all_admins()
    notifs = db.get_all_notifications()

    print(f"\n[OK] Database file: {db.DB_FILE}")
    print(f"[OK] Total Registered Students: {len(students)}")
    print(f"[OK] Total Administrators:     {len(admins)}")
    print(f"[OK] Total Notifications:      {len(notifs)}")

    if admins:
        print("\n--- Administrators in SQLite ---")
        for a in admins:
            print(f"  • {a['email']} (Password: {a['password']}) - {a['role']}")

    if students:
        print("\n--- Students in SQLite ---")
        for s in students:
            print(f"  • [{s['candidateId']}] {s['fullName']} - {s['email']} | Prev: {s['previousScore']}% | Skills: {len(s['skills'])}")
    else:
        print("\n[INFO] No students currently in SQLite database. Register a student via register.html or Admin Portal.")

    print("\n" + "=" * 60)

if __name__ == '__main__':
    main()
