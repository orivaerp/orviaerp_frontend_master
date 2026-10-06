/** Returned by the API as `meta` on paginated list responses. */
export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Sent to the API as `?page=&limit=`. Leave undefined to get the full, unpaginated list. */
export interface PageParams {
  page: number;
  limit: number;
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Adds page/limit to a query-string builder when pagination is requested. */
export function appendPageParams(params: URLSearchParams, page?: PageParams): void {
  if (!page) return;
  params.set('page', String(page.page));
  params.set('limit', String(page.limit));
}
