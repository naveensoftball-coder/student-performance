"""
Flask Backend API & Static Web Server with SQLite Database
File: server.py
Database: student_performance.db
"""

import os
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import database as db

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR)

# Initialize SQLite database on startup
db.init_db()


# ---------------------------------------------------------------------
# Universal CORS Headers Middleware
# ---------------------------------------------------------------------
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    return response


@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def handle_preflight(path=''):
    return ('', 204)


# ---------------------------------------------------------------------
# Static Web App Routes
# ---------------------------------------------------------------------
@app.route('/')
def serve_index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.route('/<page_name>.html')
def serve_html_page(page_name):
    file_name = f"{page_name}.html"
    if os.path.exists(os.path.join(BASE_DIR, file_name)):
        return send_from_directory(BASE_DIR, file_name)
    return jsonify({'error': 'Page not found'}), 404


@app.route('/js/<path:filename>')
def serve_js(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'js'), filename)


@app.route('/css/<path:filename>')
def serve_css(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'css'), filename)


@app.route('/images/<path:filename>')
def serve_images(filename):
    return send_from_directory(os.path.join(BASE_DIR, 'images'), filename)


# ---------------------------------------------------------------------
# REST API: System & Health
# ---------------------------------------------------------------------
@app.route('/api/health', methods=['GET'])
def api_health():
    students = db.get_all_students()
    admins = db.get_all_admins()
    notifs = db.get_all_notifications()
    return jsonify({
        'status': 'online',
        'database': 'SQLite',
        'db_file': 'student_performance.db',
        'counts': {
            'students': len(students),
            'admins': len(admins),
            'notifications': len(notifs)
        }
    })


# ---------------------------------------------------------------------
# REST API: Students CRUD
# ---------------------------------------------------------------------
@app.route('/api/students', methods=['GET'])
def api_get_students():
    students = db.get_all_students()
    return jsonify({'success': True, 'students': students, 'count': len(students)})


@app.route('/api/students/<candidate_id>', methods=['GET'])
def api_get_student(candidate_id):
    student = db.get_student_by_id(candidate_id)
    if not student:
        return jsonify({'success': False, 'message': 'Student not found in SQLite database'}), 404
    return jsonify({'success': True, 'student': student})


@app.route('/api/students', methods=['POST'])
def api_save_student():
    data = request.get_json(force=True, silent=True) or {}
    try:
        saved = db.save_student(data)
        return jsonify({'success': True, 'student': saved, 'message': 'Student saved successfully in SQLite'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@app.route('/api/students/<candidate_id>', methods=['PUT'])
def api_update_student(candidate_id):
    data = request.get_json(force=True, silent=True) or {}
    data['candidateId'] = candidate_id
    try:
        saved = db.save_student(data)
        return jsonify({'success': True, 'student': saved, 'message': 'Student updated successfully in SQLite'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


@app.route('/api/students/<candidate_id>', methods=['DELETE'])
def api_delete_student(candidate_id):
    deleted = db.delete_student(candidate_id)
    if deleted:
        return jsonify({'success': True, 'message': f'Student {candidate_id} deleted from SQLite database'})
    return jsonify({'success': False, 'message': 'Student not found or deletion failed'}), 404


@app.route('/api/students/clear-all', methods=['POST', 'DELETE'])
def api_clear_all_students():
    db.clear_all_students()
    return jsonify({'success': True, 'message': 'All students cleared from SQLite database'})


# ---------------------------------------------------------------------
# REST API: Student Skills
# ---------------------------------------------------------------------
@app.route('/api/students/<candidate_id>/skills', methods=['GET'])
def api_get_skills(candidate_id):
    skills = db.get_student_skills(candidate_id)
    return jsonify({'success': True, 'skills': skills})


@app.route('/api/students/<candidate_id>/skills', methods=['POST'])
def api_save_skill(candidate_id):
    skill_data = request.get_json(force=True, silent=True) or {}
    res = db.save_student_skill(candidate_id, skill_data)
    if not res:
        return jsonify({'success': False, 'message': 'Student not found'}), 404
    return jsonify({'success': True, 'skill': res, 'message': 'Skill saved in SQLite database'})


@app.route('/api/students/<candidate_id>/skills/<skill_id>', methods=['DELETE'])
def api_delete_skill(candidate_id, skill_id):
    deleted = db.delete_student_skill(candidate_id, skill_id)
    if deleted:
        return jsonify({'success': True, 'message': 'Skill removed from SQLite database'})
    return jsonify({'success': False, 'message': 'Skill not found'}), 404


# ---------------------------------------------------------------------
# REST API: Authentication (Student & Admin)
# ---------------------------------------------------------------------
@app.route('/api/auth/login', methods=['POST'])
def api_student_login():
    data = request.get_json(force=True, silent=True) or {}
    identifier = (data.get('email') or data.get('candidateId') or '').strip()
    password = data.get('password') or ''

    student = db.get_student_by_id(identifier)
    if not student:
        all_students = db.get_all_students()
        if len(all_students) == 0:
            return jsonify({
                'success': False,
                'message': 'No students registered in SQLite database yet. Please register your account first.'
            }), 401
        return jsonify({'success': False, 'message': 'Invalid credentials. Candidate ID or Email not found.'}), 401

    if student.get('password') and student['password'] != password:
        return jsonify({'success': False, 'message': 'Invalid password. Please check your credentials.'}), 401

    return jsonify({'success': True, 'user': student, 'message': 'Login successful from SQLite database'})


@app.route('/api/auth/admin-login', methods=['POST'])
def api_admin_login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    admin = db.get_admin_by_email(email)
    if not admin:
        return jsonify({'success': False, 'message': 'Invalid administrator email address.'}), 401

    if admin['password'] != password:
        return jsonify({'success': False, 'message': 'Invalid administrator password.'}), 401

    return jsonify({'success': True, 'admin': admin, 'message': 'Admin login successful from SQLite database'})


# ---------------------------------------------------------------------
# REST API: Admins Management
# ---------------------------------------------------------------------
@app.route('/api/admins', methods=['GET'])
def api_get_admins():
    admins = db.get_all_admins()
    return jsonify({'success': True, 'admins': admins})


@app.route('/api/admins', methods=['POST'])
def api_create_admin():
    data = request.get_json(force=True, silent=True) or {}
    try:
        new_admin = db.add_admin(data)
        return jsonify({'success': True, 'admin': new_admin, 'message': 'New administrator added to SQLite database'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 400


# ---------------------------------------------------------------------
# REST API: Institutional Notifications
# ---------------------------------------------------------------------
@app.route('/api/notifications', methods=['GET'])
def api_get_notifications():
    notifs = db.get_all_notifications()
    return jsonify({'success': True, 'notifications': notifs})


@app.route('/api/notifications', methods=['POST'])
def api_create_notification():
    data = request.get_json(force=True, silent=True) or {}
    notif_id = db.add_notification(data)
    return jsonify({'success': True, 'id': notif_id, 'message': 'Notification recorded in SQLite database'})


@app.route('/api/notifications/<notif_id>/react', methods=['POST'])
def api_react_notification(notif_id):
    data = request.get_json(force=True, silent=True) or {}
    candidate_id = data.get('candidateId')
    student_name = data.get('studentName') or 'Student'
    emoji = data.get('reaction') or '👍'

    ok = db.add_notification_reaction(notif_id, candidate_id, student_name, emoji)
    if ok:
        return jsonify({'success': True, 'message': 'Reaction stored in SQLite database'})
    return jsonify({'success': False, 'message': 'Notification not found'}), 404


# ---------------------------------------------------------------------
# REST API: Roadmap AI Chatbot Endpoint
# ---------------------------------------------------------------------
@app.route('/api/roadmap-chat', methods=['POST'])
def api_roadmap_chat():
    data = request.get_json(force=True, silent=True) or {}
    message = str(data.get('message') or '').strip()
    student = data.get('student') or {}

    name = (student.get('fullName') or 'Student').split(' ')[0]
    branch = student.get('branch') or 'Computer Science'
    year = student.get('yearOfStudy') or '1st Year'
    att = student.get('attendance') or 85.0
    study_hours = student.get('studyHours') or 4.0
    pred = student.get('prediction', {})
    pred_score = pred.get('predictedScore') or 78.0

    q = message.lower()

    if 'step 1' in q or 'analyze' in q or 'position' in q:
        resp = f"""### 🧭 Instructions for Step 1: Analyze Your Current Position (Day 1 – 2)
Hello {name}! Step 1 is essential for identifying where your performance stands in {year}:
1. **Audit Subject Strengths & Weaknesses:** Review previous marks and separate subjects into Strong (≥80%), Moderate (65–79%), and High-Risk (<65%).
2. **Review Attendance Standing:** Your attendance is **{att}%**. Maintain it above 75% to remain eligible for all final university exams.
3. **Productive Study Time Audit:** You currently study **{study_hours} hrs/day**. Identify unproductive time sinks and replace them with focused revision blocks."""

    elif 'step 2' in q or 'goal' in q or 'target' in q:
        target = min(98.5, round(float(pred_score) + 8.5, 1))
        resp = f"""### 🎯 Instructions for Step 2: Set Your Goals (Day 3 – 5)
Setting SMART targets for {branch} ({year}):
1. **Target Score:** Your current predicted score is **{pred_score}%**. Target a jump to **{target}%+**.
2. **Weekly Timetable:** Divide your **{study_hours} daily study hours** into two 2-hour focused blocks (Morning Concepts + Evening Practice).
3. **Unit Milestones:** Aim to complete 1 full unit of syllabus every 5 to 6 days across all subjects."""

    elif 'step 3' in q or 'learn' in q or 'practice' in q or 'resources' in q:
        resp = f"""### 📚 Instructions for Step 3: Learn & Practice (Day 6 – 20)
Core learning sprint instructions:
1. **Active Recall:** Avoid passive reading. Write down formulas, block diagrams, and definitions from memory.
2. **5-Year PYQs:** 80% of university exam questions repeat core concepts. Master all 10-mark and 16-mark recurring questions.
3. **Dedicated Formula Sheet:** Maintain a single notebook with all key derivations, theorems, and algorithms for quick pre-exam review."""

    elif 'step 4' in q or 'mock' in q or 'test' in q:
        resp = f"""### 📝 Instructions for Step 4: Take Mock Tests (Day 21 – 30)
Exam simulation instructions:
1. **Simulate 3-Hour Conditions:** Practice without interruptions or phones to build exam stamina.
2. **Answer Presentation:** Start with questions you know best. Use neat diagrams and clear step-by-step mathematical working.
3. **Post-Test Audit:** Review every lost mark immediately: distinguish conceptual gaps from time-management issues."""

    elif 'step 5' in q or 'track' in q or 'progress' in q:
        resp = f"""### 📈 Instructions for Step 5: Track Your Progress (Ongoing)
1. **Weekly Evaluation:** Track syllabus completion every Sunday evening.
2. **Maintain High Attendance ({att}%):** Regular classroom lectures give early indicators on exam-critical questions.
3. **Sleep & Consistency:** Get 7+ hours of sleep during exam weeks to keep memory consolidation active."""

    elif 'week 1' in q or 'basics' in q or 'foundation' in q:
        resp = f"""### 📅 30-Day Plan &bull; Week 1: Build Basics
- **Days 1–2:** Collect complete syllabus and previous 5 years question papers.
- **Days 3–5:** Read fundamental concepts and definitions for Unit 1 in all core subjects.
- **Days 6–7:** Solve basic textbook numericals and write Unit 1 summary sheets."""

    elif 'week 2' in q or 'improve' in q or 'reinforce' in q:
        resp = f"""### 📅 30-Day Plan &bull; Week 2: Practice & Improve
- **Days 8–10:** Complete Units 2 & 3. Allocate 60% of study time to your toughest subject.
- **Days 11–12:** Solve university 10-mark recurring questions.
- **Days 13–14:** Practical / Lab code and viva revision."""

    elif 'week 3' in q or 'test' in q or 'assess' in q:
        resp = f"""### 📅 30-Day Plan &bull; Week 3: Test & Analyze
- **Days 15–17:** Finish remaining syllabus units (Units 4 & 5).
- **Day 18:** First full 3-hour mock exam.
- **Days 19–21:** Close conceptual gaps identified in the mock exam and take a second timed test."""

    elif 'week 4' in q or 'final' in q or 'mastery' in q:
        resp = f"""### 📅 30-Day Plan &bull; Week 4: Final Preparation
- **Days 22–26:** Rapid formula, circuit, and algorithm diagram review using only summary notes.
- **Days 27–29:** Time-management drills and light revision.
- **Day 30:** Rest, sleep early, and walk into the examination hall prepared and confident!"""

    else:
        resp = f"""### 🤖 AI Roadmap Instructions for {name}
- **Current Standing:** {year} &bull; {branch} &bull; Predicted Score: **{pred_score}%**
- **Attendance:** **{att}%** &bull; Daily Study: **{study_hours} hrs/day**
- **Action Plan:** Follow the 5-step roadmap (Analyze, Goal, Learn, Mock, Track) combined with our 30-Day Study Plan for consistent score improvements!
Ask me about any specific step, weekly timetable, or subject strategy!"""

    return jsonify({
        'success': True,
        'response': resp,
        'timestamp': datetime.now().isoformat()
    })


# ---------------------------------------------------------------------
# REST API: Batch Sync from localStorage to SQLite
# ---------------------------------------------------------------------
@app.route('/api/sync/batch', methods=['POST'])
def api_batch_sync():
    data = request.get_json(force=True, silent=True) or {}
    students = data.get('students') or []
    synced = []
    for s in students:
        try:
            res = db.save_student(s)
            synced.append(res['candidateId'])
        except Exception:
            pass
    return jsonify({'success': True, 'syncedCount': len(synced), 'candidateIds': synced})


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"===============================================================")
    print(f"🚀 Student Performance SQLite Server Started")
    print(f"📍 Database File: {db.DB_FILE}")
    print(f"🌐 Web App URL:   http://127.0.0.1:{port}")
    print(f"📡 REST API:      http://127.0.0.1:{port}/api/health")
    print(f"===============================================================")
    app.run(host='0.0.0.0', port=port, debug=False)
