import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next 16: el antiguo `middleware.ts` se renombró a `proxy.ts`.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Solo corre sobre el backoffice; la landing pública (/ y /v2) queda intacta.
  matcher: ["/app/:path*"],
};
