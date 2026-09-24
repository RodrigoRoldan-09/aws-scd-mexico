import type { Organizer } from "@/types";

/**
 * Equipo organizador. El orden se respeta tal cual en la sección.
 * POR CONFIRMAR: hoy lista al equipo de la edición de Chile; reemplazar por
 * el de México.
 *
 * `photo` vacío hace que la tarjeta muestre la carita de DiceBear sembrada
 * con el `id`, la misma que sale en el pasaporte.
 */
export const organizers: Organizer[] = [
  {
    id: "belen-varela",
    name: "Belén Varela",
    role: "SBG Duoc UC — Maipú",
    country: "CL",
    aws: true,
    photo: "",
    social: {
      awsBuilder: "https://builder.aws.com/community/@bell",
      linkedin: "https://www.linkedin.com/in/bel%C3%A9n-varela-frick-240775370/",
    },
  },
  {
    id: "andrea-rosero",
    name: "Andrea Rosero",
    role: "SBG Duoc UC — Virtual Campus",
    country: "CL",
    aws: true,
    photo: "",
    social: {
      awsBuilder: "https://builder.aws.com/community/@andreadigital",
      linkedin: "https://www.linkedin.com/in/andrearoseroperez/",
      instagram: "https://www.instagram.com/andreaendigital/",
    },
  },
  {
    id: "sebastian-acuna",
    name: "Sebastián Acuña",
    role: "Student Builder Group Leader",
    country: "CO",
    aws: true,
    photo: "",
    social: {
      awsBuilder: "https://builder.aws.com/community/@sebitas",
      linkedin: "https://www.linkedin.com/in/sebastian-acu%C3%B1a/",
      github: "https://github.com/heysebitas",
      instagram: "https://instagram.com/justsebitas",
    },
  },
];
