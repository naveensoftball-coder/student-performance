# 🎓 Student Performance with Prediction

> **Track | Analyze | Predict | Build a Better Future**  
> *Your Effort + Our AI = Better Results*

An academic analytics and student performance prediction web application featuring the design style from the project specification with dark mode support.

---

## 📸 Complete System Screens (8 Views)

### 1. 🌐 Home Page (`index.html`)
* **Top Banner**: *"Track | Analyze | Predict | Build a Better Future"* with the handwritten slogan *"Your Effort + Our AI = Better Results"*.
* **Hero Section**: Student vector illustration in blue hoodie, books, potted plant, sticky note *"Better Learning, Better Tomorrow"*, and **Get Started $\rightarrow$** button.
* **3 Feature Badges**: 📈 **Track Progress**, ⚡ **Predict Performance**, ❤️ **Get Suggestions**.
* **🌓 Dark Mode Toggle Button**: Present in the top header.
* **Technologies & Features**: Complete overview cards (HTML, CSS, JS, Python + Flask, SQLite, Scikit-learn).
* **Abstract**: Fully removed as requested.

### 2. 📝 Candidate Registration (`register.html`)
* **Left Navigation Sidebar**: Cap logo, Home, Register (active), Login, student studying graphic.
* **Header**: Dark Mode Toggle Button.
* **Registration Form**: Candidate ID, Full Name, Email, Mobile Number, College Name (`SV College`), Course (`B.Tech`), Branch (`Computer Science`), Year (`3rd Year`), Password, Confirm Password.
* Submitting creates the account and opens the dashboard immediately.

### 3. 🔐 Login Page (`login.html`)
* **Left Navigation Sidebar**: Cap logo, Home, Register, Login (active), decorative plant.
* **Header**: Dark Mode Toggle Button.
* **Centered Login Card**: Blue graduation cap circle icon, Email, Password with reveal toggle, Login button, Register link.
* **Bottom Quote**: *"Small steps every day lead to big results."* 🌱

### 4. 📊 Student Dashboard (`dashboard.html` - Tab 1)
* **Left Dark Sidebar**: Dashboard, Academic Details, Prediction, Roadmap, Suggestions, Profile, Logout.
* **Top Header**: Breadcrumb, **Dark Mode Toggle Button**, Student Profile (`Rahul Kumar`).
* **Welcome Banner**: *"Welcome, Rahul Kumar! 👋 Here is your academic overview"*
* **3 Stat Cards**: Previous Score (`78%`), Attendance (`85%`), Study Hours (`5 hrs/day`).
* **Academic Details Card**: Course (`B.Tech`), Branch (`Computer Science`), Year (`3rd Year`), College (`SV College`), Candidate ID (`CAND2026`).
* **Quick Actions (4 Action Buttons)**:
  1. *Enter Academic Details*
  2. *Get Prediction*
  3. *View Roadmap*
  4. *View Suggestions*

### 5. ✏️ Enter Academic Details (`dashboard.html` - Tab 2)
* Previous Percentage (`78`), Attendance (`85%`), Study Hours per Day (`5 hrs/day`), Extracurricular Activities.
* Submitting calculates the AI prediction and opens the Prediction Result tab.

### 6. 🏆 Prediction Result (`dashboard.html` - Tab 3)
* **Green Trophy Result Card**: **"Good (Score: 82.6%)"**
* **Performance Analysis Bar Chart**: Previous Score, Attendance, Study Hours, Overall Prediction.
* **Input Summary Card**: Previous Score, Attendance, Study Hours, Branch, Year.
* **Improvement Suggestions (Solid Royal Blue Card)**: 4 actionable checkmarks.

### 7. 📈 Performance Insights (`dashboard.html` - Tab 4)
* **Expected Score Doughnut Gauge**: Large circular meter with **82.6% Expected Score** centered in the doughnut.
* **Component Breakdown Legend**: Previous Score (`78%`), Attendance (`85%`), Study Hours (`80%`), Activities (`70%`).
* **Your Progress Line Chart**: Yearly academic performance trajectory (1st Year $\rightarrow$ 2nd Year $\rightarrow$ 3rd Year $\rightarrow$ Predicted).
* **Actionable Guidance Card**: Lightbulb tip card with recommendations and direct report printing.

### 8. 🗺️ Your Success Roadmap & 30-Day Study Roadmap (`dashboard.html` - Tab 5)
* **Part A: Success Roadmap (5 Steps)**:
  * **Step 1 (Green)**: Analyze Your Current Position (Day 1 – 2)
  * **Step 2 (Blue)**: Set Your Goals (Day 3 – 5)
  * **Step 3 (Cyan)**: Learn & Practice (Day 6 – 20)
  * **Step 4 (Amber)**: Take Mock Tests (Day 21 – 30)
  * **Step 5 (Pink)**: Track Your Progress (Ongoing)
  * Motivational Banner: *"🏆 You can do it! Small changes make big results."*
* **Part B: 30-Day Study Roadmap (4 Weeks)**:
  * **Week 1 (Green 1)**: Build Basics
  * **Week 2 (Amber 2)**: Practice & Improve
  * **Week 3 (Purple 3)**: Test & Analyze
  * **Week 4 (Cyan 4)**: Final Preparation
  * Highlight: *"⭐ Remember: Consistency + Practice = Success"*

### 8. 💡 Help for Failed / Struggling Students (`dashboard.html` - Tab 5)
* **Support Header**: *"You are not alone! Many students face challenges. It's not the end — it's a new beginning. Let's build your comeback together."*
* **Why You May Have Failed?**: 4 diagnostic cards (Low Study Hours, Poor Time Management, Weak in Specific Subjects, Less Practice / No Mock Tests).
* **Your Recovery Plan**: 5-point action plan with a direct button to start the 30-Day Roadmap.
* **Closing Quote**: *"It's not a failure, It's a feedback."* 🌱

---

## 🌓 Dark Mode Features

* Included on **every page** (`index.html`, `register.html`, `login.html`, `dashboard.html`).
* Click the **Dark / Light button** in the top navigation bar to toggle.
* Automatically remembers your choice in `localStorage`.
* Smooth CSS transitions between Light Mode and Dark Mode.

---

## 🗄️ SQLite Database Architecture (`student_performance.db`)

The system stores all student records, academic history, skills portfolio, institutional notifications, and administrator accounts in a dedicated SQLite database:

* **Database File**: `student_performance.db` (auto-created by [`database.py`](file:///c:/Users/Windows%2010/OneDrive/Desktop/student%20performance/database.py))
* **Backend API & Web Server**: [`server.py`](file:///c:/Users/Windows%2010/OneDrive/Desktop/student%20performance/server.py) (Flask REST API on `http://127.0.0.1:5000`)
* **Tables in SQLite**:
  1. `students`: Stores Candidate ID, Full Name, Email, Mobile, College, Course, Branch, Year of Study, 1st Year %, 2nd Year %, 3rd Year %, Attendance, Study Hours, Extracurricular, Password, Skills (JSON), Predictions (JSON), Timestamps.
  2. `admins`: Admin credentials (`anil9963@gmail.com` / `admin@2005`).
  3. `notifications`: Faculty broadcasts and real-time student emoji reactions.
* **Frontend Connector**: [`js/app.js`](file:///c:/Users/Windows%2010/OneDrive/Desktop/student%20performance/js/app.js) with `SqliteClient` providing real-time synchronization and automatic local caching.

---

## 🚀 How to Run the Application

### Option A: Run with SQLite Database Server (Recommended)
1. Double-click [`start_server.bat`](file:///c:/Users/Windows%2010/OneDrive/Desktop/student%20performance/start_server.bat) OR run:
   ```bash
   python server.py
   ```
2. The web application will launch automatically at:
   **`http://127.0.0.1:5000`**
3. Inspect database records anytime using:
   ```bash
   python init_db.py
   ```

### Option B: Standalone Browser Mode
Double-click [`index.html`](file:///c:/Users/Windows%2010/OneDrive/Desktop/student%20performance/index.html) directly to open the site in your browser. (The app will automatically sync with SQLite whenever the server is started).
