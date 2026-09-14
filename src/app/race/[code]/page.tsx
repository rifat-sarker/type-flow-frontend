import { RaceTrack } from "@/components/Race/RaceTrack";

export default function RacePage({ params }: { params: { code: string } }) {
  return <RaceTrack code={params.code.toUpperCase()} />;
}
