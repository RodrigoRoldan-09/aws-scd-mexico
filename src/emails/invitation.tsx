import { Text } from "@react-email/components";
import {
  C,
  Callout,
  DetailBox,
  Divider,
  EmailLayout,
  HardButton,
  Heading,
  Kicker,
  MONO,
  Paragraph,
} from "./_kit";
import { SITE_HOST } from "@/lib/constants";

interface InvitationEmailProps {
  name: string;
  role: string;
  createPasswordUrl: string;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  organizer: "Organizador",
  volunteer: "Voluntario",
  badges: "Entrega de badges",
  register: "Registro",
};

export function InvitationEmail({ name, role, createPasswordUrl }: InvitationEmailProps) {
  const firstName = name ? name.split(" ")[0] : "";
  const roleLabel = roleLabels[role] || role;

  return (
    <EmailLayout
      preview="Tu cuenta del panel está lista — crea tu contraseña"
      strip="ACCESO AL PANEL ·"
    >
      <Kicker>cuenta creada</Kicker>
      <Heading>{firstName ? `Bienvenido/a, ${firstName}.` : "Tu cuenta está lista."}</Heading>

      <Paragraph>
        Te creamos una cuenta en el panel del AWS Student Community Day México 2026.
        Falta un paso: definir tu contraseña.
      </Paragraph>

      <DetailBox
        rows={[
          { label: "Nombre", value: name },
          { label: "Rol", value: roleLabel },
          { label: "Panel", value: `${SITE_HOST}/admin` },
        ]}
      />

      <HardButton href={createPasswordUrl}>Crear mi contraseña</HardButton>

      <Callout title="importante">
        Este enlace es de un solo uso y caduca. Si expira, pídele a un
        administrador que te reenvíe la invitación.
      </Callout>

      <Divider />

      <Paragraph muted>
        Si el botón no abre, copia y pega este enlace en tu navegador:
      </Paragraph>
      <Text
        style={{
          margin: "0 0 16px",
          fontFamily: MONO,
          fontSize: "12px",
          lineHeight: "1.6",
          color: C.block,
          wordBreak: "break-all",
        }}
      >
        {createPasswordUrl}
      </Text>

      <Paragraph muted>
        ¿No esperabas este correo? Ignóralo — sin crear la contraseña, la cuenta
        no se activa.
      </Paragraph>
    </EmailLayout>
  );
}

export default InvitationEmail;
