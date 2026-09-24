import { FichaSpeaker } from "./_ficha";

type Props = { params: Promise<{ slug: string }> };

/**
 * La ficha de un speaker, con su propia dirección para poder compartirla.
 */
export default async function SpeakerPage({ params }: Props) {
  const { slug } = await params;
  return <FichaSpeaker slug={slug} />;
}
