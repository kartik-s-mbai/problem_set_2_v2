import { useEffect, useState } from 'react';
import { Home, Activity, ShieldCheck, Sparkles } from 'lucide-react';
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
      </main>

      {/* Footer with exact required licence credit and link */}
      <footer id="app-footer" className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-xs text-slate-500 leading-relaxed text-center sm:text-left">
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
        </div>
      </footer>
    </div>
  );
}
