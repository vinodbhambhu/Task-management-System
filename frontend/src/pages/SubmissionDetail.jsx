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
  FiAward,
  FiMessageSquare,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
} from 'react-icons/fi';

const SubmissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/submissions/${id}`);
        setSubmission(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load submission');
        navigate('/student');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [id, navigate]);

  if (loading) {
    return (
      <Layout navItems={[]} title="Submission Detail">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading submission...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!submission) {
    return (
      <Layout navItems={[]} title="Submission Detail">
        <div className="text-center py-12">
          <p className="text-gray-500">Submission not found</p>
        </div>
      </Layout>
    );
  }

  const navItems = [
    { to: '/student', label: 'Dashboard', icon: FiBook },
  ];

  const submittedDate = new Date(submission.submittedAt);
  const taskDueDate = new Date(submission.task.dueDate);
  const isLate = submittedDate > taskDueDate;
  const isGraded = submission.grade !== undefined && submission.grade !== null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <Layout navItems={navItems} title="Submission Detail">
      <div className="space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/student')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
        >
          <FiArrowLeft size={18} />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-linear-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{submission.task.title}</h1>
              <p className="text-blue-100 mb-6">Submission Details & Feedback</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-blue-100 text-sm">Submitted By</p>
                  <p className="text-lg font-semibold flex items-center gap-2 mt-1">
                    <FiUser size={16} />
                    {submission.student.name}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Submission Date</p>
                  <p className="text-lg font-semibold flex items-center gap-2 mt-1">
                    <FiCalendar size={16} />
                    {formatDate(submission.submittedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Submission Time</p>
                  <p className="text-lg font-semibold flex items-center gap-2 mt-1">
                    <FiClock size={16} />
                    {formatTime(submission.submittedAt)}
                  </p>
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {isGraded ? (
                      <>
                        <FiAward size={16} />
                        <span className="font-semibold">Graded</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={16} />
                        <span className="font-semibold">Submitted</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Files & Details */}
          <div className="col-span-2 space-y-6">
            {/* Late Submission Warning */}
            {isLate && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="bg-red-100 p-3 rounded-full shrink-0">
                    <FiAlertCircle size={24} className="text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">Late Submission</h3>
                    <p className="text-red-700 text-sm">
                      This assignment was submitted after the due date of {formatDate(submission.task.dueDate)}.
                      Late submissions may be subject to grade deductions.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Submitted Files */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FiDownload size={20} />
                Submitted Files
              </h2>
              {submission.files && submission.files.length > 0 ? (
                <div className="space-y-3">
                  {submission.files.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-linear-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg hover:shadow-md transition group"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition shrink-0">
                          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {file.resourceType === 'image' ? 'Image' : 'File'} • {file.url?.split('/').pop()?.substring(0, 20)}
                          </p>
                        </div>
                      </div>
                      <div className="text-blue-600 group-hover:text-blue-700 shrink-0 ml-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No files submitted</p>
                </div>
              )}
            </div>

            {/* Student Note */}
            {submission.note && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMessageSquare size={20} />
                  Student Note
                </h2>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700 whitespace-pre-wrap">{submission.note}</p>
                </div>
              </div>
            )}

            {/* Teacher Feedback */}
            {isGraded && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FiMessageSquare size={20} className="text-green-600" />
                  Teacher Feedback
                </h2>
                {submission.feedback ? (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-gray-700 whitespace-pre-wrap">{submission.feedback}</p>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No feedback provided yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Grade Card */}
            {isGraded ? (
              <div className="bg-linear-to-br from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
                <p className="text-green-100 text-sm font-semibold mb-2">YOUR SCORE</p>
                <p className="text-5xl font-bold mb-2">{submission.grade}%</p>
                <div className="bg-white/20 rounded-lg p-3">
                  <p className="text-sm font-medium">Excellent work!</p>
                </div>
              </div>
            ) : (
              <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <FiClock size={32} className="mx-auto mb-2 opacity-80" />
                    <p className="text-blue-100 font-medium">Awaiting Grading</p>
                    <p className="text-xs text-blue-200 mt-1">Your teacher is reviewing your work</p>
                  </div>
                </div>
              </div>
            )}

            {/* Task Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Task Information</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Task Title</p>
                  <p className="font-semibold text-gray-900">{submission.task.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(submission.task.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Submission Status</p>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="font-semibold text-gray-900">
                      {isLate ? 'Late Submission' : 'On Time'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <div className="w-1 h-8 bg-gray-300 my-1"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Assigned</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(submission.task.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                    <div className="w-1 h-8 bg-gray-300 my-1"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Due Date</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(submission.task.dueDate)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 ${isLate ? 'bg-red-500' : 'bg-green-500'} rounded-full`}></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Submitted</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(submission.submittedAt)} at {formatTime(submission.submittedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Student Info</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-400 to-purple-500 text-white flex items-center justify-center font-bold text-lg">
                  {submission.student.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{submission.student.name}</p>
                  <p className="text-xs text-gray-500">{submission.student.email}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600">Class</p>
                <p className="font-semibold text-gray-900">{submission.class?.name || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SubmissionDetail;