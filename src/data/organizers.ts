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
    id: "grace-rojas",
    name: "Grace Rojas",
    role: "Coordinación General",
    country: "MX",
    aws: true,
    photo: "/images/equipo/grace.jpeg",
    social: {
      awsBuilder: "https://builder.aws.com/community/@roojasg009?tab=badges",
      linkedin: "https://www.linkedin.com/in/grace-estibaliz-rojas-garcia-a82797336/",
      instagram: "https://www.instagram.com/rg_gracee/",
    },
  },
  {
    id: "jonathan-sanchez",
    name: "Jonathan Sanchez",
    role: "Support Lead",
    country: "MX",
    aws: true,
    photo: "/images/equipo/jonathan.jpeg",
    social: {
      awsBuilder: "https://builder.aws.com/community/@jofer2005?tab=badges",
      linkedin: "https://www.linkedin.com/in/sanchez-cabello-jonathan-fernando-a41a30291/",
      github: "https://github.com/Jonathan-FSanchez",
      instagram: "https://www.instagram.com/jofec_ds/",
    },
  },
  {
    id: "ruben-silva",
    name: "Ruben Silva",
    role: "Website Dev",
    country: "MX",
    aws: true,
    photo: "/images/equipo/ruben.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/ruben-silva-lucio-a803b324b",
      github: "https://github.com/Taquit",
      instagram: "https://www.instagram.com/ruben_silvalucio?stkn=NDVyZ2JjZXlpam42",
    },
  },
  {
    id: "rodrigo-roldan",
    name: "Rodrigo Roldan",
    role: "Content & Speakers Lead",
    country: "MX",
    aws: true,
    // Foto anterior preservada: "/images/equipo/rod_roldan.jpeg"
    photo: "/images/equipo/rod_roldan_new.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/rodrigo-rold%C3%A1n-575a16409/",
      github: "https://github.com/RodrigoRoldan-09",
      instagram: "https://www.instagram.com/rodes_roldan/",
      awsBuilder: "https://builder.aws.com/community/@rodes?tab=badges"
    },
  },
  {
    id: "alexa-yathana",
    name: "Alexa Yathana",
    role: "Public Relations Lead",
    country: "MX",
    aws: true,
    photo: "/images/equipo/alexa.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/alexa-joaquin-50769026b/",
      instagram: "https://www.instagram.com/alexa.yathana?stkn=Y3B3cXJhcHNscTV4",
    },
  },
  {
    id: "rodrigo-ramirez",
    name: "Rodrigo Ramirez",
    role: "Administrative",
    country: "MX",
    aws: true,
    photo: "/images/equipo/rod_ramirez.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/raar225",
      github: "https://github.com/Rod0225",
      instagram: "https://www.instagram.com/rodrigoramirez6178/",
    },
  },
  {
    id: "irving-soriano",
    name: "Irving Soriano",
    role: "Promotion Lead",
    country: "MX",
    aws: true,
    photo: "/images/equipo/irving.jpeg",
    social: {
      linkedin: "https://www.linkedin.com/in/irving-soriano/",
      instagram: "https://www.instagram.com/mind_0t/",
      awsBuilder: "https://builder.aws.com/community/@irvinsoriano?tab=badges",
    },
  },
  {
    id: "lizette-cruz",
    name: "Lizette Cruz",
    role: "Content Creator",
    country: "MX",
    aws: true,
    photo: "/images/equipo/meme.jpeg",
    social: {},
  },
];
