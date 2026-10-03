import { Header } from "@/components/vibefix/header";
import { Hero } from "@/components/vibefix/hero";
import { StatsSection } from "@/components/vibefix/stats-section";
import { DiagnosticWizard } from "@/components/vibefix/diagnostic-wizard";
import { GithubSection } from "@/components/vibefix/github-section";
import { IncomeSection } from "@/components/vibefix/income-section";
import { TranslatorSection } from "@/components/vibefix/translator-section";
import { WeeklySection } from "@/components/vibefix/weekly-section";
import { SolutionsExplorer } from "@/components/vibefix/solutions-explorer";
import { ReposSection } from "@/components/vibefix/repos-section";
import { Methodology } from "@/components/vibefix/methodology";
import { Footer } from "@/components/vibefix/footer";

export default function Home() {
  return (
    <div
      id="top"
      className="flex min-h-screen flex-1 flex-col bg-zinc-950 text-zinc-100"
    >
      <Header />
      <main className="flex-1">
        <Hero />
        <StatsSection />
        <DiagnosticWizard />
        <GithubSection />
        <IncomeSection />
        <TranslatorSection />
        <WeeklySection />
        <SolutionsExplorer />
        <ReposSection />
        <Methodology />
      </main>
      <Footer />
    </div>
  );
}
