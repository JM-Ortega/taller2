export type ApiErrorDetail = Readonly<{
  field: string;
  message: string;
}>;

export type ApiErrorResponse = Readonly<{
  code: string;
  message: string;
  details?: readonly ApiErrorDetail[];
}>;
