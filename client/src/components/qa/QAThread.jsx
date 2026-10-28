import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import socket from '../../services/socket';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  HiOutlineChatAlt2,
  HiOutlineQuestionMarkCircle,
  HiOutlineCheckCircle,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';

function QAThread({ listingId, isSeller, isAuthenticated }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [submittingQ, setSubmittingQ] = useState(false);

  // Answering state
  const [answeringQid, setAnsweringQid] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [submittingA, setSubmittingA] = useState(false);

  const fetchQuestions = async () => {
    try {
      const res = await api.get(`/listings/${listingId}/questions`);
      setQuestions(res.data.questions || []);
    } catch {
      console.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();

    // Listen for live Q&A updates
    const handleQuestionPosted = (data) => {
      setQuestions((prev) => [data, ...prev]);
    };

    const handleAnswerPosted = (data) => {
      setQuestions((prev) =>
        prev.map((q) =>
          q._id === data._id
            ? {
                ...q,
                answer: data.answer,
                answeredAt: data.answeredAt,
                answeredBy: data.answeredBy,
              }
            : q
        )
      );
    };

    socket.on('question-posted', handleQuestionPosted);
    socket.on('answer-posted', handleAnswerPosted);

    return () => {
      socket.off('question-posted', handleQuestionPosted);
      socket.off('answer-posted', handleAnswerPosted);
    };
  }, [listingId]);

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    if (!isAuthenticated) {
      toast.error('Please log in to ask a question');
      return;
    }

    setSubmittingQ(true);
    try {
      const res = await api.post(`/listings/${listingId}/questions`, {
        question: newQuestion.trim(),
      });
      toast.success('Question submitted to seller! 💬');
      setNewQuestion('');
      // Optimistically add if not already emitted
      setQuestions((prev) => {
        if (prev.some((q) => q._id === res.data.question._id)) return prev;
        return [res.data.question, ...prev];
      });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit question');
    } finally {
      setSubmittingQ(false);
    }
  };

  const handleAnswerSubmit = async (qid) => {
    if (!answerText.trim()) return;

    setSubmittingA(true);
    try {
      const res = await api.put(`/questions/${qid}/answer`, {
        answer: answerText.trim(),
      });
      toast.success('Answer published publicly! ✅');
      setQuestions((prev) =>
        prev.map((q) => (q._id === qid ? res.data.question : q))
      );
      setAnsweringQid(null);
      setAnswerText('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit answer');
    } finally {
      setSubmittingA(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Ask Question Form (Buyer only) */}
      {!isSeller && (
        <form
          onSubmit={handleAskSubmit}
          className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <HiOutlineQuestionMarkCircle className="w-4 h-4 text-primary-600" />
            <span>Ask the seller a question</span>
          </div>

          <textarea
            rows={2}
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Ask about wear, accessories, campus pickup spot..."
            maxLength={1000}
            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {newQuestion.length}/1000 • Max 5 questions per hour
            </span>

            {isAuthenticated ? (
              <button
                type="submit"
                disabled={submittingQ || newQuestion.trim().length < 5}
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1"
              >
                <HiOutlinePaperAirplane className="w-3.5 h-3.5 rotate-90" />
                {submittingQ ? 'Sending...' : 'Ask Question'}
              </button>
            ) : (
              <span className="text-xs text-slate-500">
                <Link to="/login" className="text-primary-600 underline font-semibold">
                  Log in
                </Link>{' '}
                to ask
              </span>
            )}
          </div>
        </form>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="py-8 text-center text-slate-400 text-xs">
          Loading Q&A thread...
        </div>
      ) : questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((q) => (
            <div
              key={q._id}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3"
            >
              {/* Question */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  Q
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">
                      {q.asker?.name || 'Student'}
                    </span>
                    <span className="text-xs text-slate-400">
                      {q.createdAt
                        ? formatDistanceToNow(new Date(q.createdAt), {
                            addSuffix: true,
                          })
                        : 'recently'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 mt-1 leading-relaxed">
                    {q.question}
                  </p>
                </div>
              </div>

              {/* Answer */}
              {q.answer ? (
                <div className="ml-8 pl-3 border-l-2 border-primary-200 bg-primary-50/40 rounded-r-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    A
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary-900 text-xs">
                        {q.answeredBy?.name || 'Seller'}
                      </span>
                      <span className="text-[10px] font-bold uppercase bg-primary-200 text-primary-800 px-1.5 py-0.2 rounded">
                        Seller
                      </span>
                      <span className="text-xs text-slate-400">
                        {q.answeredAt
                          ? formatDistanceToNow(new Date(q.answeredAt), {
                              addSuffix: true,
                            })
                          : ''}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 mt-1">{q.answer}</p>
                  </div>
                </div>
              ) : isSeller ? (
                <div className="ml-8">
                  {answeringQid === q._id ? (
                    <div className="space-y-2 mt-2">
                      <textarea
                        rows={2}
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Write your public answer to this buyer..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setAnsweringQid(null);
                            setAnswerText('');
                          }}
                          className="px-3 py-1 text-xs text-slate-600 border border-slate-300 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingA || !answerText.trim()}
                          onClick={() => handleAnswerSubmit(q._id)}
                          className="px-3.5 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-50"
                        >
                          {submittingA ? 'Publishing...' : 'Publish Answer'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setAnsweringQid(q._id);
                        setAnswerText('');
                      }}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                    >
                      Answer this question →
                    </button>
                  )}
                </div>
              ) : (
                <div className="ml-8 text-xs text-slate-400 italic">
                  Awaiting seller response...
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-400 text-sm">
          No questions yet. Have a question about this item? Ask the seller above!
        </div>
      )}
    </div>
  );
}

export default QAThread;
