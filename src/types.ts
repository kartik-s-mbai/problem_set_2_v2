export interface ResaleData {
  town: string;
  flatType: string;
  month: string | null;
  medianPrice: number | null;
  count: number;
}

export type FetchStatus = 'loading' | 'success' | 'empty' | 'refused' | 'unreachable';
