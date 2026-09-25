import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Home, Activity, ShieldCheck, Sparkles, MessageSquare, Send, CheckCircle2, Trash2 } from 'lucide-react';
import type { ResaleData, FetchStatus } from './types';

const FLAT_TYPES = ['3 ROOM', '4 ROOM', '5 ROOM'] as const;

const TOWNS: { value: string; label: string }[] = [
  { value: 'ANG MO KIO', label: 'Ang Mo Kio' },
  { value: 'BEDOK', label: 'Bedok' },
  { value: 'BISHAN', label: 'Bishan' },
  { value: 'BUKIT BATOK', label: 'Bukit Batok' },
  { value: 'BUKIT MERAH', label: 'Bukit Merah (Tiong Bahru, Redhill)' },
  { value: 'BUKIT PANJANG', label: 'Bukit Panjang' },
  { value: 'BUKIT TIMAH', label: 'Bukit Timah' },
  { value: 'CENTRAL AREA', label: 'Central Area (Bugis, River Valley, Chinatown)' },
  { value: 'CHOA CHU KANG', label: 'Choa Chu Kang' },
  { value: 'CLEMENTI', label: 'Clementi' },
  { value: 'GEYLANG', label: 'Geylang' },
  { value: 'HOUGANG', label: 'Hougang' },
  { value: 'JURONG EAST', label: 'Jurong East' },
  { value: 'JURONG WEST', label: 'Jurong West' },
  { value: 'KALLANG/WHAMPOA', label: 'Kallang / Whampoa' },
  { value: 'MARINE PARADE', label: 'Marine Parade' },
  { value: 'PASIR RIS', label: 'Pasir Ris' },
  { value: 'PUNGGOL', label: 'Punggol' },
  { value: 'QUEENSTOWN', label: 'Queenstown' },
  { value: 'SEMBAWANG', label: 'Sembawang' },
  { value: 'SENGKANG', label: 'Sengkang' },
  { value: 'SERANGOON', label: 'Serangoon' },
  { value: 'TAMPINES', label: 'Tampines' },
  { value: 'TOA PAYOH', label: 'Toa Payoh' },
  { value: 'WOODLANDS', label: 'Woodlands' },
  { value: 'YISHUN', label: 'Yishun' },
];

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-SG').format(val);
}

function formatMonth(monthStr: string | null): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  if (!year || !month) return monthStr;
  const date = new Date(Number(year), Number(month) - 1);
  const formatted = date.toLocaleString('en-SG', { month: 'long', year: 'numeric' });
  return `${formatted} (${monthStr})`;
}

interface FlatTypeCardProps {
  key?: string;
  town: string;
  flatType: string;
}

function FlatTypeCard({ town, flatType }: FlatTypeCardProps) {
  const [data, setData] = useState<ResaleData | null>(null);
  const [status, setStatus] = useState<FetchStatus>('loading');

  useEffect(() => {
    const apiParams = new URLSearchParams();
    if (town && town !== 'ALL') {
      apiParams.set('town', town);
    } else {
      apiParams.set('town', 'ALL');
    }
    apiParams.set('type', flatType);

    let isMounted = true;
    setStatus('loading');

    fetch(`/api/resale?${apiParams.toString()}`)
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          let errorBody: { unreachable?: boolean; refusal?: boolean } | null = null;
          try {
            errorBody = await res.json();
          } catch {
            // response was empty or non-JSON
          }

          if (errorBody?.unreachable || res.status === 504) {
            setStatus('unreachable');
          } else {
            setStatus('refused');
          }
          return;
        }

        const json: ResaleData = await res.json();
        if (!isMounted) return;
        setData(json);

        if (json.count === 0) {
          setStatus('empty');
        } else {
          setStatus('success');
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setStatus('unreachable');
      });

    return () => {
      isMounted = false;
    };
  }, [town, flatType]);

  const cardIdPrefix = flatType.toLowerCase().replace(/\s+/g, '-');

  return (
    <section
      id={`card-${cardIdPrefix}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
          <span className="text-sm font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
            {flatType}
          </span>
          {status === 'success' && data?.month && (
            <span
              id={`badge-month-${cardIdPrefix}`}
              className="text-xs font-semibold px-2 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
            >
              {formatMonth(data.month)}
            </span>
          )}
        </div>

        {/* Value placement area showing the 4 condition sentences or the real data */}
        <div id={`value-area-${cardIdPrefix}`} className="min-h-[140px] flex flex-col justify-center">
          {status === 'loading' && (
            <p
              id={`condition-loading-${cardIdPrefix}`}
              className="text-base sm:text-lg font-medium text-slate-600 animate-pulse"
            >
              Checking the latest resale prices…
            </p>
          )}

          {status === 'empty' && (
            <p
              id={`condition-empty-${cardIdPrefix}`}
              className="text-base font-medium text-slate-700"
            >
              No resale transactions found for that town and flat type.
            </p>
          )}

          {status === 'refused' && (
            <div
              id={`condition-refused-${cardIdPrefix}`}
              className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900"
            >
              <p className="text-sm font-medium leading-snug">
                Resale prices are unavailable right now — data.gov.sg turned the request away. Try again in a few minutes.
              </p>
            </div>
          )}

          {status === 'unreachable' && (
            <div
              id={`condition-unreachable-${cardIdPrefix}`}
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900"
            >
              <p className="text-sm font-medium leading-snug">
                We couldn't reach data.gov.sg. Check your connection and try again.
              </p>
            </div>
          )}

          {status === 'success' && data?.medianPrice !== null && data?.medianPrice !== undefined && (
            <div id={`live-data-${cardIdPrefix}`} className="space-y-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                  Median Resale Price
                </span>
                <p
                  id={`price-${cardIdPrefix}`}
                  className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight"
                >
                  {formatCurrency(data.medianPrice)}
                </p>
                {data.minPrice !== null && data.minPrice !== undefined && (
                  <div id={`details-${cardIdPrefix}`} className="mt-2.5 space-y-1 text-xs text-slate-600">
                    <p id={`range-${cardIdPrefix}`}>Range: S${formatNumber(data.minPrice)} – S${formatNumber(data.maxPrice!)}</p>
                    <p id={`persqm-${cardIdPrefix}`}>Per sqm: S${formatNumber(data.medianPricePerSqm!)}</p>
                    <p id={`lease-${cardIdPrefix}`}>Remaining lease: {data.medianRemainingLeaseYears} years (median)</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                <Activity className="w-4 h-4 text-emerald-600 shrink-0" />
                <span id={`count-${cardIdPrefix}`} className="font-semibold text-slate-800">
                  {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                </span>
                <span>recorded in {data.month}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

interface CommentItem {
  id: string;
  name: string;
  text: string;
  timestamp: string;
  createdAt?: number;
}

function formatCommentDate(createdAt?: number, fallback?: string): string {
  if (!createdAt) return fallback || 'Recently';
  const diffSec = Math.floor((Date.now() - createdAt) / 1000);
  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return new Date(createdAt).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' });
}

function DisqusComments() {
  const [comments, setComments] = useState<CommentItem[]>(() => {
    try {
      const saved = localStorage.getItem('hdb_resale_user_comments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (c: any) =>
              c.id !== 'c1' &&
              c.id !== 'c2' &&
              !c.text?.includes('Checked the 4-room median') &&
              !c.text?.includes('The remaining lease and per sqm')
          );
          localStorage.setItem('hdb_resale_user_comments', JSON.stringify(clean));
          return clean;
        }
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState('');

  useEffect(() => {
    (window as any).disqus_config = function (this: any) {
      this.page = this.page || {};
      this.page.url = 'https://firsttimehdb.vercel.app/';
      this.page.identifier = 'home';
    };

    const scriptId = 'disqus-script';
    const script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      const d = document;
      const s = d.createElement('script');
      s.id = scriptId;
      s.src = 'https://firsttimehdb-vercel-app.disqus.com/embed.js';
      s.setAttribute('data-timestamp', String(+new Date()));
      (d.head || d.body).appendChild(s);
    } else if ((window as any).DISQUS) {
      try {
        (window as any).DISQUS.reset({
          reload: true,
          config: function (this: any) {
            this.page = this.page || {};
            this.page.url = 'https://firsttimehdb.vercel.app/';
            this.page.identifier = 'home';
          },
        });
      } catch {
        // ignore
      }
    }
  }, []);

  const handlePostComment = (e?: FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = commentText.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const now = Date.now();
    const newComment: CommentItem = {
      id: 'cmt-' + now,
      name: authorName.trim() || 'Anonymous Guest',
      text: trimmed,
      timestamp: 'Just now',
      createdAt: now,
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    try {
      localStorage.setItem('hdb_resale_user_comments', JSON.stringify(updated));
    } catch {
      // ignore
    }

    setCommentText('');
    setAuthorName('');
    setIsSubmitting(false);
    setFeedbackStatus('Your comment has been posted!');
    setTimeout(() => setFeedbackStatus(''), 4000);
  };

  const handleDeleteComment = (commentId: string) => {
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    try {
      localStorage.setItem('hdb_resale_user_comments', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleTextareaKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePostComment();
    }
  };

  return (
    <div id="disqus-container" className="mt-12 pt-8 border-t border-slate-200">
      {/* Usable Comments Section where anyone can post */}
      <section id="comments-section" className="mb-8 space-y-6">
        <form
          id="comment-form"
          onSubmit={handlePostComment}
          className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-sm font-black text-slate-900 tracking-wide uppercase flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
              <span className="font-extrabold text-slate-900">Post a Comment (Open to Anyone)</span>
            </span>
            <span className="text-xs text-slate-400">No account required</span>
          </div>

          <textarea
            id="comment-text-input"
            rows={3}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Say what worked for you and what did not (e.g. price accuracy, town comparisons, or features you'd like to see)..."
            required
            className="w-full text-sm text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none transition-colors"
          />

          <div className="mt-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                id="comment-name-input"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your name or flat type (optional)"
                className="text-xs text-slate-800 placeholder-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:max-w-xs transition-colors"
              />
              <span className="hidden sm:inline-block text-[11px] text-slate-400">
                Press Ctrl+Enter to post
              </span>
            </div>

            <button
              id="comment-post-submit"
              type="submit"
              disabled={isSubmitting || !commentText.trim()}
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post Comment</span>
            </button>
          </div>

          {feedbackStatus && (
            <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{feedbackStatus}</span>
            </div>
          )}
        </form>

        {/* Live Comments Thread if any comments exist */}
        {comments.length > 0 && (
          <div id="comments-thread-list" className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-semibold text-slate-700">Visitor Feedback ({comments.length})</span>
              <span>Single feedback thread</span>
            </div>

            {comments.map((item) => (
              <div
                key={item.id}
                className="group bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-2 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px] uppercase">
                      {item.name.charAt(0) || 'A'}
                    </div>
                    <span className="font-semibold text-slate-800">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400">
                      {formatCommentDate(item.createdAt, item.timestamp)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(item.id)}
                      title="Delete this comment"
                      className="text-slate-400 hover:text-red-500 opacity-60 group-hover:opacity-100 transition-opacity p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-slate-700 leading-relaxed pl-8 text-sm">{item.text}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Disqus Thread matching CSS selector: div#disqus-container > div#disqus_thread */}
      <div id="disqus_thread" className="min-h-[200px]"></div>
      <noscript>
        Please enable JavaScript to view the{' '}
        <a href="https://disqus.com/?ref_noscript">comments powered by Disqus.</a>
      </noscript>
    </div>
  );
}

export default function App() {
  const [selectedTown, setSelectedTown] = useState<string>('ALL');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rawTown = searchParams.get('town');
    if (rawTown && rawTown.trim().toUpperCase() !== 'ALL') {
      setSelectedTown(rawTown.trim().toUpperCase());
    } else {
      setSelectedTown('ALL');
    }

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const t = currentParams.get('town');
      if (t && t.trim().toUpperCase() !== 'ALL') {
        setSelectedTown(t.trim().toUpperCase());
      } else {
        setSelectedTown('ALL');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleSelectTown = (newTown: string) => {
    setSelectedTown(newTown);
    const url = new URL(window.location.href);
    if (!newTown || newTown === 'ALL') {
      url.searchParams.delete('town');
    } else {
      url.searchParams.set('town', newTown);
    }
    window.history.pushState({}, '', url.toString());
  };

  const isAllSingapore = !selectedTown || selectedTown === 'ALL';
  const selectedTownObj = TOWNS.find((t) => t.value.toUpperCase() === (selectedTown || '').toUpperCase());
  const chosenTownDisplay = selectedTownObj
    ? selectedTownObj.label
    : (selectedTown
        ? selectedTown
            .toLowerCase()
            .split(' ')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        : 'Singapore');

  const headingText = isAllSingapore
    ? 'Singapore HDB Resale Prices'
    : `${chosenTownDisplay} HDB Resale Prices`;

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Header Bar */}
      <header id="app-header" className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700">First-Time Buyer Guide</p>
              <p className="text-sm font-semibold text-slate-900">Singapore HDB Resale Benchmark</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official data.gov.sg datastore</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Main Heading with Chosen Town or Singapore */}
        <div id="heading-container" className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>First-Time HDB Buyers</span>
          </div>
          <h1 id="page-heading" className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {headingText}
          </h1>
          <p id="page-subheading" className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Evaluating whether a flat in {isAllSingapore ? 'Singapore' : chosenTownDisplay} fits your housing budget.
            Latest median resale benchmark computed directly from verified data.gov.sg records.
          </p>
        </div>

        {/* Town Dropdown Selector Above the Three Cards */}
        <div id="town-selector-container" className="mb-6 max-w-xs">
          <label htmlFor="town-select" className="text-sm font-semibold text-slate-700 block mb-1.5">
            Town
          </label>
          <div className="relative">
            <select
              id="town-select"
              value={selectedTown}
              onChange={(e) => handleSelectTown(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 pr-10 cursor-pointer"
            >
              <option value="ALL">All of Singapore</option>
              {TOWNS.map((town) => (
                <option key={town.value} value={town.value}>
                  {town.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Three Cards Side by Side (3 ROOM, 4 ROOM, 5 ROOM), stacking vertically on phone */}
        <div id="cards-grid" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {FLAT_TYPES.map((flatType) => (
            <FlatTypeCard key={`${selectedTown}-${flatType}`} town={selectedTown} flatType={flatType} />
          ))}
        </div>

        {/* Disqus Comment Section */}
        <DisqusComments />
      </main>

      {/* Footer with exact required licence credit and link */}
      <footer id="app-footer" className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-xs text-slate-500 leading-relaxed text-center sm:text-left space-y-3">
          <p id="licence-credit">
            Contains information from Resale flat prices based on registration date from Jan-2017 onwards accessed from data.gov.sg which is made available under the terms of the{' '}
            <a
              id="licence-link"
              href="https://data.gov.sg/open-data-licence"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              Singapore Open Data Licence version 1.0
            </a>
            .
          </p>
          <p id="privacy-notice">
            This page uses Microsoft Clarity and Disqus, which use cookies to record how visitors use the site and to host comments. By using this page you agree that we and Microsoft may collect and use this data. See the{' '}
            <a
              href="https://www.microsoft.com/privacy/privacystatement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              Microsoft Privacy Statement
            </a>{' '}
            (
            <a
              href="https://www.microsoft.com/privacy/privacystatement"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              https://www.microsoft.com/privacy/privacystatement
            </a>
            ), the{' '}
            <a
              href="https://disqus.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              Disqus privacy policy
            </a>{' '}
            (
            <a
              href="https://disqus.com/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              https://disqus.com/privacy-policy/
            </a>
            ) and the{' '}
            <a
              href="https://disqus.com/data-sharing-settings/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              Disqus data sharing settings
            </a>{' '}
            (
            <a
              href="https://disqus.com/data-sharing-settings/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 underline hover:text-emerald-900 transition-colors"
            >
              https://disqus.com/data-sharing-settings/
            </a>
            ).
          </p>
        </div>
      </footer>
    </div>
  );
}
