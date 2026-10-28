import SectionHead from "./SectionHead";
import Reveal from "./Reveal";
import ProjectsSlider from "./ProjectsSlider";

export default function ProjectsSection() {
  return (
    <section id="projects" className="section projects-section">
      <div className="container">
        <SectionHead
          tag="Projects"
          title="Selected"
          accent="client work"
          sub="Live websites I designed and built. Click a project to visit it, or open the details for the full story."
          center
        />
        <Reveal delay={0.1}>
          <ProjectsSlider />
        </Reveal>
      </div>
    </section>
  );
}
