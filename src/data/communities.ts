import type { Community } from "@/types";

/**
 * Comunidades aliadas y colaboradoras del evento.
 * Se muestran como tarjetas en la sección de Comunidades del landing.
 */
export const communities: Community[] = [
  {
    id: "sbg-ipn-cdmx",
    name: "AWS Student Builder Group IPN CDMX",
    category: "Organizador Principal",
    badge: "Host",
    description: "Comunidad estudiantil oficial de AWS en el Instituto Politécnico Nacional.",
    logo: "/images/logos/logo-sbg-cdmx.png",
    social: {
      instagram: "https://www.instagram.com/rg_gracee/",
      linkedin: "https://www.linkedin.com/in/grace-estibaliz-rojas-garcia-a82797336/",
    },
  },
  {
    id: "aws-user-group-mexico",
    name: "AWS User Group México",
    category: "Comunidad Oficial AWS",
    badge: "User Group",
    description: "Comunidad abierta de profesionales, arquitectos y desarrolladores cloud en México.",
    logo: "/images/logos/aws-logo.png",
    url: "https://aws.amazon.com/developer/community/",
    social: {
      meetup: "https://www.meetup.com/aws-ug-mexico/",
      linkedin: "https://www.linkedin.com",
    },
  },
  {
    id: "cloud-native-cdmx",
    name: "Cloud Native CDMX",
    category: "Ecosistema Cloud",
    badge: "Cloud Native",
    description: "Comunidad enfocada en Kubernetes, microservicios y arquitectura cloud native.",
    logo: "/images/logos/cb-logo.png",
    social: {
      meetup: "https://www.meetup.com",
      linkedin: "https://www.linkedin.com",
    },
  },
  {
    id: "sbg-mexico-network",
    name: "AWS Student Builder Groups México",
    category: "Red Estudiantil Universitaria",
    badge: "Students",
    description: "Red nacional de estudiantes universitarios construyendo proyectos e impulsando cloud.",
    logo: "/images/logos/sbg-icon-orange.png",
    social: {
      meetup: "https://community.aws/students",
    },
  },
];
