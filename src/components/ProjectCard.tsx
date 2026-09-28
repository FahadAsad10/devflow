import { Link } from "react-router-dom";
import type { Project } from "../types/project";

type ProjectCardProps = {
  project: Project;
};

function ProjectCard({ project }: ProjectCardProps) {
  const progress = project.tasksTotal
    ? Math.round((project.tasksCompleted / project.tasksTotal) * 100)
    : 0;

  return (
    <article className="project-card">
      <div className="project-icon">{project.name.charAt(0)}</div>
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="project-footer">
        <span>{progress}% · {project.tasksCompleted}/{project.tasksTotal} tasks</span>
        <Link className="view-button" to={`/projects/${project.id}`}>View</Link>
      </div>
    </article>
  );
}

export default ProjectCard;
