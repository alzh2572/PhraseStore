export type DbProfile = "local" | "remote";

export type ColumnMeta = {
  name: string;
  dataType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  hasDefault: boolean;
};

export type TableRowsResponse = {
  table: string;
  columns: ColumnMeta[];
  rows: Record<string, unknown>[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type DbProfileInfo = {
  id: DbProfile;
  label: string;
  available: boolean;
  hint?: string;
};
