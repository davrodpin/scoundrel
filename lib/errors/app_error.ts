export class AppError extends Error {
  readonly reason: string;
  readonly statusCode: number;
  readonly data: Record<string, unknown>;

  constructor(
    reason: string,
    statusCode: number,
    data: Record<string, unknown> = {},
  ) {
    super(reason);
    this.name = "AppError";
    this.reason = reason;
    this.statusCode = statusCode;
    this.data = data;
  }
}
