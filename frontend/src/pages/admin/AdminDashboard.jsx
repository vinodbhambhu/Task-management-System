import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin',          label: 'Overview' },
  { to: '/admin/approvals', label: 'Teacher Approvals' },
  { to: '/admin/users',     label: 'Users' },
  { to: '/admin/teachers',  label: 'Teachers' },
  { to: '/admin/classes',   label: 'Classes' },
  { to: '/admin/students',  label: 'Students' },
  { to: '/admin/logs',      label: 'Activity Log' },
];

// ── Overview ──────────────────────────────────────
function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)); }, []);
  if (!stats) return <p className="text-gray-400">Loading…</p>;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Approved teachers', value: stats.teachers },
          { label: 'Students', value: stats.students },
          { label: 'Active tasks', value: stats.activeTasks },
          { label: 'Pending approvals', value: stats.pendingTeachers, warn: stats.pendingTeachers > 0 },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-3xl font-semibold ${s.warn ? 'text-amber-600' : 'text-gray-900'}`}>{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Teacher Approvals ─────────────────────────────
function Approvals() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/pending-teachers').then(r => { setTeachers(r.data); setLoading(false); });
  }, []);

  const handle = async (id, status) => {
    try {
      await api.patch(`/admin/users/${id}/status`, { status });
      setTeachers(prev => prev.filter(t => t._id !== id));
      toast.success(`Teacher ${status}`);
    } catch { toast.error('Action failed'); }
  };

  if (loading) return <p className="text-gray-400">Loading…</p>;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Teacher Approvals</h2>
      {teachers.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">No pending approvals</div>
      ) : (
        <div className="card divide-y divide-gray-50">
          {teachers.map(t => (
            <div key={t._id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-sm">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.email} {t.subject && `· ${t.subject}`}</p>
                  <p className="text-xs text-gray-300">{new Date(t.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handle(t._id, 'approved')} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approve
                </button>
                <button onClick={() => handle(t._id, 'rejected')} className="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Users ─────────────────────────────────────────
function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    api.get('/admin/users', { params: { search, role } }).then(r => setUsers(r.data));
  }, [search, role]);

  const toggle = async (u) => {
    const status = u.status === 'approved' ? 'inactive' : 'approved';
    try {
      await api.patch(`/admin/users/${u._id}/status`, { status });
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, status } : x));
      toast.success(`User ${status}`);
    } catch { toast.error('Failed'); }
  };

  const badgeClass = (s) => ({
    approved: 'badge-approved', pending: 'badge-pending',
    rejected: 'badge-rejected', inactive: 'badge-inactive',
  }[s] || 'badge-inactive');

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Users</h2>
      <div className="flex gap-3 mb-4">
        <input className="input max-w-xs" placeholder="Search by name or email…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input w-36" value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="teacher">Teacher</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>{['Name','Role','Class','Status','Action'].map(h => (
              <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u => (
              <tr key={u._id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 capitalize text-gray-600">{u.role}</td>
                <td className="px-4 py-3 text-gray-500">{u.class?.name || '—'}</td>
                <td className="px-4 py-3"><span className={badgeClass(u.status)}>{u.status}</span></td>
                <td className="px-4 py-3">
                  {u.role !== 'admin' && (
                    <button onClick={() => toggle(u)}
                      className={`text-xs px-2 py-1 rounded ${u.status === 'approved' ? 'text-red-500 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}>
                      {u.status === 'approved' ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && <p className="text-center text-gray-400 py-8">No users found</p>}
      </div>
    </div>
  );
}

// ── Classes ───────────────────────────────────────
function Classes() {
  const [classes, setClasses]   = useState([]);
  const [newClass, setNewClass] = useState({ name: '', subject: '' });

  const load = () => {
    api.get('/admin/classes').then(r => setClasses(r.data));
  };

  useEffect(load, []);

  const addClass = async (e) => {
    e.preventDefault();
    if (!newClass.name.trim()) return;
    try {
      await api.post('/admin/classes', { name: newClass.name, subject: newClass.subject });
      setNewClass({ name: '', subject: '' });
      toast.success('Class created');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Manage Classes</h2>
      <div className="grid md:grid-cols-1 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create class
          </h3>
          <form onSubmit={addClass} className="space-y-3">
            <input className="input" placeholder="e.g. Grade 10" value={newClass.name}
              onChange={e => setNewClass({ ...newClass, name: e.target.value })} required />
            <input className="input" placeholder="e.g. Mathematics (optional)" value={newClass.subject}
              onChange={e => setNewClass({ ...newClass, subject: e.target.value })} />
            <button className="btn-primary w-full flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Class
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {classes.map(c => (
              <div key={c._id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="font-medium text-sm">{c.name}</span>
                  {c.subject && <span className="text-xs text-gray-400 ml-2">({c.subject})</span>}
                </div>
                <span className="text-xs text-gray-400">{c.studentCount} students</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Students ─────────────────────────────────────
function Students() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/users', { params: { role: 'student', status: 'approved' } }),
      ]);
      setClasses(classesRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const assignStudentToClass = async (e) => {
    e.preventDefault();
    if (!selectedClass || !selectedStudent) {
      return toast.error('Select both class and student');
    }
    setLoading(true);
    try {
      await api.patch(`/admin/users/${selectedStudent}/assign-class`, { classId: selectedClass });
      toast.success('Student assigned to class');
      setSelectedStudent('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign student');
    } finally {
      setLoading(false);
    }
  };

  const classStudents = students.filter(s => s.class?._id === selectedClass);

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Manage Students</h2>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card md:col-span-1">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Assign Student to Class
          </h3>
          <form onSubmit={assignStudentToClass} className="space-y-3">
            <select
              className="input"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setSelectedStudent('');
              }}
              required
            >
              <option value="">Select class…</option>
              {classes.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {selectedClass && (
              <select
                className="input"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                required
              >
                <option value="">Select student…</option>
                {students.filter(s => !s.class || s.class._id !== selectedClass).map(s => (
                  <option key={s._id} value={s._id}>{s.name} ({s.email})</option>
                ))}
              </select>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{loading ? 'Assigning…' : 'Assign Student'}</span>
            </button>
          </form>
        </div>

        <div className="card md:col-span-2">
          <h3 className="font-medium mb-4">
            {selectedClass ? `${classes.find(c => c._id === selectedClass)?.name}` : 'Select a class'}
          </h3>
          {selectedClass ? (
            <div className="space-y-2">
              {classStudents && classStudents.length > 0 ? (
                classStudents.map(student => (
                  <div key={student._id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{student.name}</p>
                      <p className="text-xs text-gray-400">{student.email}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-400 py-8">No students in this class yet</p>
              )}
            </div>
          ) : (
            <p className="text-center text-gray-400 py-8">Select a class to view students</p>
          )}
        </div>
      </div>

      <div className="mt-6 card">
        <h3 className="font-medium mb-4">All Classes</h3>
        <div className="space-y-2">
          {classes.length > 0 ? (
            classes.map(c => (
              <div
                key={c._id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedClass(c._id)}
              >
                <p className="font-medium text-sm">{c.name}</p>
                <span className="text-sm font-semibold text-blue-600">{c.studentCount} students</span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">No classes created yet</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Activity Log ──────────────────────────────────
function Logs() {
  const [logs, setLogs] = useState([]);
  useEffect(() => { api.get('/admin/logs').then(r => setLogs(r.data)); }, []);
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Activity Log</h2>
      <div className="card divide-y divide-gray-50">
        {logs.map(l => (
          <div key={l._id} className="flex items-start justify-between py-3 first:pt-0 last:pb-0">
            <div>
              <p className="text-sm font-medium">{l.action}</p>
              {l.details && <p className="text-xs text-gray-400">{l.details}</p>}
              <p className="text-xs text-gray-300">{l.actorName}</p>
            </div>
            <p className="text-xs text-gray-300 shrink-0 ml-4">{new Date(l.createdAt).toLocaleString()}</p>
          </div>
        ))}
        {logs.length === 0 && <p className="text-center text-gray-400 py-8">No activity yet</p>}
      </div>
    </div>
  );
}

// ── Teachers ──────────────────────────────────────
function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [teacherForm, setTeacherForm] = useState({ subject: '', classIds: [] });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.get('/admin/users', { params: { role: 'teacher', status: 'approved' } }),
        api.get('/admin/classes'),
      ]);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    }
  };

  useEffect(() => { load(); }, []);

  const selectTeacher = async (teacher) => {
    setSelectedTeacher(teacher);
    try {
      const { data } = await api.get(`/admin/teachers/${teacher._id}`);
      setTeacherForm({
        subject: data.subject || '',
        classIds: data.classes?.map(c => c._id) || [],
      });
    } catch (err) {
      toast.error('Failed to load teacher details');
    }
  };

  const toggleClass = (classId) => {
    setTeacherForm(prev => ({
      ...prev,
      classIds: prev.classIds.includes(classId)
        ? prev.classIds.filter(id => id !== classId)
        : [...prev.classIds, classId],
    }));
  };

  const saveChanges = async () => {
    if (!selectedTeacher) return;
    setLoading(true);
    try {
      // Save subject
      if (teacherForm.subject) {
        await api.patch(`/admin/teachers/${selectedTeacher._id}/subject`, {
          subject: teacherForm.subject,
        });
      }
      // Save classes
      await api.patch(`/admin/teachers/${selectedTeacher._id}/classes`, {
        classIds: teacherForm.classIds,
      });
      toast.success('Teacher assignments updated');
      load();
      setSelectedTeacher(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Manage Teachers</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {/* Teacher List */}
        <div className="card md:col-span-1">
          <h3 className="font-medium mb-4">Approved Teachers</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {teachers.length > 0 ? (
              teachers.map(t => (
                <button
                  key={t._id}
                  onClick={() => selectTeacher(t)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedTeacher?._id === t._id
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-gray-50 border border-gray-100'
                  }`}
                >
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.email}</p>
                  {t.subject && <p className="text-xs text-blue-600 mt-1">{t.subject}</p>}
                </button>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No approved teachers</p>
            )}
          </div>
        </div>

        {/* Teacher Details & Assignment */}
        <div className="card md:col-span-2">
          {selectedTeacher ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">{selectedTeacher.name}</h3>
                <p className="text-sm text-gray-500">{selectedTeacher.email}</p>
              </div>

              {/* Subject Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject to Teach</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Mathematics, English, Science"
                  value={teacherForm.subject}
                  onChange={(e) => setTeacherForm(prev => ({ ...prev, subject: e.target.value }))}
                />
                <p className="text-xs text-gray-400 mt-1">Specify the subject this teacher will teach</p>
              </div>

              {/* Class Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Assign Classes</label>
                {classes.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {classes.map(c => (
                      <label key={c._id} className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={teacherForm.classIds.includes(c._id)}
                          onChange={() => toggleClass(c._id)}
                          className="w-4 h-4 rounded border-gray-300"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{c.name}</p>
                          {c.subject && <p className="text-xs text-gray-400">{c.subject}</p>}
                          <p className="text-xs text-gray-400">{c.studentCount} students</p>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-8">No classes available</p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  {teacherForm.classIds.length} class(es) selected
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  onClick={saveChanges}
                  disabled={loading}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{loading ? 'Saving…' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={() => setSelectedTeacher(null)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>Select a teacher to manage their assignments</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Admin Dashboard ──────────────────────────
export default function AdminDashboard() {
  return (
    <Layout navItems={navItems} title="Admin">
      <Routes>
        <Route index      element={<Overview />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="users"     element={<Users />} />
        <Route path="teachers"  element={<Teachers />} />
        <Route path="classes"   element={<Classes />} />
        <Route path="students"  element={<Students />} />
        <Route path="logs"      element={<Logs />} />
      </Routes>
    </Layout>
  );
}