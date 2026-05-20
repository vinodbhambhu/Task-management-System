import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/layout/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import {
  FiDownload,
  FiCalendar,
  FiClock,
  FiUser,
  FiBook,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowLeft,
} from 'react-icons/fi';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const taskRes = await api.get(`/tasks/${id}`);
        setTask(taskRes.data);

        // Check if student has submitted
        const submissionsRes = await api.get(`/submissions?taskId=${id}`);
        if (submissionsRes.data.length > 0) {
          setSubmission(submissionsRes.data[0]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load task');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length + files.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }
    setFiles([...files, ...selectedFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      toast.error('Please upload at least one file');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('taskId', id);
      if (note) formData.append('note', note);
      files.forEach((file) => formData.append('files', file));

      const res = await api.post('/submissions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Submission uploaded successfully!');
      setSubmission(res.data);
      setFiles([]);
      setNote('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Layout navItems={[]} title="Task Detail">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading task...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout navItems={[]} title="Task Detail">
        <div className="text-center py-12">
          <p className="text-gray-500">Task not found</p>
        </div>
      </Layout>
    );
  }

  const dueDate = new Date(task.dueDate);
  const now = new Date();
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

  const navItems = [
    { to: '/student', label: 'Dashboard', icon: FiBook },
  ];

  return (
    <Layout navItems={navItems} title="Task Detail">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <FiArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Task Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{task.title}</h1>
              <p className="text-blue-100 mb-4">{task.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Due Date</p>
                  <p className="text-lg font-semibold flex items-center gap-2 mt-1">
                    <FiCalendar size={16} />
                    {dueDate.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Time Remaining</p>
                  <p className={`text-lg font-semibold flex items-center gap-2 mt-1 ${
                    isOverdue ? 'text-red-200' : 'text-blue-200'
                  }`}>
                    <FiClock size={16} />
                    {isOverdue
                      ? `${Math.abs(daysUntilDue)} days overdue`
                      : daysUntilDue === 0
                      ? 'Due today'
                      : `${daysUntilDue} days left`}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Assigned By</p>
                  <p className="text-lg font-semibold flex items-center gap-2 mt-1">
                    <FiUser size={16} />
                    {task.teacher?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {submission ? (
                      <>
                        <FiCheckCircle size={16} />
                        <span className="font-semibold">Submitted</span>
                      </>
                    ) : (
                      <>
                        <FiAlertCircle size={16} />
                        <span className="font-semibold">Pending</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Task Details */}
          <div className="col-span-2 space-y-6">
            {/* Full Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Task Description</h2>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {task.description}
                </p>
              </div>
            </div>

            {/* File Requirements */}
            {task.allowedTypes && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FiDownload size={20} className="text-blue-600" />
                  Allowed File Types
                </h3>
                <div className="flex flex-wrap gap-2">
                  {task.allowedTypes.map((type) => (
                    <span
                      key={type}
                      className="bg-white px-4 py-2 rounded-lg text-sm font-semibold text-blue-600 border border-blue-200"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Section */}
            {!submission && (
              <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Submit Your Work</h2>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Upload Files ({files.length}/5)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition cursor-pointer">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileChange}
                      accept={task.allowedTypes ? `.${task.allowedTypes.join(',.').replace(/\//g, '')}` : '*'}
                      className="hidden"
                      id="file-input"
                    />
                    <label htmlFor="file-input" className="cursor-pointer">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-4m4 4l4-4" />
                      </svg>
                      <p className="text-gray-700 font-medium">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-500 mt-1">Maximum 5 files</p>
                    </label>
                  </div>
                </div>

                {/* Selected Files */}
                {files.length > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Selected Files
                    </label>
                    <div className="space-y-2">
                      {files.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8m0 8l-4-4m4 4l4-4" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(idx)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Submission Note (Optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add any notes about your submission..."
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || files.length === 0}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                      </svg>
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      <span>Submit Assignment</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Submitted State */}
            {submission && (
              <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                <div className="flex items-start gap-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <FiCheckCircle size={24} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Assignment Submitted</h3>
                    <p className="text-gray-700 mb-4">
                      Submitted on {new Date(submission.submittedAt).toLocaleDateString()} at{' '}
                      {new Date(submission.submittedAt).toLocaleTimeString()}
                    </p>
                    {submission.isLate && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-800">
                          ⚠️ This submission was submitted after the due date.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => navigate(`/submission/${submission._id}`)}
                      className="text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      View Submission Details →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Key Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Key Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Points</p>
                  <p className="text-2xl font-bold text-blue-600">{task.maxPoints || 100}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    {submission ? (
                      <>
                        {submission.grade !== undefined && submission.grade !== null ? (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                            Graded: {submission.grade}%
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                            Submitted
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
                {submission && submission.grade !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Your Score</p>
                    <p className="text-3xl font-bold text-purple-600">{submission.grade}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* Files Submitted */}
            {submission && submission.files.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Submitted Files</h3>
                <div className="space-y-2">
                  {submission.files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition group"
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center group-hover:bg-blue-200 transition">
                        <FiDownload size={16} className="text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate">
                        {file.originalName}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TaskDetail;