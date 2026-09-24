import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/db";
import { FAQ } from "@/models/faq";

export const FAQ_TAG = "faq";

export type FaqDTO = {
  _id: string;
  questionEs: string;
  answerEs: string;
  questionEn: string;
  answerEn: string;
  order: number;
  isActive: boolean;
  buttons?: { labelEs: string; labelEn: string; url: string }[];
};

// FAQs activas, cacheadas (invalida con revalidateTag(FAQ_TAG)).
export const getActiveFaqs = unstable_cache(
  async (): Promise<FaqDTO[]> => {
    await connectDB();
    const faqs = await FAQ.find({ isActive: true }).sort({ order: 1 }).lean<Record<string, unknown>[]>();
    return faqs.map((f) => ({
      _id: String(f._id),
      questionEs: (f.questionEs as string) ?? "",
      answerEs: (f.answerEs as string) ?? "",
      questionEn: (f.questionEn as string) ?? "",
      answerEn: (f.answerEn as string) ?? "",
      order: (f.order as number) ?? 0,
      isActive: Boolean(f.isActive),
      buttons: Array.isArray(f.buttons)
        ? (f.buttons as Record<string, unknown>[]).map((b) => ({
            labelEs: (b.labelEs as string) ?? "",
            labelEn: (b.labelEn as string) ?? "",
            url: (b.url as string) ?? "",
          }))
        : [],
    }));
  },
  ["active-faqs"],
  { tags: [FAQ_TAG], revalidate: 300 },
);
