import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Layout from '../../components/layout/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  FiBook,
  FiUser,
  FiUsers,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiFilter,
  FiDownload,
  FiSend,
  FiCalendar,
  FiChevronRight,
} from 'react-icons/fi';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    submitted: 0,
    pending: 0,
    overdue: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch section info
        const sectionRes = await api.get('/student/my-section');
        setSection(sectionRes.data);

        // Fetch tasks
        const tasksRes = await api.get('/tasks');
        setTasks(tasksRes.data);

        // Fetch submissions
        const submissionsRes = await api.get('/submissions');
        setSubmissions(submissionsRes.data);

        // Calculate stats
        calculateStats(tasksRes.data, submissionsRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStats = (taskList, submissionList) => {
    const total = taskList.length;
    const submitted = submissionList.length;
    const pending = total - submitted;
    const now = new Date();
    const overdue = taskList.filter((task) => {
      const dueDate = new Date(task.dueDate);
      const isSubmitted = submissionList.some((sub) => String(sub.task._id) === String(task._id));
      return dueDate < now && !isSubmitted;
    }).length;

    setStats({ total, submitted, pending, overdue });
  };

  const getFilteredTasks = () => {
    const now = new Date();

    return tasks.filter((task) => {
      const isSubmitted = submissions.some((sub) => String(sub.task._id) === String(task._id));
      const dueDate = new Date(task.dueDate);
      const isOverdue = dueDate < now;

      switch (filter) {
        case 'submitted':
          return isSubmitted;
        case 'pending':
          return !isSubmitted;
        case 'overdue':
          return !isSubmitted && isOverdue;
        default:
          return true;
      }
    });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getTaskStatus = (taskId) => {
    const submission = submissions.find((sub) => String(sub.task._id) === String(taskId));
    if (!submission) {
      const now = new Date();
      const task = tasks.find((t) => t._id === taskId);
      if (new Date(task.dueDate) < now) return 'overdue';
      return 'pending';
    }
    if (submission.status === 'graded') return 'graded';
    return 'submitted';
  };

  const navItems = [
    { to: '/student', label: 'Dashboard', icon: FiBook },
  ];

  if (loading) {
    return (
      <Layout navItems={navItems} title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredTasks = getFilteredTasks();

  return (
    <Layout navItems={navItems} title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
            <p className="text-gray-500 mt-1">Here's your task overview</p>
          </div>
        </div>

        {/* Section Info Card */}
        {section && (
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white p-6 shadow-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Class</p>
                <p className="text-2xl font-bold">{section.class?.name}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Section</p>
                <p className="text-2xl font-bold">{section.name}</p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Teacher</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <FiUser size={16} />
                  {section.teacher?.name}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm mb-1">Students in Section</p>
                <p className="text-lg font-semibold flex items-center gap-2">
                  <FiUsers size={16} />
                  {section.students?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <FiFileText size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Submitted</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.submitted}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <FiCheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <FiClock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Overdue</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.overdue}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <FiAlertCircle size={24} className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FiFilter size={16} />
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('submitted')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'submitted'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Submitted ({stats.submitted})
          </button>
          <button
            onClick={() => setFilter('overdue')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'overdue'
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overdue ({stats.overdue})
          </button>
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center border border-gray-200">
              <FiFileText size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">No tasks found</p>
              <p className="text-gray-500 text-sm mt-1">
                {filter === 'all'
                  ? 'Check back later for new assignments'
                  : `No ${filter} tasks at the moment`}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const status = getTaskStatus(task._id);
              const daysUntilDue = getDaysUntilDue(task.dueDate);
              const submission = submissions.find((sub) => String(sub.task._id) === String(task._id));
              const isOverdue = daysUntilDue < 0;

              return (
                <div
                  key={task._id}
                  className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition cursor-pointer group"
                  onClick={() => navigate(`/task/${task._id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition">
                          {task.title}
                        </h3>
                        {status === 'graded' && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                            Graded
                          </span>
                        )}
                        {status === 'submitted' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                            Submitted
                          </span>
                        )}
                        {status === 'overdue' && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                            Overdue
                          </span>
                        )}
                        {status === 'pending' && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                            Pending
                          </span>
                        )}
                      </div>

                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <FiCalendar size={14} />
                          <span>
                            Due: {formatDate(task.dueDate)}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 font-medium ${
                          isOverdue ? 'text-red-600' : daysUntilDue <= 2 ? 'text-orange-600' : 'text-gray-600'
                        }`}>
                          <FiClock size={14} />
                          <span>
                            {isOverdue
                              ? `${Math.abs(daysUntilDue)} days overdue`
                              : daysUntilDue === 0
                              ? 'Due today'
                              : daysUntilDue === 1
                              ? 'Due tomorrow'
                              : `${daysUntilDue} days left`}
                          </span>
                        </div>
                        {task.allowedTypes && (
                          <div className="flex items-center gap-1">
                            <FiDownload size={14} />
                            <span>{task.allowedTypes.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {submission && submission.grade !== undefined && (
                      <div className="ml-4 text-right">
                        <p className="text-3xl font-bold text-primary">
                          {submission.grade}%
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Your Score</p>
                      </div>
                    )}
                    {!submission && (
                      <div className="ml-4 bg-blue-50 p-3 rounded-lg">
                        <FiSend size={20} className="text-blue-600" />
                      </div>
                    )}
                    <FiChevronRight size={20} className="ml-2 text-gray-400 group-hover:text-primary transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentDashboard;