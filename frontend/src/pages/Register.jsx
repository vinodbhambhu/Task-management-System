import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', subject: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await register(form);
      if (form.role === 'teacher') {
        toast.success('Registered! Awaiting admin approval before you can log in.');
        navigate('/login');
      } else {
        toast.success('Account created!');
        navigate('/student');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-primary">TaskFlow</h1>
          <p className="text-gray-500 text-sm mt-1">Create your account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Full name</label>
              <input className="input" placeholder="Your full name" value={form.name} onChange={set('name')} required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email</label>
              <input className="input" type="email" placeholder="you@school.edu" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">I am a…</label>
              <select className="input" value={form.role} onChange={set('role')}>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
            {form.role === 'teacher' && (
              <div>
                <label className="text-sm text-gray-600 block mb-1">Subject (optional)</label>
                <input className="input" placeholder="e.g. Mathematics" value={form.subject} onChange={set('subject')} />
              </div>
            )}
            {form.role === 'teacher' && (
              <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg">
                Teacher accounts require admin approval before you can log in.
              </p>
            )}
            <button className="btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}