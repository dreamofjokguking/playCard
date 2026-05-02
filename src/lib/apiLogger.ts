import { NextRequest, NextResponse } from 'next/server';

type Handler = (request: NextRequest) => Promise<NextResponse>;

export function withApiLogging(handler: Handler, route: string) {
  return async function wrapped(request: NextRequest): Promise<NextResponse> {
    const startedAt = Date.now();
    const response = await handler(request);
    const elapsed = Date.now() - startedAt;
    const enabled = process.env.API_LOGGING !== 'false';

    if (enabled) {
      // Keep log shape simple for now. This is enough for bootstrap validation.
      console.info(`[API] ${request.method} ${route} ${response.status} ${elapsed}ms`);
    }

    return response;
  };
}
