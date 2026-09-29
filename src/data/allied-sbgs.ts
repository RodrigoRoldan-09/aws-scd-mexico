import type { Community } from "@/types";

/**
 * AWS Student Builder Groups que co-organizan el evento. Se muestran en el
 * carrusel de "Comunidades Organizadoras", arriba del equipo organizador.
 *
 * `category` lleva el nombre oficial de la universidad y `badge` la clave del
 * estado. Los logos viven en `public/images/sbg/` (fuente original en `docs/`).
 */
export const alliedSBGs: Community[] = [
  {
    id: "sbg-uaeh",
    name: "AWS SBG UAEH",
    category: "Universidad Autónoma del Estado de Hidalgo",
    badge: "HGO",
    logo: "/images/sbg/uaeh.webp",
    social: {
      instagram: "https://www.instagram.com/aws.uaeh",
    },
  },
  {
    id: "sbg-upaep",
    name: "AWS SBG UPAEP",
    category: "Universidad Popular Autónoma del Estado de Puebla",
    badge: "PUE",
    logo: "/images/sbg/upaep.webp",
    social: {
      instagram: "https://www.instagram.com/aws_sbg_upaep",
    },
  },
  {
    id: "sbg-uveg",
    name: "AWS SBG UVEG",
    category: "Universidad Virtual del Estado de Guanajuato",
    badge: "GTO",
    logo: "/images/sbg/uveg.webp",
    social: {
      linkedin: "https://www.linkedin.com/in/aws-student-builder-group-uveg/",
      instagram: "https://www.instagram.com/aws.sbg.uveg/",
    },
  },
  {
    id: "sbg-buap",
    name: "AWS SBG BUAP",
    category: "Benemérita Universidad Autónoma de Puebla",
    badge: "PUE",
    logo: "/images/sbg/buap.webp",
    social: {
      instagram: "https://www.instagram.com/aws.buap/",
    },
  },
  {
    id: "sbg-univa",
    name: "AWS SBG UNIVA",
    category: "Universidad del Valle de México",
    badge: "JAL",
    logo: "/images/sbg/univa.webp",
    social: {
      instagram: "https://www.instagram.com/aws.univa/",
      linkedin: "https://www.linkedin.com/company/aws-student-builder-group-at-univa/",
    },
  },
  {
    id: "sbg-UMAD",
    name: "AWS SBG UMAD",
    category: "Universidad Madero",
    badge: "PUE",
    logo: "/images/sbg/umad.webp",
    social: {
      instagram: "https://www.instagram.com/aws.umad/",

    },
  },
  {
    id: "sbg-IPN",
    name: "AWS SBG IPN",
    category: "Instituto Politécnico Nacional",
    badge: "CDMX",
    logo: "/images/sbg/ipn_zac.webp",
    social: {
      instagram: "https://www.instagram.com/awsclub.ipn/",

    },
  },
];
