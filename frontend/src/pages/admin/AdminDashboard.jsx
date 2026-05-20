import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin',          label: 'Overview' },
  { to: '/admin/approvals', label: 'Teacher Approvals' },
  { to: '/admin/users',     label: 'Users' },
  { to: '/admin/classes',   label: 'Classes' },
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
            <tr>{['Name','Role','Section','Status','Action'].map(h => (
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
                <td className="px-4 py-3 text-gray-500">{u.section?.name || '—'}</td>
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
  const [sections, setSections] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState({ name: '', classId: '', teacherId: '' });

  const load = () => {
    api.get('/admin/classes').then(r => setClasses(r.data));
    api.get('/admin/sections').then(r => setSections(r.data));
    api.get('/admin/users', { params: { role: 'teacher', status: 'approved' } }).then(r => setTeachers(r.data));
  };

  useEffect(load, []);

  const addClass = async (e) => {
    e.preventDefault();
    if (!newClass.trim()) return;
    try {
      await api.post('/admin/classes', { name: newClass });
      setNewClass(''); toast.success('Class created'); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const addSection = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/sections', newSection);
      setNewSection({ name: '', classId: '', teacherId: '' });
      toast.success('Section created'); load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Classes & Sections</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create class
          </h3>
          <form onSubmit={addClass} className="flex gap-2">
            <input className="input flex-1" placeholder="e.g. Grade 10" value={newClass}
              onChange={e => setNewClass(e.target.value)} required />
            <button className="btn-primary px-4 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {classes.map(c => (
              <div key={c._id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="font-medium text-sm">{c.name}</span>
                <span className="text-xs text-gray-400">{c.sectionCount} sections · {c.studentCount} students</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create section
          </h3>
          <form onSubmit={addSection} className="space-y-3">
            <select className="input" value={newSection.classId}
              onChange={e => setNewSection({ ...newSection, classId: e.target.value })} required>
              <option value="">Select class…</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            <input className="input" placeholder="Section name, e.g. Section A"
              value={newSection.name} onChange={e => setNewSection({ ...newSection, name: e.target.value })} required />
            <select className="input" value={newSection.teacherId}
              onChange={e => setNewSection({ ...newSection, teacherId: e.target.value })}>
              <option value="">Assign teacher (optional)</option>
              {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
            <button className="btn-primary w-full flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create section</span>
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {sections.map(s => (
              <div key={s._id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm">{s.class?.name} – {s.name}</span>
                <span className="text-xs text-gray-400">{s.teacher?.name || 'No teacher'}</span>
              </div>
            ))}
          </div>
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

// ── Main Admin Dashboard ──────────────────────────
export default function AdminDashboard() {
  return (
    <Layout navItems={navItems} title="Admin">
      <Routes>
        <Route index      element={<Overview />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="users"     element={<Users />} />
        <Route path="classes"   element={<Classes />} />
        <Route path="logs"      element={<Logs />} />
      </Routes>
    </Layout>
  );
}