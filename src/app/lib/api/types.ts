export type ApiEnvelope<T> = {
  statusCode: number;
  content: T;
  dateTime: string;
};

export type PaginatedData<T> = {
  pageIndex: number;
  pageSize: number;
  totalRow: number;
  keywords: string | null;
  data: T[];
};

export type PaginationParams = {
  pageIndex?: number;
  pageSize?: number;
  keyword?: string;
};
