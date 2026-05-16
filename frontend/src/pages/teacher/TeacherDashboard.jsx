import { useState, useEffect } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/teacher',           label: 'Overview' },
  { to: '/teacher/tasks',     label: 'My Tasks' },
  { to: '/teacher/create',    label: 'Create Task' },
  { to: '/teacher/submissions', label: 'Submissions' },
];

function Overview() {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/teacher/stats').then(r => setStats(r.data)); }, []);
  if (!stats) return <p className="text-gray-400">Loading…</p>;
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active tasks',  value: stats.activeTasks },
          { label: 'My sections',   value: stats.totalSections },
          { label: 'Students',      value: stats.totalStudents },
          { label: 'Submissions',   value: stats.totalSubmissions },
        ].map(s => (
          <div key={s.label} className="card">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className="text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tasks() {
  const [tasks, setTasks] = useState([]);
  useEffect(() => { api.get('/tasks').then(r => setTasks(r.data)); }, []);

  const remove = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t._id !== id));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Tasks</h2>
        <Link to="/teacher/create" className="btn-primary">+ New task</Link>
      </div>
      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t._id} className="card flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-medium">{t.title}</h3>
                {!t.isActive && <span className="badge-inactive">Inactive</span>}
                {new Date() > new Date(t.dueDate) && <span className="badge-late">Past due</span>}
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{t.description}</p>
              <div className="flex gap-4 text-xs text-gray-400">
                <span>Due: {new Date(t.dueDate).toLocaleDateString()}</span>
                <span>Sections: {t.sections?.map(s => s.name).join(', ')}</span>
                <span>{t.submissionCount} submissions</span>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link to={`/tasks/${t._id}`} className="btn-secondary text-xs py-1.5 px-3">View</Link>
              <button onClick={() => remove(t._id)} className="btn-danger text-xs py-1.5 px-3">Delete</button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <div className="card text-center text-gray-400 py-12">No tasks yet. Create your first task!</div>}
      </div>
    </div>
  );
}

function CreateTask() {
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', dueDate: '', sectionIds: [], allowedTypes: ['image','pdf','docx'],
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/teacher/sections').then(r => setSections(r.data)); }, []);

  const toggleSection = (id) => {
    setForm(f => ({
      ...f, sectionIds: f.sectionIds.includes(id) ? f.sectionIds.filter(x => x !== id) : [...f.sectionIds, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.sectionIds.length === 0) return toast.error('Select at least one section');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v);
      });
      files.forEach(f => fd.append('attachments', f));
      await api.post('/tasks', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Task created!');
      setForm({ title: '', description: '', dueDate: '', sectionIds: [], allowedTypes: ['image','pdf','docx'] });
      setFiles([]);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-xl font-semibold mb-6">Create New Task</h2>
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Task title</label>
            <input className="input" placeholder="e.g. Chapter 3 Essay" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Description / Instructions</label>
            <textarea className="input min-h-[100px] resize-y" placeholder="Describe what students need to do…"
              value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Due date</label>
            <input className="input" type="datetime-local" value={form.dueDate}
              onChange={e => setForm({ ...form, dueDate: e.target.value })} required />
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-2">Assign to sections</label>
            {sections.length === 0 && <p className="text-sm text-amber-600">No sections assigned to you yet.</p>}
            <div className="space-y-2">
              {sections.map(s => (
                <label key={s._id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.sectionIds.includes(s._id)}
                    onChange={() => toggleSection(s._id)} className="rounded" />
                  <span className="text-sm">{s.class?.name} – {s.name}
                    <span className="text-gray-400 ml-1">({s.students?.length} students)</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-600 block mb-1">Attach reference files (optional)</label>
            <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={e => setFiles(Array.from(e.target.files))}
              className="text-sm text-gray-600 file:mr-3 file:btn-secondary file:rounded-lg file:px-3 file:py-1.5 file:text-xs file:border-0 file:bg-gray-100 cursor-pointer" />
            {files.length > 0 && <p className="text-xs text-gray-400 mt-1">{files.length} file(s) selected</p>}
          </div>
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating…' : 'Create task'}
          </button>
        </form>
      </div>
    </div>
  );
}

function Submissions() {
  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState(null);
  const [gradeForm, setGradeForm] = useState({ grade: '', feedback: '' });

  useEffect(() => { api.get('/submissions').then(r => setSubmissions(r.data)); }, []);

  const submitGrade = async (id) => {
    try {
      await api.patch(`/submissions/${id}/grade`, gradeForm);
      setSubmissions(prev => prev.map(s => s._id === id ? { ...s, status: 'graded', ...gradeForm } : s));
      setGrading(null);
      toast.success('Graded!');
    } catch { toast.error('Failed to grade'); }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">All Submissions</h2>
      <div className="space-y-3">
        {submissions.map(s => (
          <div key={s._id} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{s.student?.name}</p>
                <p className="text-xs text-gray-400">{s.task?.title} · {s.section?.name}</p>
                <p className="text-xs text-gray-300 mt-0.5">{new Date(s.submittedAt).toLocaleString()}</p>
                {s.isLate && <span className="badge-late mt-1 inline-block">Late</span>}
              </div>
              <div className="flex items-center gap-2">
                {s.status === 'graded'
                  ? <span className="badge-graded">{s.grade}/100</span>
                  : <span className="badge-submitted">{s.status}</span>
                }
                <button onClick={() => { setGrading(s._id); setGradeForm({ grade: s.grade || '', feedback: s.feedback || '' }); }}
                  className="btn-secondary text-xs py-1 px-2">Grade</button>
              </div>
            </div>
            {s.files?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {s.files.map((f, i) => (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer"
                    className="text-xs bg-gray-50 border border-gray-100 px-3 py-1 rounded-full text-primary hover:bg-primary/5">
                    📎 {f.originalName}
                  </a>
                ))}
              </div>
            )}
            {grading === s._id && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 block mb-1">Grade (0–100)</label>
                    <input className="input" type="number" min="0" max="100"
                      value={gradeForm.grade} onChange={e => setGradeForm({ ...gradeForm, grade: e.target.value })} />
                  </div>
                  <div className="flex-[2]">
                    <label className="text-xs text-gray-500 block mb-1">Feedback</label>
                    <input className="input" placeholder="Optional feedback…"
                      value={gradeForm.feedback} onChange={e => setGradeForm({ ...gradeForm, feedback: e.target.value })} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => submitGrade(s._id)} className="btn-primary text-xs py-1.5">Save grade</button>
                  <button onClick={() => setGrading(null)} className="btn-secondary text-xs py-1.5">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
        {submissions.length === 0 && <div className="card text-center text-gray-400 py-12">No submissions yet</div>}
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  return (
    <Layout navItems={navItems} title="Teacher">
      <Routes>
        <Route index            element={<Overview />} />
        <Route path="tasks"     element={<Tasks />} />
        <Route path="create"    element={<CreateTask />} />
        <Route path="submissions" element={<Submissions />} />
      </Routes>
    </Layout>
  );
}