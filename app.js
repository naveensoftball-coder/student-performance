/**
 * Student Performance with Prediction - App State, Admin & Notification Management
 */

const ThemeManager = {
  STORAGE_KEY: 'spp_theme_mode',

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || 'light';
    this.apply(saved);
  },

  apply(mode) {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(this.STORAGE_KEY, mode);
    this.updateButtons(mode);
  },

  toggle() {
    const isDark = document.documentElement.classList.contains('dark');
    const newMode = isDark ? 'light' : 'dark';
    this.apply(newMode);
    if (typeof Toast !== 'undefined') {
      Toast.show(`Switched to ${newMode === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
    }
  },

  updateButtons(mode) {
    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
      if (mode === 'dark') {
        btn.innerHTML = `
          <svg class="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <span class="text-xs font-semibold">Light</span>
        `;
      } else {
        btn.innerHTML = `
          <svg class="w-4 h-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span class="text-xs font-semibold">Dark</span>
        `;
      }
    });
  }
};

// ====================================================================
// SQLITE CLIENT & SYNCHRONIZATION BRIDGE (student_performance.db)
// Connects to local Flask backend SQLite API on http://127.0.0.1:5000/api
// Provides real-time read/write to SQLite database file
// ====================================================================
const SqliteClient = {
  BASE_URL: 'http://127.0.0.1:5000/api',
  isOnline: false,
  isChecking: false,

  async checkHealth() {
    if (this.isChecking) return this.isOnline;
    this.isChecking = true;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${this.BASE_URL}/health`, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        this.isOnline = true;
        this.updateUiBadge(true, data.db_file || 'student_performance.db');
        this.isChecking = false;
        return data;
      }
    } catch (e) {
      // Offline fallback
    }
    this.isOnline = false;
    this.isChecking = false;
    this.updateUiBadge(false);
    return null;
  },

  updateUiBadge(online, dbName = 'student_performance.db') {
    const badges = document.querySelectorAll('.sqlite-status-badge');
    badges.forEach(b => {
      if (online) {
        b.className = 'sqlite-status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs';
        b.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span><span>SQLite: Connected (${dbName})</span>`;
        b.title = `Connected to SQLite Database: ${dbName} on http://127.0.0.1:5000`;
      } else {
        b.className = 'sqlite-status-badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-2xs';
        b.innerHTML = `<span class="w-2 h-2 rounded-full bg-slate-400"></span><span>SQLite: Local Cache</span>`;
        b.title = 'Run start_server.bat to activate live SQLite database server';
      }
    });
  },

  async syncFromSqlite() {
    try {
      const health = await this.checkHealth();
      if (!health) return;

      // 1. Sync Students from SQLite
      const res = await fetch(`${this.BASE_URL}/students`);
      if (res.ok) {
        const data = await res.json();
        const remoteStudents = data.students || [];
        if (remoteStudents.length > 0) {
          localStorage.setItem(StudentDB.STORAGE_KEY, JSON.stringify(remoteStudents));
          localStorage.setItem('spp_all_registered_users', JSON.stringify(remoteStudents));
        } else {
          // If SQLite has 0 students but localStorage has students, upload them to SQLite
          const local = StudentDB.getAll();
          if (local.length > 0) {
            await fetch(`${this.BASE_URL}/sync/batch`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ students: local })
            });
          }
        }
      }

      // 2. Sync Admins from SQLite
      const adminRes = await fetch(`${this.BASE_URL}/admins`);
      if (adminRes.ok) {
        const aData = await adminRes.json();
        if (Array.isArray(aData.admins) && aData.admins.length > 0) {
          localStorage.setItem(AdminStore.STORAGE_KEY_ADMIN_LIST, JSON.stringify(aData.admins));
        }
      }

      // 3. Sync Notifications from SQLite
      const notifRes = await fetch(`${this.BASE_URL}/notifications`);
      if (notifRes.ok) {
        const nData = await notifRes.json();
        if (Array.isArray(nData.notifications) && nData.notifications.length > 0) {
          localStorage.setItem(NotificationStore.STORAGE_KEY_NOTIFS, JSON.stringify(nData.notifications));
        }
      }
    } catch (e) {
      console.warn('SQLite sync error (using local cache):', e);
    }
  },

  async saveStudent(studentData) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      if (res.ok) {
        return (await res.json()).student;
      }
    } catch (e) {}
    return null;
  },

  async deleteStudent(candidateId) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return false;
    try {
      const res = await fetch(`${this.BASE_URL}/students/${encodeURIComponent(candidateId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {}
    return false;
  },

  async clearAllStudents() {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return false;
    try {
      const res = await fetch(`${this.BASE_URL}/students/clear-all`, {
        method: 'POST'
      });
      return res.ok;
    } catch (e) {}
    return false;
  },

  async saveSkill(candidateId, skillData) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/students/${encodeURIComponent(candidateId)}/skills`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(skillData)
      });
      if (res.ok) return (await res.json()).skill;
    } catch (e) {}
    return null;
  },

  async deleteSkill(candidateId, skillId) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return false;
    try {
      const res = await fetch(`${this.BASE_URL}/students/${encodeURIComponent(candidateId)}/skills/${encodeURIComponent(skillId)}`, {
        method: 'DELETE'
      });
      return res.ok;
    } catch (e) {}
    return false;
  },

  async addAdmin(adminData) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return null;
    try {
      const res = await fetch(`${this.BASE_URL}/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData)
      });
      if (res.ok) return (await res.json()).admin;
    } catch (e) {}
    return null;
  },

  async saveNotification(notifData) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return false;
    try {
      const res = await fetch(`${this.BASE_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifData)
      });
      return res.ok;
    } catch (e) {}
    return false;
  },

  async reactNotification(notifId, candidateId, studentName, emoji) {
    if (!this.isOnline) await this.checkHealth();
    if (!this.isOnline) return false;
    try {
      const res = await fetch(`${this.BASE_URL}/notifications/${encodeURIComponent(notifId)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, studentName, reaction: emoji })
      });
      return res.ok;
    } catch (e) {}
    return false;
  }
};

// ====================================================================
// ADMIN AUTHENTICATION & MULTI-ADMIN CREDENTIALS MANAGEMENT
// ====================================================================
const AdminStore = {
  STORAGE_KEY_ADMIN_SESSION: 'spp_admin_session',
  STORAGE_KEY_ADMIN_LIST: 'spp_admin_accounts_list_v2',

  defaultAdmin: {
    id: 'admin-primary',
    name: 'Administrator',
    email: 'anil9963@gmail.com',
    password: 'admin@2005',
    role: 'Chief Academic Administrator',
    college: 'ALTS',
    avatar: 'AD'
  },

  init() {
    let list = this.getAllAdmins();
    // Remove obsolete default admin admin@gmail.com if present
    list = (list || []).filter(a => a.email && a.email.toLowerCase() !== 'admin@gmail.com');
    const hasDefault = list.some(a => a.email.toLowerCase() === 'anil9963@gmail.com');
    if (!hasDefault) {
      list.unshift(this.defaultAdmin);
    } else {
      // Ensure password is up to date
      list = list.map(a => a.email.toLowerCase() === 'anil9963@gmail.com' ? { ...a, password: 'admin@2005' } : a);
    }
    localStorage.setItem(this.STORAGE_KEY_ADMIN_LIST, JSON.stringify(list));
  },

  getAllAdmins() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_ADMIN_LIST);
      if (data) {
        return JSON.parse(data);
      }
      return [this.defaultAdmin];
    } catch (e) {
      return [this.defaultAdmin];
    }
  },

  addAdmin(adminData) {
    this.init();
    const list = this.getAllAdmins();
    const email = (adminData.email || '').trim().toLowerCase();

    if (!email) {
      return { success: false, message: 'Admin email is required.' };
    }
    if (!adminData.password) {
      return { success: false, message: 'Admin password is required.' };
    }

    const exists = list.some(a => a.email.toLowerCase() === email);
    if (exists) {
      return { success: false, message: `An administrator with email "${email}" already exists.` };
    }

    const name = (adminData.name || 'Administrator').trim();
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'AD';

    const newAdmin = {
      id: 'admin-' + Date.now(),
      name,
      email,
      password: adminData.password,
      role: (adminData.role || 'Academic Administrator').trim(),
      college: (adminData.college || 'ALTS').trim(),
      avatar: initials,
      createdAt: new Date().toISOString()
    };

    list.push(newAdmin);
    localStorage.setItem(this.STORAGE_KEY_ADMIN_LIST, JSON.stringify(list));
    SqliteClient.addAdmin(newAdmin);
    return { success: true, admin: newAdmin };
  },

  deleteAdmin(adminId) {
    let list = this.getAllAdmins();
    const target = list.find(a => a.id === adminId || a.email.toLowerCase() === adminId.toLowerCase());
    
    if (!target) {
      return { success: false, message: 'Admin not found.' };
    }
    if (target.email.toLowerCase() === 'anil9963@gmail.com') {
      return { success: false, message: 'Cannot delete the primary default administrator account.' };
    }

    list = list.filter(a => a.id !== adminId && a.email.toLowerCase() !== adminId.toLowerCase());
    localStorage.setItem(this.STORAGE_KEY_ADMIN_LIST, JSON.stringify(list));
    return { success: true };
  },

  login(email, password) {
    this.init();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    // Direct check for default credentials
    if (cleanEmail === 'anil9963@gmail.com' && cleanPassword === 'admin@2005') {
      const session = { ...this.defaultAdmin, loggedInAt: new Date().toISOString() };
      localStorage.setItem(this.STORAGE_KEY_ADMIN_SESSION, JSON.stringify(session));
      return { success: true, admin: session };
    }

    // Check all registered administrators
    const list = this.getAllAdmins();
    const found = list.find(a => a.email.toLowerCase() === cleanEmail && a.password === cleanPassword);

    if (found) {
      const session = { ...found, loggedInAt: new Date().toISOString() };
      localStorage.setItem(this.STORAGE_KEY_ADMIN_SESSION, JSON.stringify(session));
      return { success: true, admin: session };
    }

    return { 
      success: false, 
      message: 'Invalid Administrator credentials.' 
    };
  },

  getCurrentAdmin() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_ADMIN_SESSION);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getCurrentAdmin();
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY_ADMIN_SESSION);
    window.location.href = 'login.html';
  }
};

// ====================================================================
// NOTIFICATIONS & STUDENT REACTION SYSTEM
// ====================================================================
const NotificationStore = {
  STORAGE_KEY_NOTIFS: 'spp_notifications_v3',

  defaultNotifications: [
    {
      id: 'notif-101',
      title: 'Mid-Semester Attendance & Performance Notice',
      message: 'Attention all students: Please review your predicted performance and 30-Day Recovery Roadmap on your student dashboard. Remedial support sessions are available for at-risk subjects.',
      category: 'Academic Alert',
      priority: 'high',
      targetStudentId: 'all',
      sender: 'Dr. Mukherjee (Dean Academics)',
      timestamp: 'Today, 10:30 AM',
      reactions: {}
    },
    {
      id: 'notif-102',
      title: 'AI Lab & Machine Learning Mentoring Workshop',
      message: 'Hands-on project mentoring session on Neural Networks & Predictor Calibration will be held on Friday at 3:30 PM in Seminar Hall B. All enrolled branches are welcome.',
      category: 'Workshop',
      priority: 'medium',
      targetStudentId: 'all',
      sender: 'Academic Cell Administrator',
      timestamp: 'Yesterday, 02:15 PM',
      reactions: {}
    },
    {
      id: 'notif-103',
      title: '1-on-1 Academic Counseling Schedule',
      message: 'Personal counseling sessions have opened for students seeking guidance to boost their semester GPA. Check the roadmap tab for guidance.',
      category: 'Counseling',
      priority: 'info',
      targetStudentId: 'all',
      sender: 'Student Guidance Cell',
      timestamp: '2 days ago',
      reactions: {}
    }
  ],

  init() {
    if (!localStorage.getItem(this.STORAGE_KEY_NOTIFS)) {
      localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(this.defaultNotifications));
    }
  },

  getAll() {
    this.init();
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_NOTIFS);
      return data ? JSON.parse(data) : this.defaultNotifications;
    } catch (e) {
      return this.defaultNotifications;
    }
  },

  getForStudent(candidateId) {
    const all = this.getAll();
    return all.filter(n => n.targetStudentId === 'all' || n.targetStudentId === candidateId);
  },

  send(notificationData) {
    const list = this.getAll();
    const newNotif = {
      id: 'notif-' + Date.now(),
      title: notificationData.title || 'Academic Notification',
      message: notificationData.message || '',
      category: notificationData.category || 'General',
      priority: notificationData.priority || 'medium',
      targetStudentId: notificationData.targetStudentId || 'all',
      sender: notificationData.sender || 'Administrator',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today',
      reactions: {}
    };
    list.unshift(newNotif);
    localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(list));
    SqliteClient.saveNotification(newNotif);
    return newNotif;
  },

  react(notificationId, studentId, studentName, reactionEmoji) {
    const list = this.getAll();
    const notif = list.find(n => n.id === notificationId);
    if (!notif) return null;

    if (!notif.reactions) notif.reactions = {};

    // Toggle or update reaction
    if (notif.reactions[studentId] && notif.reactions[studentId].reaction === reactionEmoji) {
      delete notif.reactions[studentId]; // remove if clicked again
    } else {
      notif.reactions[studentId] = {
        reaction: reactionEmoji,
        name: studentName,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
    }

    localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(list));
    SqliteClient.reactNotification(notificationId, studentId, studentName, reactionEmoji);
    return notif;
  },

  delete(notificationId) {
    let list = this.getAll();
    list = list.filter(n => n.id !== notificationId);
    localStorage.setItem(this.STORAGE_KEY_NOTIFS, JSON.stringify(list));
    return list;
  }
};

// ====================================================================
// STUDENT DATABASE MANAGEMENT SYSTEM (Persistent Storage)
// Pure database store - starts completely clean without mock students!
// When students register or are added, they are stored and reflected here.
// ====================================================================
const StudentDB = {
  STORAGE_KEY: 'spp_student_database_records',
  MIGRATION_PURGE_KEY: 'spp_clean_db_initialized_v4',

  init() {
    // Purge previous mock/seed students to give user the clean database requested
    if (!localStorage.getItem(this.MIGRATION_PURGE_KEY)) {
      localStorage.removeItem('spp_all_registered_users');
      localStorage.removeItem('spp_current_user');
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem(this.MIGRATION_PURGE_KEY, 'true');
    }

    if (!localStorage.getItem(this.STORAGE_KEY)) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
    }

    // Connect to and sync with SQLite database
    SqliteClient.syncFromSqlite();
  },

  getAll() {
    this.init();
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },

  saveAll(list) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    // Keep backward compatibility for any scripts reading spp_all_registered_users
    localStorage.setItem('spp_all_registered_users', JSON.stringify(list));
  },

  add(studentData) {
    const list = this.getAll();
    const candidateId = (studentData.candidateId && studentData.candidateId.toString().trim())
      ? studentData.candidateId.toString().trim().toUpperCase()
      : ('CAND' + Math.floor(1000 + Math.random() * 9000));

    // Handle 1st Year, 2nd Year, 3rd Year scores
    const y1 = studentData.year1Score !== undefined && studentData.year1Score !== '' ? parseFloat(studentData.year1Score) : undefined;
    const y2 = studentData.year2Score !== undefined && studentData.year2Score !== '' ? parseFloat(studentData.year2Score) : undefined;
    const y3 = studentData.year3Score !== undefined && studentData.year3Score !== '' ? parseFloat(studentData.year3Score) : undefined;

    const validYears = [y1, y2, y3].filter(s => s !== undefined && !isNaN(s) && s > 0);
    const computedPrev = validYears.length > 0
      ? parseFloat((validYears.reduce((a, b) => a + b, 0) / validYears.length).toFixed(1))
      : (parseFloat(studentData.previousScore) || 75);

    const mergedData = {
      ...studentData,
      previousScore: computedPrev
    };

    // Calculate ML Prediction
    const prediction = (typeof MLPredictor !== 'undefined' && MLPredictor.predict)
      ? MLPredictor.predict(mergedData)
      : {
          predictedPercentage: computedPrev,
          classification: computedPrev >= 80 ? 'Good' : (computedPrev >= 60 ? 'Average' : 'At-Risk'),
          confidence: 88,
          status: computedPrev < 60 ? 'At-Risk' : 'Safe'
        };

    const record = {
      candidateId,
      fullName: (studentData.fullName || 'Student').trim(),
      email: (studentData.email || '').trim().toLowerCase(),
      mobile: (studentData.mobile || '').trim(),
      collegeName: (studentData.collegeName || 'ALTS').trim(),
      course: studentData.course || 'B.Tech',
      branch: studentData.branch || 'Computer Science',
      gender: studentData.gender || 'Male',
      semester: studentData.semester || '1st Sem',
      yearOfStudy: studentData.yearOfStudy || '1st Year',
      year1Score: y1 !== undefined ? y1 : (studentData.year1Score || undefined),
      year2Score: y2 !== undefined ? y2 : (studentData.year2Score || undefined),
      year3Score: y3 !== undefined ? y3 : (studentData.year3Score || undefined),
      sem1Score: studentData.sem1Score !== undefined && studentData.sem1Score !== '' ? parseFloat(studentData.sem1Score) : undefined,
      sem2Score: studentData.sem2Score !== undefined && studentData.sem2Score !== '' ? parseFloat(studentData.sem2Score) : undefined,
      sem3Score: studentData.sem3Score !== undefined && studentData.sem3Score !== '' ? parseFloat(studentData.sem3Score) : undefined,
      sem4Score: studentData.sem4Score !== undefined && studentData.sem4Score !== '' ? parseFloat(studentData.sem4Score) : undefined,
      sem5Score: studentData.sem5Score !== undefined && studentData.sem5Score !== '' ? parseFloat(studentData.sem5Score) : undefined,
      sem6Score: studentData.sem6Score !== undefined && studentData.sem6Score !== '' ? parseFloat(studentData.sem6Score) : undefined,
      sem7Score: studentData.sem7Score !== undefined && studentData.sem7Score !== '' ? parseFloat(studentData.sem7Score) : undefined,
      sem8Score: studentData.sem8Score !== undefined && studentData.sem8Score !== '' ? parseFloat(studentData.sem8Score) : undefined,
      mid1Score: studentData.mid1Score !== undefined && studentData.mid1Score !== '' ? parseFloat(studentData.mid1Score) : undefined,
      mid2Score: studentData.mid2Score !== undefined && studentData.mid2Score !== '' ? parseFloat(studentData.mid2Score) : undefined,
      midScore: studentData.midScore !== undefined && studentData.midScore !== '' ? parseFloat(studentData.midScore) : undefined,
      previousScore: computedPrev,
      attendance: parseFloat(studentData.attendance) || 80,
      studyHours: parseFloat(studentData.studyHours) || 4,
      extracurricular: studentData.extracurricular || 'Medium',
      password: studentData.password || 'password123',
      skills: Array.isArray(studentData.skills) ? studentData.skills : (studentData.skills || []),
      createdAt: studentData.createdAt || new Date().toISOString(),
      prediction,
      avatar: studentData.avatar || (existingIndex >= 0 && list[existingIndex].avatar ? list[existingIndex].avatar : 'images/avatars/avatar-1.svg')
    };

    // If candidateId or email matches existing student, update it; otherwise insert new record
    const existingIndex = list.findIndex(s => 
      (s.candidateId && s.candidateId.toUpperCase() === record.candidateId) ||
      (s.email && record.email && s.email.toLowerCase() === record.email)
    );

    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...record };
    } else {
      list.push(record);
    }

    this.saveAll(list);
    SqliteClient.saveStudent(record);
    return record;
  },

  getById(candidateId) {
    if (!candidateId) return null;
    const list = this.getAll();
    const q = candidateId.toString().trim().toLowerCase();
    return list.find(s => 
      (s.candidateId && s.candidateId.toLowerCase() === q) || 
      (s.email && s.email.toLowerCase() === q)
    ) || null;
  },

  delete(candidateId) {
    let list = this.getAll();
    const q = (candidateId || '').toString().trim().toLowerCase();
    list = list.filter(s => 
      s.candidateId.toLowerCase() !== q && 
      (!s.email || s.email.toLowerCase() !== q)
    );
    this.saveAll(list);
    SqliteClient.deleteStudent(candidateId);
    return list;
  },

  clear() {
    this.saveAll([]);
    SqliteClient.clearAllStudents();
    return [];
  }
};

// ====================================================================
// STUDENT APP STORE & AUTHENTICATION WRAPPER
// ====================================================================
const AppStore = {
  STORAGE_KEY_USER: 'spp_current_user',

  AVAILABLE_AVATARS: [
    { id: 'av1', path: 'images/avatars/avatar-1.svg', name: 'Alex (Tech & Music)' },
    { id: 'av2', path: 'images/avatars/avatar-2.svg', name: 'Sarah (Creative & Specs)' },
    { id: 'av3', path: 'images/avatars/avatar-3.svg', name: 'Leo (Coder & Spikes)' },
    { id: 'av4', path: 'images/avatars/avatar-4.svg', name: 'Priya (Design & Bob)' },
    { id: 'av5', path: 'images/avatars/avatar-5.svg', name: 'David (Scholar & Grad Cap)' },
    { id: 'av6', path: 'images/avatars/avatar-6.svg', name: 'Emma (Headband & Energy)' },
    { id: 'av7', path: 'images/avatars/avatar-7.svg', name: 'Kevin (Streetwear & Cap)' },
    { id: 'av8', path: 'images/avatars/avatar-8.svg', name: 'Ananya (Studious & Bun)' }
  ],

  init() {
    ThemeManager.init();
    NotificationStore.init();
    StudentDB.init();
    AdminStore.init();
  },

  getCurrentUser() {
    this.init();
    try {
      const data = localStorage.getItem(this.STORAGE_KEY_USER);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  },

  saveUser(userData) {
    const fullUser = StudentDB.add(userData);
    localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(fullUser));
    return fullUser;
  },

  // Called on registration: saves to database, but does NOT auto-login as active user!
  registerUser(userData) {
    const fullUser = StudentDB.add(userData);
    // Clear active session so they must log in manually every time
    localStorage.removeItem(this.STORAGE_KEY_USER);
    return fullUser;
  },

  deleteStudent(candidateId) {
    return StudentDB.delete(candidateId);
  },

  getStudentById(candidateId) {
    return StudentDB.getById(candidateId);
  },

  getAllUsers() {
    return StudentDB.getAll();
  },

  clearAllStudents() {
    localStorage.removeItem(this.STORAGE_KEY_USER);
    return StudentDB.clear();
  },

  updateAcademicDetails(academicData) {
    const user = this.getCurrentUser();
    if (!user) return null;

    const y1 = academicData.year1Score !== undefined ? parseFloat(academicData.year1Score) : user.year1Score;
    const y2 = academicData.year2Score !== undefined ? parseFloat(academicData.year2Score) : user.year2Score;
    const y3 = academicData.year3Score !== undefined ? parseFloat(academicData.year3Score) : user.year3Score;
    const y4 = academicData.year4Score !== undefined ? parseFloat(academicData.year4Score) : user.year4Score;

    const passedPrev = academicData.previousPercentage !== undefined && academicData.previousPercentage !== ''
      ? parseFloat(academicData.previousPercentage)
      : (academicData.previousScore !== undefined && academicData.previousScore !== '' ? parseFloat(academicData.previousScore) : null);

    const validYears = [y1, y2, y3, y4].filter(s => s !== undefined && !isNaN(s) && s > 0);
    const avgScore = passedPrev !== null && !isNaN(passedPrev)
      ? passedPrev
      : (validYears.length > 0 
          ? parseFloat((validYears.reduce((a, b) => a + b, 0) / validYears.length).toFixed(1))
          : (user.previousScore || 75));

    const m1 = academicData.mid1Score !== undefined && academicData.mid1Score !== '' ? parseFloat(academicData.mid1Score) : user.mid1Score;
    const m2 = academicData.mid2Score !== undefined && academicData.mid2Score !== '' ? parseFloat(academicData.mid2Score) : user.mid2Score;
    const validMids = [m1, m2].filter(s => s !== undefined && !isNaN(s) && s >= 0);
    const midAvg = validMids.length > 0
      ? parseFloat((validMids.reduce((a, b) => a + b, 0) / validMids.length).toFixed(1))
      : (parseFloat(academicData.midScore) || user.midScore || 83.5);

    const updated = {
      ...user,
      yearOfStudy: academicData.yearOfStudy || user.yearOfStudy,
      semester: academicData.semester || user.semester,
      year1Score: y1,
      year2Score: y2,
      year3Score: y3,
      year4Score: y4,
      sem1Score: academicData.sem1Score !== undefined ? parseFloat(academicData.sem1Score) : user.sem1Score,
      sem2Score: academicData.sem2Score !== undefined ? parseFloat(academicData.sem2Score) : user.sem2Score,
      sem3Score: academicData.sem3Score !== undefined ? parseFloat(academicData.sem3Score) : user.sem3Score,
      sem4Score: academicData.sem4Score !== undefined ? parseFloat(academicData.sem4Score) : user.sem4Score,
      sem5Score: academicData.sem5Score !== undefined ? parseFloat(academicData.sem5Score) : user.sem5Score,
      sem6Score: academicData.sem6Score !== undefined ? parseFloat(academicData.sem6Score) : user.sem6Score,
      sem7Score: academicData.sem7Score !== undefined ? parseFloat(academicData.sem7Score) : user.sem7Score,
      sem8Score: academicData.sem8Score !== undefined ? parseFloat(academicData.sem8Score) : user.sem8Score,
      mid1Score: m1,
      mid2Score: m2,
      midScore: midAvg,
      previousScore: avgScore,
      attendance: parseFloat(academicData.attendance) || user.attendance,
      studyHours: parseFloat(academicData.studyHours) || user.studyHours,
      extracurricular: academicData.extracurricular || user.extracurricular
    };
    return this.saveUser(updated);
  },

  getDefaultSkills() {
    return [
      {
        id: 'sk_code_1',
        name: 'Python Programming',
        category: 'Coding',
        proficiency: 85,
        level: 'Advanced',
        tags: ['FastAPI', 'Pandas', 'NumPy', 'Automation'],
        experience: '2+ Years',
        notes: 'Proficient in algorithms, backend development, and data manipulation.'
      },
      {
        id: 'sk_code_2',
        name: 'JavaScript & Web Development',
        category: 'Coding',
        proficiency: 88,
        level: 'Advanced',
        tags: ['React', 'Node.js', 'Tailwind CSS', 'ES6+'],
        experience: '2+ Years',
        notes: 'Full-stack development, modern SPAs, and responsive UI design.'
      },
      {
        id: 'sk_code_3',
        name: 'Java & Data Structures',
        category: 'Coding',
        proficiency: 78,
        level: 'Intermediate',
        tags: ['OOP', 'Collections', 'Spring Boot', 'Algorithms'],
        experience: '1.5 Years',
        notes: 'Strong understanding of OOP concepts and core data structure implementations.'
      },
      {
        id: 'sk_des_1',
        name: 'UI/UX Design & Prototyping',
        category: 'Designing',
        proficiency: 84,
        level: 'Advanced',
        tags: ['Figma', 'Wireframing', 'Design Systems', 'User Research'],
        experience: '2 Years',
        notes: 'Skilled in high-fidelity mockups, responsive components, and user journeys.'
      },
      {
        id: 'sk_des_2',
        name: 'Graphic Design & Digital Media',
        category: 'Designing',
        proficiency: 75,
        level: 'Intermediate',
        tags: ['Adobe Photoshop', 'Illustrator', 'Branding', 'Typography'],
        experience: '1+ Year',
        notes: 'Creating vector artwork, promotional posters, and social graphics.'
      },
      {
        id: 'sk_code_4',
        name: 'SQL & Database Management',
        category: 'Coding',
        proficiency: 80,
        level: 'Advanced',
        tags: ['PostgreSQL', 'MySQL', 'Query Optimization', 'Schema Design'],
        experience: '2 Years',
        notes: 'Relational database schema modeling, complex joins, and indexing.'
      }
    ];
  },

  getStudentSkills() {
    const user = this.getCurrentUser();
    if (!user) return [];
    if (!Array.isArray(user.skills) || user.skills.length === 0) {
      const defaults = this.getDefaultSkills();
      user.skills = defaults;
      this.saveUser(user);
      return defaults;
    }
    return user.skills;
  },

  addSkill(skillData) {
    const user = this.getCurrentUser();
    if (!user) return null;
    if (!Array.isArray(user.skills)) {
      user.skills = [];
    }
    const proficiency = Math.min(100, Math.max(0, parseInt(skillData.proficiency, 10) || 50));
    const newSkill = {
      id: skillData.id || `sk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: (skillData.name || '').trim(),
      category: skillData.category || 'Coding',
      proficiency,
      level: skillData.level || (proficiency >= 90 ? 'Expert' : proficiency >= 70 ? 'Advanced' : proficiency >= 40 ? 'Intermediate' : 'Beginner'),
      tags: Array.isArray(skillData.tags) 
        ? skillData.tags 
        : (skillData.tags ? skillData.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      experience: (skillData.experience || '').trim(),
      notes: (skillData.notes || '').trim(),
      createdAt: new Date().toISOString()
    };
    user.skills.unshift(newSkill);
    this.saveUser(user);
    SqliteClient.saveSkill(user.candidateId, newSkill);
    return newSkill;
  },

  updateSkill(skillId, updatedData) {
    const user = this.getCurrentUser();
    if (!user || !Array.isArray(user.skills)) return null;
    const index = user.skills.findIndex(s => s.id === skillId);
    if (index === -1) return null;

    const existing = user.skills[index];
    const proficiency = updatedData.proficiency !== undefined 
      ? Math.min(100, Math.max(0, parseInt(updatedData.proficiency, 10) || existing.proficiency))
      : existing.proficiency;

    user.skills[index] = {
      ...existing,
      name: updatedData.name !== undefined ? updatedData.name.trim() : existing.name,
      category: updatedData.category || existing.category,
      proficiency,
      level: updatedData.level || (proficiency >= 90 ? 'Expert' : proficiency >= 70 ? 'Advanced' : proficiency >= 40 ? 'Intermediate' : 'Beginner'),
      tags: updatedData.tags !== undefined 
        ? (Array.isArray(updatedData.tags) ? updatedData.tags : updatedData.tags.split(',').map(t => t.trim()).filter(Boolean))
        : existing.tags,
      experience: updatedData.experience !== undefined ? updatedData.experience.trim() : existing.experience,
      notes: updatedData.notes !== undefined ? updatedData.notes.trim() : existing.notes,
      updatedAt: new Date().toISOString()
    };
    this.saveUser(user);
    SqliteClient.saveSkill(user.candidateId, user.skills[index]);
    return user.skills[index];
  },

  deleteSkill(skillId) {
    const user = this.getCurrentUser();
    if (!user || !Array.isArray(user.skills)) return false;
    const initialLen = user.skills.length;
    user.skills = user.skills.filter(s => s.id !== skillId);
    if (user.skills.length !== initialLen) {
      this.saveUser(user);
      SqliteClient.deleteSkill(user.candidateId, skillId);
      return true;
    }
    return false;
  },

  login(emailOrCandidateId, password) {
    const list = StudentDB.getAll();
    const q = (emailOrCandidateId || '').trim().toLowerCase();
    const found = list.find(u => 
      (u.email.toLowerCase() === q || u.candidateId.toLowerCase() === q) && 
      (!u.password || u.password === password)
    );
    if (found) {
      localStorage.setItem(this.STORAGE_KEY_USER, JSON.stringify(found));
      return { success: true, user: found };
    }
    return { 
      success: false, 
      message: list.length === 0 
        ? 'No students registered in database yet. Please register your account first.' 
        : 'Invalid credentials. Please verify your email / Candidate ID and password.' 
    };
  },

  logout() {
    localStorage.removeItem(this.STORAGE_KEY_USER);
    window.location.href = 'login.html';
  }
};

// Initialize
AppStore.init();

// Toast helper
const Toast = {
  show(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bgStyles = {
      success: 'bg-emerald-600 text-white',
      error: 'bg-rose-600 text-white',
      info: 'bg-blue-600 text-white',
      warning: 'bg-amber-600 text-white'
    };

    toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl transition-all duration-300 transform translate-y-3 opacity-0 text-sm font-medium ${bgStyles[type] || bgStyles.info}`;
    toast.textContent = message;

    container.appendChild(toast);
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-3', 'opacity-0');
    });

    setTimeout(() => {
      toast.classList.add('translate-y-3', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Auto-check SQLite backend health on page load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    SqliteClient.checkHealth();
  });
}
