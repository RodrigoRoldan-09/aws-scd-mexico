import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SurveyRecipient } from "@/models/survey-recipient";

export const dynamic = "force-dynamic";

const SURVEY_URL = "https://pulse.aws/survey/DCWWCOS7";

// Registra el clic del destinatario y redirige a la encuesta de AWS.
// Si el token no existe, igual redirige (nunca bloqueamos al usuario).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    if (token) {
      await connectDB();
      // clickCount siempre suma; clickedAt se fija solo en el PRIMER clic.
      // Updates planos (sin pipeline ni $$NOW) para que Mongoose los aplique seguro.
      await SurveyRecipient.updateOne({ token }, { $inc: { clickCount: 1 } });
      await SurveyRecipient.updateOne({ token, clickedAt: null }, { $set: { clickedAt: new Date() } });
    }
  } catch { /* el tracking nunca rompe la redirección */ }
  return NextResponse.redirect(SURVEY_URL, 302);
}
