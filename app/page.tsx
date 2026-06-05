import { MnemoApp } from "@/components/MnemoApp";
import { seedDecisions } from "@/lib/seed-decisions";

export default function Home() {
  return <MnemoApp initialDecisions={seedDecisions} />;
}
