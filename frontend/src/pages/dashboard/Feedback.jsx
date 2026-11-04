import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import ErrorNote from '../../components/ui/ErrorNote.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Stars from '../../components/ui/Stars.jsx';
import Field from '../../components/ui/Field.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { HBarChart } from '../../components/ui/BarChart.jsx';
import useFetch from '../../hooks/useFetch.js';
import { getFeedback, createFeedback, respondToFeedback, publishFeedback } from '../../services/feedbackService.js';
import { getBookings } from '../../services/bookingService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { MANAGEMENT } from '../../utils/constants.js';
import { formatDate } from '../../utils/format.js';

export default function Feedback() {
  const { user } = useAuth();
  const isGuest = user.role === 'guest';
  const [rating, setRating] = useState('');
  const { data, meta, loading, error, reload, setData } = useFetch(() => getFeedback({ rating }), [rating]);
  const [replying, setReplying] = useState(null);

  const replace = (item) => setData((list) => list.map((f) => (f._id === item._id ? item : f)));

  return (
    <>
      <PageHeader
        title="Feedback"
        description={isGuest ? 'Tell us how we did. Your comments go straight to the hotel manager.' : 'Guest reviews, replies and what appears on the website.'}
      />

      {isGuest && <FeedbackForm onCreated={(f) => setData((list) => [f, ...(list || [])])} />}

      {!isGuest && data && (
        <div className="grid-2 feedback-summary">
          <section className="panel rating-hero">
            <strong>{meta?.average || '—'}</strong>
            <Stars value={meta?.average || 0} size={20} />
            <span className="muted">{meta?.count} review{meta?.count === 1 ? '' : 's'}</span>
          </section>
          <section className="panel">
            <HBarChart
              data={[5, 4, 3, 2, 1].map((s) => ({ label: `${s} star`, value: data.filter((f) => f.rating === s).length }))}
            />
          </section>
        </div>
      )}

      {!isGuest && (
        <div className="toolbar">
          <div className="tabs" role="tablist">
            {[['', 'All'], ['5', '5 stars'], ['4', '4'], ['3', '3'], ['2', '2'], ['1', '1']].map(([v, l]) => (
              <button key={v} role="tab" aria-selected={rating === v} className={`tab ${rating === v ? 'is-on' : ''}`} onClick={() => setRating(v)}>{l}</button>
            ))}
          </div>
        </div>
      )}

      <ErrorNote message={error} onRetry={reload} />
      {loading ? <Spinner /> : data?.length ? (
        <ul className="feedback-list">
          {data.map((f) => (
            <li key={f._id} className="panel feedback-item">
              <header>
                <Stars value={f.rating} />
                {f.title && <strong>{f.title}</strong>}
                <span className="muted">{formatDate(f.createdAt)}{!isGuest && f.guest ? `, ${f.guest.name}` : ''}{f.booking ? `, stay ${f.booking.code}` : ''}</span>
              </header>
              <p>{f.comment}</p>
              {f.response?.message && (
                <div className="reply">
                  <strong>Reply from the hotel{f.response.by ? ` (${f.response.by.name})` : ''}</strong>
                  <p>{f.response.message}</p>
                </div>
              )}
              {!isGuest && (
                <div className="row">
                  <button className="btn btn-sm btn-outline" onClick={() => setReplying(f)}>{f.response?.message ? 'Edit reply' : 'Reply'}</button>
                  {MANAGEMENT.includes(user.role) && <PublishToggle item={f} onChange={replace} />}
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : !error && <EmptyState icon="star" title="No feedback yet" text={isGuest ? 'Share your thoughts using the form above.' : 'Reviews will appear here.'} />}

      <ReplyModal item={replying} onClose={() => setReplying(null)} onSaved={(f) => { setReplying(null); replace(f); }} />
    </>
  );
}

function PublishToggle({ item, onChange }) {
  const toast = useToast();
  const toggle = async () => {
    try {
      const res = await publishFeedback(item._id, !item.isPublished);
      onChange(res.data);
      toast.success(res.message);
    } catch (err) {
      toast.error(err.message);
    }
  };
  return (
    <label className="switch">
      <input type="checkbox" checked={item.isPublished} onChange={toggle} />
      <span>Show on website</span>
    </label>
  );
}

function FeedbackForm({ onCreated }) {
  const toast = useToast();
  const [params] = useSearchParams();
  const [stays, setStays] = useState([]);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '', bookingId: params.get('booking') || '' });
  const [error, setError] = useState('');

  useEffect(() => {
    getBookings({ status: 'checked-out', limit: 20 }).then((res) => setStays(res.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.rating) {
      setError('Please choose a star rating.');
      return;
    }
    setError('');
    try {
      const res = await createFeedback({ ...form, bookingId: form.bookingId || undefined });
      toast.success(res.message);
      onCreated(res.data);
      setForm({ rating: 0, title: '', comment: '', bookingId: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="panel feedback-form" onSubmit={submit}>
      <Stars value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
      <div className="form-grid">
        <Field label="Headline" hint="Optional"><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={100} /></Field>
        <Field label="Which stay?" hint="Optional">
          <select className="input" value={form.bookingId} onChange={(e) => setForm({ ...form, bookingId: e.target.value })}>
            <option value="">General feedback</option>
            {stays.map((b) => <option key={b._id} value={b._id}>Room {b.room?.roomNumber}, {formatDate(b.checkIn)}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Your comments"><textarea className="input" rows="4" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required maxLength={1000} /></Field>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button className="btn btn-primary">Send feedback</button>
    </form>
  );
}

function ReplyModal({ item, onClose, onSaved }) {
  const toast = useToast();
  const [message, setMessage] = useState('');
  useEffect(() => setMessage(item?.response?.message || ''), [item]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await respondToFeedback(item._id, message);
      toast.success(res.message);
      onSaved(res.data);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Modal open={Boolean(item)} onClose={onClose} title="Reply to guest" subtitle={item?.title || item?.comment?.slice(0, 80)}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button type="submit" form="reply-form" className="btn btn-primary">Send reply</button></>}>
      <form id="reply-form" onSubmit={submit}>
        <Field label="Reply" hint="The guest is notified and sees this on their feedback page.">
          <textarea className="input" rows="4" value={message} onChange={(e) => setMessage(e.target.value)} required />
        </Field>
      </form>
    </Modal>
  );
}
