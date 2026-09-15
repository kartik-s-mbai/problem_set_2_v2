import { useEffect, useState } from 'react';
import { Home, Calendar, Activity, Info, Coins, ShieldCheck, HeartHandshake } from 'lucide-react';
import type { ResaleData, FetchStatus } from './types';

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
    maximumFractionDigits: 0,
  }).format(val);
}

function formatMonth(monthStr: string | null): string {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  if (!year || !month) return monthStr;
  const date = new Date(Number(year), Number(month) - 1);
  const formatted = date.toLocaleString('en-SG', { month: 'long', year: 'numeric' });
  return `${formatted} (${monthStr})`;
}

export default function App() {
  const [data, setData] = useState<ResaleData | null>(null);
  const [status, setStatus] = useState<FetchStatus>('loading');
  const [townQuery, setTownQuery] = useState('TAMPINES');
  const [typeQuery, setTypeQuery] = useState('4 ROOM');

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const rawTown = searchParams.get('town') || 'TAMPINES';
    const rawType = searchParams.get('type') || '4 ROOM';

    setTownQuery(rawTown.trim());
    setTypeQuery(rawType.trim());

    const apiParams = new URLSearchParams();
    apiParams.set('town', rawTown.trim());
    apiParams.set('type', rawType.trim());

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
            setStatus('upstream unreachable');
          } else {
            setStatus('upstream refused');
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
        setStatus('upstream unreachable');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const townDisplay = (data?.town || townQuery || 'TAMPINES').toUpperCase();
  const flatTypeDisplay = (data?.flatType || typeQuery || '4 ROOM').toUpperCase();

  // Budget calculations for couples when medianPrice is available
  const medianPrice = data?.medianPrice ?? 0;
  const downpayment20 = medianPrice * 0.2;
  const loanAmount80 = medianPrice * 0.8;
  // Standard 25-year HDB loan at 2.6% p.a.
  // Monthly payment formula: P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  const monthlyRate = 0.026 / 12;
  const totalMonths = 25 * 12;
  const estMonthlyInstallment =
    medianPrice > 0
      ? Math.round(
          (loanAmount80 * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
            (Math.pow(1 + monthlyRate, totalMonths) - 1)
        )
      : 0;
  // Recommended combined gross monthly income (MSR 30% limit)
  const estRecommendedCombinedIncome = Math.round(estMonthlyInstallment / 0.3);

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      {/* Header Bar */}
      <header id="app-header" className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-emerald-700">Couple Housing Decision</p>
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
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        {/* Main Heading with Town */}
        <div id="heading-container" className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-3">
            <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
            <span>First-Home Planning for Couples</span>
          </div>
          <h1 id="page-heading" className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {townDisplay} {flatTypeDisplay} Resale Price
          </h1>
          <p id="page-subheading" className="mt-2 text-slate-600 text-sm sm:text-base max-w-2xl leading-relaxed">
            Evaluating whether a {flatTypeDisplay.toLowerCase()} flat in {townDisplay} fits your joint household budget.
            Real-time median resale benchmark computed directly from verified data.gov.sg records.
          </p>
        </div>

        {/* Primary Benchmark Card */}
        <section id="benchmark-card" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                Latest Monthly Resale Benchmark
              </h2>
            </div>
            {status === 'success' && data?.month && (
              <span id="badge-month" className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {formatMonth(data.month)}
              </span>
            )}
          </div>

          {/* Value Placement Area: Exact 4 Condition Sentences or Real Median Price */}
          <div id="value-placement-area" className="py-2">
            {status === 'loading' && (
              <p id="condition-sentence-loading" className="text-xl sm:text-2xl font-medium text-slate-600 animate-pulse">
                Checking the latest resale prices…
              </p>
            )}

            {status === 'empty' && (
              <p id="condition-sentence-empty" className="text-base sm:text-lg font-medium text-slate-700">
                No resale transactions found for that town and flat type.
              </p>
            )}

            {status === 'upstream refused' && (
              <div id="condition-sentence-refused" className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                <p className="text-base sm:text-lg font-medium">
                  Resale prices are unavailable right now — data.gov.sg turned the request away. Try again in a few minutes.
                </p>
              </div>
            )}

            {status === 'upstream unreachable' && (
              <div id="condition-sentence-unreachable" className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                <p className="text-base sm:text-lg font-medium">
                  We couldn't reach data.gov.sg. Check your connection and try again.
                </p>
              </div>
            )}

            {status === 'success' && data?.medianPrice !== null && data?.medianPrice !== undefined && (
              <div id="live-data-container">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-1">
                      Median Resale Price
                    </span>
                    <p id="live-median-price" className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                      {formatCurrency(data.medianPrice)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 self-start sm:self-auto">
                    <Activity className="w-4 h-4 text-emerald-600" />
                    <span id="live-transaction-count" className="font-semibold text-slate-800">
                      {data.count} {data.count === 1 ? 'transaction' : 'transactions'}
                    </span>
                    <span>recorded in {data.month}</span>
                  </div>
                </div>

                {/* Couple Budget Breakdown Section */}
                <div id="budget-breakdown" className="mt-8 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-4 h-4 text-slate-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Estimated Couple Financing (HDB 80% Loan @ 2.6%)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div id="metric-downpayment" className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">20% Downpayment</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(downpayment20)}</p>
                      <p className="text-xs text-slate-500 mt-1">Payable with CPF OA and/or Cash</p>
                    </div>

                    <div id="metric-monthly-repayment" className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Est. Monthly Installment</p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(estMonthlyInstallment)} / mo</p>
                      <p className="text-xs text-slate-500 mt-1">25-year tenure (can use joint CPF OA)</p>
                    </div>

                    <div id="metric-recommended-income" className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-xs font-medium text-slate-500 mb-1">Recommended Joint Income</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(estRecommendedCombinedIncome)} / mo</p>
                      <p className="text-xs text-slate-500 mt-1">Based on 30% Mortgage Servicing Ratio</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Informative Couple Guidance Notes */}
        <section id="couple-notes" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Important Context for First-Time Buyers
          </h2>
          <ul className="text-xs sm:text-sm text-slate-600 space-y-2 leading-relaxed list-disc list-inside">
            <li>
              Resale prices reflect actual transacted contracts registered with the Housing &amp; Development Board in the stated month.
            </li>
            <li>
              Eligible first-timer couples can apply for CPF Housing Grants up to $80,000, Enhanced CPF Housing Grants (EHG) up to $80,000, and Proximity Housing Grants (PHG) up to $30,000.
            </li>
            <li>
              Individual flat prices in {townDisplay} vary based on remaining lease, storey level, block age, and distance to transit or town hubs.
            </li>
          </ul>
        </section>
      </main>

      {/* Footer with exact required licence credit and link */}
      <footer id="app-footer" className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-xs text-slate-500 leading-relaxed text-center sm:text-left">
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
