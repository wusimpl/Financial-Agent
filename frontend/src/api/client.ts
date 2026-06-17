import type {
  ApiErrorResponse,
  ChartRange,
  ChartResponse,
  DashboardResponse,
  FilingDocumentResponse,
  FilingSummary,
  FinancialHistoryResponse,
  SocialPostsResponse,
  SocialSort,
  StockOverviewResponse,
  StockSearchItem,
  WatchlistItem,
} from './backendTypes';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type QueryValue = string | number | boolean | null | undefined;

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${base}${normalizedPath}`, window.location.origin);

  Object.entries(query || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

async function readError(response: Response) {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>;
    return {
      code: body.error,
      message: body.message || body.error || `请求失败：${response.status}`,
    };
  } catch {
    return {
      code: undefined,
      message: `请求失败：${response.status}`,
    };
  }
}

async function request<T>(path: string, query?: Record<string, QueryValue>, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(buildUrl(path, query), {
      headers: {
        Accept: 'application/json',
        ...init?.headers,
      },
      ...init,
    });
  } catch {
    throw new ApiError('无法连接到数据服务', 0);
  }

  if (!response.ok) {
    const error = await readError(response);
    throw new ApiError(error.message, response.status, error.code);
  }

  return (await response.json()) as T;
}

export const api = {
  health() {
    return request<{ status: string }>('/health');
  },

  dashboard(ticker: string, options?: { range?: ChartRange; socialSort?: SocialSort }) {
    return request<DashboardResponse>(`/dashboard/${ticker}`, {
      range: options?.range,
      social_sort: options?.socialSort,
    });
  },

  watchlist() {
    return request<WatchlistItem[]>('/stocks/watchlist');
  },

  stockOverview(ticker: string) {
    return request<StockOverviewResponse>(`/stocks/${ticker}/overview`);
  },

  searchStocks(query: string, limit = 10) {
    return request<StockSearchItem[]>('/stocks/search', { query, limit });
  },

  chart(ticker: string, range: ChartRange) {
    return request<ChartResponse>(`/charts/${ticker}`, { range });
  },

  secDocumentByYear(ticker: string, year: number, filingType: string) {
    return request<FilingDocumentResponse>(`/sec/${ticker}/document-by-year`, {
      year,
      type: filingType,
    });
  },

  secDocumentHtmlByYearUrl(ticker: string, year: number, filingType: string) {
    return buildUrl(`/sec/${ticker}/document-html-by-year`, {
      year,
      type: filingType,
    });
  },

  secFilings(ticker: string, options?: { year?: number; filingType?: string; limit?: number }) {
    return request<FilingSummary[]>(`/sec/${ticker}/filings`, {
      year: options?.year,
      type: options?.filingType,
      limit: options?.limit,
    });
  },

  financialHistory(ticker: string) {
    return request<FinancialHistoryResponse>(`/financials/${ticker}/history`);
  },

  socialPosts(ticker: string, sort: SocialSort) {
    return request<SocialPostsResponse>(`/social/${ticker}/posts`, { sort });
  },
};
