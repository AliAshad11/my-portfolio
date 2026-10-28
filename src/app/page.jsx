import Hero from "@/components/Hero";
import { Marquee, Services, Process, Experience } from "@/components/Sections";
import SkillsSection from "@/components/SkillsSection";
import ProjectsSection from "@/components/ProjectsSection";
import Contact from "@/components/Contact";

/* One-page site: every section has an id the navbar scrolls to. */
export default function Home() {
  return (
    <main>
      <Hero />
      <Marquee />
      <Services />
      <SkillsSection />
      <ProjectsSection />
      <Process />
      <Experience />
      <Contact />
    </main>
  );
}
