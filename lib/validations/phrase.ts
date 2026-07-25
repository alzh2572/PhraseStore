import { z } from "zod";

export const phraseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Укажите заголовок")
    .max(200, "Максимум 200 символов"),
  content: z
    .string()
    .trim()
    .min(1, "Укажите текст")
    .max(10_000, "Максимум 10 000 символов"),
  isPublic: z.boolean().default(false),
});

export const phraseIdSchema = z.object({
  id: z.string().min(1),
});

export type PhraseFormValues = z.infer<typeof phraseFormSchema>;
