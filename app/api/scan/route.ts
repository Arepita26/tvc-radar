import { NextRequest, NextResponse } from "next/server";
import { scanNews } from "@/lib/scanner";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function sanitizeToken(token?: string | null): string | undefined {
  if (!token) return undefined;
  const trimmed = token.trim();
  if (
    trimmed === "" ||
    trimmed.toLowerCase() === "null" ||
    trimmed.toLowerCase() === "undefined"
  ) {
    return undefined;
  }
  return trimmed;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawHours = searchParams.get("hours");
    const parsedHours = rawHours ? parseInt(rawHours, 10) : 24;

    const validTimeframes = [1, 2, 3, 6, 12, 24, 48];
    const hours = validTimeframes.includes(parsedHours) ? parsedHours : 24;

    // Sanitize headers and cookies
    const rawHeaderAuth = request.headers.get("x-auth-token");
    const rawHeaderCt0 = request.headers.get("x-ct0");
    const rawCookieAuth = request.cookies.get("tvc_x_auth")?.value;
    const rawCookieCt0 = request.cookies.get("tvc_x_ct0")?.value;

    const headerAuth = sanitizeToken(rawHeaderAuth);
    const headerCt0 = sanitizeToken(rawHeaderCt0);
    const cookieAuth = sanitizeToken(rawCookieAuth);
    const cookieCt0 = sanitizeToken(rawCookieCt0);

    // Prioritize valid provided headers, else fallback strictly to process.env
    const effectiveAuthToken =
      headerAuth ||
      cookieAuth ||
      sanitizeToken(process.env.X_AUTH_TOKEN) ||
      sanitizeToken(process.env.TWITTER_AUTH_TOKEN);

    const effectiveCt0 =
      headerCt0 ||
      cookieCt0 ||
      sanitizeToken(process.env.X_CT0) ||
      sanitizeToken(process.env.TWITTER_CT0);

    const rawForce = searchParams.get("force");
    const forceRefresh = rawForce === "true" || rawForce === "1";

    console.log(
      `[TVC Radar - API] Escaneando con ventana: ${hours}h | Force: ${forceRefresh} | Sesión X: ${
        effectiveAuthToken && effectiveCt0 ? "PRESENTE" : "AUSENTE"
      }`
    );

    const result = await scanNews(
      hours,
      {
        authToken: effectiveAuthToken,
        ct0: effectiveCt0,
      },
      forceRefresh
    );

    const response = NextResponse.json({
      success: true,
      data: result,
    });

    response.headers.set(
      "X-Cache-Status",
      result.isFromCache ? "HIT" : "MISS"
    );

    return response;
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Error al procesar el escaneo de fuentes informativas";
    console.error("[TVC Radar - API Error]", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
