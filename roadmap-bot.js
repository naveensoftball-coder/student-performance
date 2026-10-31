/**
 * Roadmap AI Chatbot & Instruction Engine
 * Provides personalized instructions for the 5-Step Success Roadmap
 * and 30-Day Study Roadmap based on individual student performance metrics.
 */

const RoadmapBot = {
  chatHistory: [],
  isTyping: false,

  init() {
    const chatContainer = document.getElementById('roadmapChatMessages');
    if (!chatContainer) return;

    this.updateStudentHeader();

    // If chat is empty, generate personalized initial welcome message
    if (this.chatHistory.length === 0) {
      this.sendInitialGreeting();
    } else {
      this.renderMessages();
    }
  },

  updateStudentHeader() {
    const user = (typeof AppStore !== 'undefined' && AppStore.getCurrentUser) ? AppStore.getCurrentUser() : null;
    const tag = document.getElementById('roadmapBotStudentTag');
    if (tag && user) {
      const predScore = user.prediction ? user.prediction.predictedScore : 80;
      tag.innerHTML = `
        <span class="font-bold text-slate-800 dark:text-slate-100">${user.fullName || 'Student'}</span> &bull; 
        <span class="text-blue-600 dark:text-cyan-400 font-semibold">${user.yearOfStudy || '1st Year'} (${user.branch || 'CSE'})</span> &bull; 
        <span>Target: <strong>${Math.min(99, Math.round(predScore + 8))}%</strong></span>
      `;
    }
  },

  sendInitialGreeting() {
    const user = (typeof AppStore !== 'undefined' && AppStore.getCurrentUser) ? AppStore.getCurrentUser() : {};
    const name = user.fullName ? user.fullName.split(' ')[0] : 'there';
    const branch = user.branch || 'Engineering';
    const year = user.yearOfStudy || '1st Year';
    const predScore = user.prediction ? user.prediction.predictedScore : 78;
    const att = user.attendance || 85;

    const greeting = `
**Hello ${name}! 👋 I am your AI Roadmap Instructor.**

I am calibrated with your profile:
- 🎓 **Academic Standing:** ${year} &bull; ${branch}
- 📊 **Current Predicted Performance:** **${predScore}%**
- 📅 **Attendance Record:** **${att}%**

I am here to guide you step-by-step through both your **5-Step Success Roadmap** and your **30-Day Study Plan**. 

**How can I help you today?**
- Ask for detailed instructions on **Step 1 through Step 5**
- Get your personalized daily **Week 1 to Week 4 timetable**
- Ask how to increase your score to **90%+**
- Ask for specific subject revision tips for **${branch}**

*Click any quick prompt above or type your question below!*
    `.trim();

    this.chatHistory.push({
      sender: 'bot',
      text: greeting,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    this.renderMessages();
  },

  renderMessages() {
    const container = document.getElementById('roadmapChatMessages');
    if (!container) return;

    container.innerHTML = '';

    this.chatHistory.forEach(msg => {
      const msgDiv = document.createElement('div');
      msgDiv.className = `flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`;

      if (msg.sender === 'bot') {
        msgDiv.innerHTML = `
          <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/>
            </svg>
          </div>
          <div class="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tl-xs p-3.5 sm:p-4 bg-slate-50 dark:bg-slate-700/80 border border-slate-200/90 dark:border-slate-600 text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-2xs leading-relaxed space-y-2">
            ${this.formatMarkdown(msg.text)}
            <div class="text-[10px] text-slate-400 dark:text-slate-400 font-medium text-right pt-1">
              ${msg.timestamp}
            </div>
          </div>
        `;
      } else {
        const user = (typeof AppStore !== 'undefined' && AppStore.getCurrentUser) ? AppStore.getCurrentUser() : {};
        const avatar = user.avatar || 'images/avatars/avatar-1.svg';
        msgDiv.innerHTML = `
          <div class="max-w-[85%] sm:max-w-[80%] rounded-2xl rounded-tr-xs p-3.5 sm:p-4 bg-blue-600 text-white text-xs sm:text-sm shadow-xs leading-relaxed space-y-1">
            <p>${this.escapeHtml(msg.text)}</p>
            <div class="text-[10px] text-blue-200 text-right pt-0.5">
              ${msg.timestamp}
            </div>
          </div>
          <div class="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 p-0.5 shrink-0 overflow-hidden shadow-2xs">
            <img src="${avatar}" alt="User" class="w-full h-full object-cover rounded-lg">
          </div>
        `;
      }

      container.appendChild(msgDiv);
    });

    if (this.isTyping) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'flex gap-3 justify-start';
      typingDiv.innerHTML = `
        <div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
        </div>
        <div class="rounded-2xl rounded-tl-xs px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs text-slate-500 flex items-center gap-1.5 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
          <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
          <span class="ml-1 text-[11px] font-semibold text-slate-500 dark:text-slate-300">AI is generating roadmap instructions...</span>
        </div>
      `;
      container.appendChild(typingDiv);
    }

    container.scrollTop = container.scrollHeight;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  },

  ask(question) {
    const input = document.getElementById('roadmapChatInput');
    if (input) input.value = question;
    this.handleSend();

    // Scroll chat section into comfortable viewing position
    const card = document.getElementById('roadmapChatSection');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },

  handleSend(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('roadmapChatInput');
    if (!input) return;

    const text = input.value.trim();
    if (!text || this.isTyping) return;

    input.value = '';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Add user message
    this.chatHistory.push({
      sender: 'user',
      text: text,
      timestamp
    });

    this.isTyping = true;
    this.renderMessages();

    const user = (typeof AppStore !== 'undefined' && AppStore.getCurrentUser) ? AppStore.getCurrentUser() : {};

    // First attempt backend API call, fallback immediately to intelligent client-side generation
    fetch('/api/roadmap-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, student: user })
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && data.response) {
        this.addBotResponse(data.response);
      } else {
        const fallback = this.generateLocalAIResponse(text, user);
        this.addBotResponse(fallback);
      }
    })
    .catch(() => {
      const fallback = this.generateLocalAIResponse(text, user);
      this.addBotResponse(fallback);
    });
  },

  addBotResponse(text) {
    setTimeout(() => {
      this.isTyping = false;
      this.chatHistory.push({
        sender: 'bot',
        text: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
      this.renderMessages();
    }, 450);
  },

  clearChat() {
    this.chatHistory = [];
    this.sendInitialGreeting();
  },

  // Client-Side AI Response Engine for Roadmap Instruction
  generateLocalAIResponse(query, student) {
    const q = query.toLowerCase();
    const name = student.fullName ? student.fullName.split(' ')[0] : 'Student';
    const branch = student.branch || 'Computer Science';
    const year = student.yearOfStudy || '1st Year';
    const predScore = student.prediction ? student.prediction.predictedScore : 78;
    const att = student.attendance || 85;
    const studyHours = student.studyHours || 4;

    // STEP 1 INTENT
    if (q.includes('step 1') || q.includes('analyze') || q.includes('current position') || q.includes('weak subject')) {
      return `
### 🧭 Detailed Instructions for Step 1: Analyze Your Current Position (Day 1 – 2)

Hi ${name}, Step 1 is the diagnostic foundation of your entire academic semester. Here is your actionable checklist:

1. **Conduct a Subject-Wise Mark Audit:**
   - Look at your previous semester score (${student.previousScore || 75}%). Separate subjects into **High Comfort (≥80%)**, **Moderate (65–79%)**, and **High Risk (<65%)**.
   - Note the credit weightage of each course. A 4-credit theory paper impacts your CGPA twice as much as a 2-credit elective.

2. **Attendance & College Standing Assessment:**
   - Your current attendance is **${att}%**.
   - Ensure you are comfortably above the **75% university eligibility threshold** so no condonation fees or hall ticket delays occur.

3. **Study Habit Log:**
   - Track your real productive study hours for 48 hours. Currently, you log **${studyHours} hrs/day**. Identify if passive scrolling or distractions are consuming time.

💡 **Immediate Action for Today:** List down your 2 toughest subjects in ${branch} on a sheet of paper. We will allocate extra focus to them in Step 2.
      `.trim();
    }

    // STEP 2 INTENT
    if (q.includes('step 2') || q.includes('goal') || q.includes('target') || q.includes('schedule') || q.includes('plan')) {
      return `
### 🎯 Detailed Instructions for Step 2: Set Your Goals (Day 3 – 5)

Targeting a realistic and ambitious score transformation for ${year}:

1. **Establish Specific Target Marks:**
   - Your current ML predicted score is **${predScore}%**. Let's set a goal to push this to **${Math.min(98, Math.round(predScore + 8))}%+**.
   - Target **85%+ in core theory subjects** and **90%+ in laboratory sessions**.

2. **Structure a Weekly Study Schedule:**
   - Since you have **${studyHours} hours of daily study**, distribute it into **two dedicated blocks**:
     - *Block 1 (Morning / Evening - 2 hrs):* Conceptual study of toughest subject.
     - *Block 2 (Night - 2 hrs):* Problem solving, assignments, and coding/circuit practice.

3. **Module Breakdown:**
   - Break each subject's 5 units into weekly milestones. Aim to cover **1 unit every 5 to 6 days**.

💡 **Pro-Tip:** Never study two memorization-heavy subjects back to back. Alternate a theoretical paper with a numerical or coding subject.
      `.trim();
    }

    // STEP 3 INTENT
    if (q.includes('step 3') || q.includes('learn') || q.includes('practice') || q.includes('resources') || q.includes('notes')) {
      return `
### 📚 Detailed Instructions for Step 3: Learn & Practice (Day 6 – 20)

This 15-day block is where 70% of your academic gains will occur:

1. **Active Recall over Passive Reading:**
   - Do not just read lecture slides. Read a concept, close the book, and write down the key formulas or diagrams from memory.

2. **Previous 5 Years Question Papers (PYQs):**
   - Collect university examination papers from the library or department portal.
   - 80% of university exam questions come from recurring core concepts. Highlight all 10-mark and 16-mark recurring questions.

3. **Recommended Study Stack for ${branch}:**
   - **Concepts:** Standard textbooks (Prescribed syllabus authors) + NPTEL video lectures.
   - **Quick Clarifications:** YouTube topic playlists and summarized professor handouts.
   - **Self-Testing:** Chapter-end review questions.

4. **Formula & Diagram Cheat Sheets:**
   - Maintain a dedicated notebook for definitions, theorems, block diagrams, and standard derivations.
      `.trim();
    }

    // STEP 4 INTENT
    if (q.includes('step 4') || q.includes('mock') || q.includes('test') || q.includes('exam simulation')) {
      return `
### 📝 Detailed Instructions for Step 4: Take Mock Tests (Day 21 – 30)

Taking realistic mock tests bridges the gap between knowing the concept and scoring in the exam hall:

1. **Simulate Real University Conditions:**
   - Set a 3-hour timer on Sunday mornings. Sit in a quiet room with zero smartphone interruptions.
   - Write answers on standard lined paper with blue/black pen just like the real answer booklet.

2. **Answer Presentation Architecture:**
   - Start with questions you know best to create a stellar first impression for the evaluator.
   - Draw neat block diagrams with pencils and box your final numerical answers with appropriate units.
   - Write point-wise explanations with bold subheadings rather than lengthy unbroken paragraphs.

3. **The 30-Minute Error Analysis:**
   - Immediately after grading your mock test, categorize every lost mark:
     - *Conceptual Error?* (Re-read topic in textbook)
     - *Formula/Calculation Error?* (Practice 5 more numericals)
     - *Time Crunch?* (Improve speed on Part A questions)
      `.trim();
    }

    // STEP 5 INTENT
    if (q.includes('step 5') || q.includes('track') || q.includes('progress') || q.includes('stay consistent')) {
      return `
### 📈 Detailed Instructions for Step 5: Track Your Progress (Ongoing)

Consistency is the secret multiplier of all academic success:

1. **Weekly Sunday Reflection (15 Minutes):**
   - Review your syllabus completion percentage. Are you on schedule for all units?
   - Input your updated mid-marks into the portal to watch your ML predicted score climb.

2. **Protect Your 85%+ Attendance:**
   - Regular classroom attendance gives you early hints from professors about which topics are important for exams.
   - Keeping attendance at **${att}%** guarantees full internal marks and peace of mind.

3. **Mental Wellness & Exam Rest:**
   - Sleep 7+ hours before examinations. Memory consolidation happens during REM sleep.
   - Stay hydrated and take a brisk 15-minute walk daily to combat study fatigue.
      `.trim();
    }

    // 30-DAY PLAN: WEEK 1
    if (q.includes('week 1') || q.includes('build basics') || q.includes('foundations') || q.includes('day 1 to 7')) {
      return `
### 📅 30-Day Plan &bull; Week 1: Build Basics (Foundations)

Here is your exact day-by-day plan for Week 1:

- **Days 1 & 2:** Download university syllabus copies for all ${year} (${branch}) subjects. Collect last year's papers and identify syllabus weightage.
- **Days 3 & 4:** Cover Unit 1 foundational definitions, classifications, and basic concepts across all core papers.
- **Days 5 & 6:** Solve all basic numericals and standard derivations from Unit 1.
- **Day 7 (Sunday Review):** Self-test with a 1-hour quiz on Unit 1. Identify any lingering confusions.

⏱️ **Target Study Hours:** ${studyHours} hrs/day (${studyHours * 7} hours total for the week).
      `.trim();
    }

    // 30-DAY PLAN: WEEK 2
    if (q.includes('week 2') || q.includes('practice & improve') || q.includes('reinforcement')) {
      return `
### 📅 30-Day Plan &bull; Week 2: Practice & Improve (Reinforcement)

- **Days 8 to 10:** Deep dive into Unit 2 and Unit 3. Allocate **60% of study time to your weakest subject**.
- **Days 11 & 12:** Solve all 5-mark and 10-mark university questions from previous years covering Units 1, 2, and 3.
- **Days 13 & 14:** Lab / practical revision: Run code, verify circuit setups, or write sample lab records so practical internals are locked in.

💡 **Focus Metric:** Increase your daily study commitment by +30 minutes this week to cement your conceptual edge.
      `.trim();
    }

    // 30-DAY PLAN: WEEK 3
    if (q.includes('week 3') || q.includes('test & analyze') || q.includes('assessment')) {
      return `
### 📅 30-Day Plan &bull; Week 3: Test & Analyze (Assessment)

- **Days 15 to 17:** Finish remaining syllabus units (Unit 4 & 5).
- **Day 18:** First full-length 3-hour mock exam covering the complete semester syllabus.
- **Days 19 & 20:** Rigorous error correction. Re-study every topic where you scored zero or partial credit.
- **Day 21:** Second mock exam. Track your score improvement compared to Day 18.
      `.trim();
    }

    // 30-DAY PLAN: WEEK 4
    if (q.includes('week 4') || q.includes('final preparation') || q.includes('mastery') || q.includes('last week')) {
      return `
### 📅 30-Day Plan &bull; Week 4: Final Preparation (Mastery)

- **Days 22 to 25:** Fast-track revision using your formula sheet and summary diagrams only. Avoid starting brand new unfamiliar textbooks.
- **Days 26 & 27:** Review common exam traps, edge cases in numericals, and standard definitions.
- **Days 28 & 29:** Light revision (2–3 hours max). Rehearse your time allocation for the exam (e.g. 45 min for Part A, 2 hrs for Part B, 15 min for review).
- **Day 30:** Rest, sleep early, prepare admit card and stationary. Walk in confident!
      `.trim();
    }

    // DAILY TIMETABLE INTENT
    if (q.includes('timetable') || q.includes('routine') || q.includes('hours') || q.includes('daily schedule')) {
      return `
### ⏰ Recommended Daily Routine for ${name} (${studyHours} Study Hours)

Balancing college attendance (${att}%) with ${studyHours} hours of deep focused revision:

- **06:00 AM – 07:30 AM (1.5 hrs &bull; Prime Focus):**
  - High-difficulty theory or complex numerical subjects when your mind is fresh.
- **08:30 AM – 04:30 PM (College Hours):**
  - Attend all lectures actively to preserve your **${att}% attendance**. Take concise in-class bullet notes.
- **05:30 PM – 07:00 PM (1.5 hrs &bull; Problem Solving):**
  - Lab code, circuit derivations, or assignment questions.
- **08:30 PM – 09:30 PM (1 hr &bull; Revision & PYQ Drill):**
  - Solve 2 university questions from previous exam papers.
- **09:30 PM – 09:45 PM:**
  - Plan next day's 3 priority tasks.

*Total: ${Math.max(4, studyHours)} productive hours every single day!*
      `.trim();
    }

    // PUSH SCORE TO 90%+
    if (q.includes('90') || q.includes('improve score') || q.includes('increase') || q.includes('better prediction')) {
      return `
### 🚀 How to Elevate Your Prediction from ${predScore}% to 90%+

According to our ML academic model, scores above 90% require optimizing these four calibrated levers:

1. **Academic Exam Baseline (35% ML Weight):**
   - Scoring 85%+ in mid-semester exams and previous tests directly raises your baseline.
2. **Attendance Consistency (30% ML Weight):**
   - Your attendance is **${att}%**. Pushing it to **90%+** activates our model's +2.5 bonus score multiplier!
3. **Daily Study Commitment (25% ML Weight):**
   - Increasing from ${studyHours} hrs/day to **5.5 – 6.0 hrs/day** moves you into the optimal mastery bracket.
4. **Extracurricular Balance (10% ML Weight):**
   - Maintain active technical participation (e.g. Hackathons, coding clubs, paper presentations).

Follow our 30-Day study plan and log your updated marks to see your prediction jump into the **Excellent (90%+)** tier!
      `.trim();
    }

    // BRANCH SPECIFIC TIPS
    if (q.includes('computer science') || q.includes('cse') || q.includes('it') || q.includes('coding') || q.includes('branch')) {
      return `
### 💻 Academic & Roadmap Tips for ${branch}

In ${branch}, scoring high in university exams requires a blend of code clarity and conceptual diagramming:

1. **Algorithms & Data Structures:**
   - Always trace your algorithms with a small sample input and dry-run table in exam answers.
2. **Database & Operating Systems:**
   - Draw clean ER diagrams, schema architectures, and process state transition graphs.
3. **Internal vs External Exams:**
   - Score full marks in coding lab sessions by keeping your code cleanly indented with comments.
4. **Portfolio Synergies:**
   - Link your academic subjects with practical mini-projects in your Skills Portfolio.
      `.trim();
    }

    // DEFAULT SMART RESPONSE
    return `
### 🤖 Roadmap Guidance & Instructions

Thank you for your question, ${name}! Here are key guidelines tailored to your request:

- **Focus on the 5-Step Process:**
  1. *Analyze Position* &bull; 2. *Set Goals* &bull; 3. *Learn & Practice* &bull; 4. *Take Mocks* &bull; 5. *Track Progress*.
- **Your Current Metrics:**
  - Prediction: **${predScore}%** &bull; Attendance: **${att}%** &bull; Study Habit: **${studyHours} hrs/day**
- **Actionable Next Step:**
  - Follow our **30-Day Study Roadmap**: Dedicate Week 1 to fundamentals, Week 2 to reinforcement, Week 3 to full mock tests, and Week 4 to rapid formula revision.

Feel free to ask:
- *"Give me instructions for Step 1 / 2 / 3 / 4 / 5"*
- *"Show me the Week 1 daily timetable"*
- *"How to balance attendance and study hours?"*
    `.trim();
  },

  formatMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Headings
    html = html.replace(/^### (.*$)/gim, '<h4 class="font-bold text-sm sm:text-base text-slate-900 dark:text-white pb-1 border-b border-slate-200 dark:border-slate-600 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="font-bold text-base text-blue-600 dark:text-cyan-400 mb-2">$1</h3>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');

    // Italics
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');

    // Bullet points
    html = html.replace(/^\s*-\s+(.*$)/gim, '<div class="flex items-start gap-2 py-0.5"><span class="text-blue-500 font-bold shrink-0">&bull;</span><span>$1</span></div>');

    // Numbered lists
    html = html.replace(/^\s*(\d+)\.\s+(.*$)/gim, '<div class="flex items-start gap-2 py-0.5"><span class="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-cyan-400 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">$1</span><span>$2</span></div>');

    // Line breaks
    html = html.replace(/\n\n/g, '<div class="my-2"></div>');

    return html;
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};
