import { getActiveFaqs } from "@/lib/data/faq";
import { FAQView } from "./faq";

// Server Component: trae las FAQs en el servidor (cacheadas) y las pasa a la vista.
export async function FAQ() {
  // Si la DB falla, FAQView cae a su contenido estático en vez de tirar la página
  const faqs = await getActiveFaqs().catch(() => []);
  return <FAQView faqs={faqs} />;
}
