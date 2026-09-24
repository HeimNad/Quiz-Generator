import { notFound } from "next/navigation";
import { QuizEditor } from "@/components/quiz/QuizEditor";
import { getPresetById, PRESETS } from "@/lib/presets";

export function generateStaticParams() {
  return PRESETS.map((p) => ({ id: p.id }));
}

export default async function QuizEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!getPresetById(id)) notFound();
  return <QuizEditor presetId={id} />;
}
