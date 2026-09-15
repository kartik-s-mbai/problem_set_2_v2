export interface ResaleData {
  town: string;
  flatType: string;
  month: string | null;
  medianPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  medianPricePerSqm: number | null;
  medianRemainingLeaseYears: number | null;
  count: number;
}

export type FetchStatus = 'loading' | 'success' | 'empty' | 'refused' | 'unreachable';
