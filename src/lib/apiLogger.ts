import { NextRequest, NextResponse } from 'next/server';

type Handler<TArgs extends unknown[] = []> = (
  request: NextRequest,
  ...args: TArgs
) => Promise<NextResponse>;

export function withApiLogging<TArgs extends unknown[]>(
  handler: Handler<TArgs>,
  route: string
) {
  return async function wrapped(
    request: NextRequest,
    ...args: TArgs
  ): Promise<NextResponse> {
    const startedAt = Date.now();
    const response = await handler(request, ...args);
    const elapsed = Date.now() - startedAt;
    const enabled = process.env.API_LOGGING !== 'false';

    if (enabled) {
      // Keep log shape simple for now. This is enough for bootstrap validation.
      console.info(`[API] ${request.method} ${route} ${response.status} ${elapsed}ms`);
    }

    return response;
  };
}
