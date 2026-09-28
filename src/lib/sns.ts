import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";

const region = process.env.AWS_REGION || "us-east-1";
const topicArn =
  process.env.SNS_REGISTRATIONS_TOPIC_ARN ||
  "arn:aws:sns:us-east-1:339713179154:scd-mexico-registrations";

let snsClient: SNSClient | null = null;

function getClient(): SNSClient {
  if (!snsClient) {
    snsClient = new SNSClient({ region });
  }
  return snsClient;
}

export interface RegistrationNotificationData {
  name: string;
  email: string;
  attendance?: string;
  qrCode: string;
  role?: string;
  entityName?: string;
}

/**
 * Publica una notificación en el SNS Topic de AWS cuando un asistente se registra.
 * Permite que los organizadores reciban alertas automáticas e integra con la arquitectura serverless.
 */
export async function notifyNewRegistration(data: RegistrationNotificationData): Promise<{ messageId?: string; error?: string }> {
  try {
    const client = getClient();
    const subject = `[AWS SCD México] Nuevo Registro: ${data.name}`;
    const message = [
      `🎉 ¡Nuevo asistente registrado en AWS Student Community Day México 2026!`,
      ``,
      `• Nombre: ${data.name}`,
      `• Correo: ${data.email}`,
      `• Modalidad: ${data.attendance === "online" ? "Virtual / Online" : "Presencial (IPN CDMX)"}`,
      `• Rol: ${data.role || "No especificado"}`,
      `• Institución / Empresa: ${data.entityName || "No especificada"}`,
      `• Código QR / ID: ${data.qrCode}`,
      `• Fecha: ${new Date().toLocaleString("es-MX", { timeZone: "America/Mexico_City" })} (Hora CDMX)`,
      ``,
      `Consulta el panel de control: https://studentcommunitydaymexico.com/admin/registrations`,
    ].join("\n");

    const command = new PublishCommand({
      TopicArn: topicArn,
      Subject: subject.slice(0, 100), // SNS subject límite 100 caracteres
      Message: message,
    });

    const response = await client.send(command);
    return { messageId: response.MessageId };
  } catch (err) {
    console.error("[SNS] Error publicando registro:", err);
    return { error: (err as Error).message };
  }
}
