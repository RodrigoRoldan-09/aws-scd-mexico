import type { FAQItem } from "@/types";

export const faqItems: FAQItem[] = [
  { id: "1", questionKey: "q1", answerKey: "a1" },
  { id: "2", questionKey: "q2", answerKey: "a2" },
  {
    id: "3",
    questionKey: "q3",
    answerKey: "a3",
    buttons: [{ labelKey: "btn_register", url: "/registro" }],
  },
  { id: "4", questionKey: "q4", answerKey: "a4" },
  { id: "5", questionKey: "q5", answerKey: "a5" },
  {
    id: "6",
    questionKey: "q6",
    answerKey: "a6",
    buttons: [
      {
        labelKey: "btn_venue",
        url: "https://maps.google.com/?q=Centro+Hist%C3%B3rico+y+Cultural+Juan+de+Dios+B%C3%A1tiz+Manuel+Carpio+Agricultura+Miguel+Hidalgo+11360+CDMX",
      },
    ],
  },
  { id: "7", questionKey: "q7", answerKey: "a7" },
  { id: "8", questionKey: "q8", answerKey: "a8" },
  {
    id: "9",
    questionKey: "q9",
    answerKey: "a9",
    buttons: [{ labelKey: "btn_speakers", url: "/speakers/postular" }],
  },
  {
    id: "10",
    questionKey: "q10",
    answerKey: "a10",
    buttons: [{ labelKey: "btn_volunteers", url: "/voluntarios" }],
  },
  {
    id: "11",
    questionKey: "q11",
    answerKey: "a11",
    buttons: [{ labelKey: "btn_communities", url: "/comunidades" }],
  },
  {
    id: "12",
    questionKey: "q12",
    answerKey: "a12",
    buttons: [{ labelKey: "btn_sponsors", url: "/sponsors" }],
  },
];

