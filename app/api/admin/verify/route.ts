import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pin } = body;

    const validPin = process.env.ADMIN_PIN || "2026";

    if (!pin || typeof pin !== "string" || pin.trim() !== validPin.trim()) {
      return NextResponse.json(
        { success: false, error: "PIN de administración incorrecto" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Acceso administrativo concedido",
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Error en el servidor al verificar credenciales" },
      { status: 500 }
    );
  }
}
