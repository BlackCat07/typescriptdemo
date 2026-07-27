export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'HttpError'
  }
}

export const errors = {
  notFound: (what: string) => new HttpError(404, `${what} not found`),
  forbidden: () => new HttpError(403, 'Forbidden'),
  unauthorized: () => new HttpError(401, 'Unauthorized'),
  badRequest: (msg: string) => new HttpError(400, msg),
  conflict: (msg: string) => new HttpError(409, msg),
}
