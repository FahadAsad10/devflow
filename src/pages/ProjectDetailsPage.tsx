import { Link, useParams } from "react-router-dom";
import { initialProjects } from "../data/projects";

function ProjectDetailsPage() {
  const { id } = useParams();
  const project = initialProjects.find((item) => item.id === id);

  if (!project) {
    return (
      <section className="page error-page">
        <p className="dashboard-label">PROJECT</p>
        <h1>Project not found</h1>
        <p className="page-description">The project may have been removed or the link is invalid.</p>
        <Link className="button-primary inline-button" to="/projects">Back to projects</Link>
      </section>
    );
  }

  const progress = project.tasksTotal === 0
    ? 0
    : Math.round((project.tasksCompleted / project.tasksTotal) * 100);

  return (
    <section className="page">
      <Link className="back-link" to="/projects">← Back to projects</Link>
      <div className="detail-header">
        <div>
          <p className="dashboard-label">PROJECT</p>
          <h1>{project.name}</h1>
          <p className="page-description">{project.description}</p>
        </div>
        <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
      </div>

      <div className="detail-grid">
        <article className="detail-card">
          <span>Progress</span>
          <strong>{progress}%</strong>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
        </article>
        <article className="detail-card">
          <span>Tasks</span>
          <strong>{project.tasksCompleted}/{project.tasksTotal}</strong>
          <small>completed</small>
        </article>
        <article className="detail-card">
          <span>Team</span>
          <strong>{project.members}</strong>
          <small>members</small>
        </article>
        <article className="detail-card">
          <span>Due date</span>
          <strong>{new Date(project.dueDate).toLocaleDateString()}</strong>
          <small>target date</small>
        </article>
      </div>

      <div className="detail-panel">
        <h2>Project workspace</h2>
        <p>Tasks, comments, files, members, and activity will be connected to the API in the backend phase.</p>
      </div>
    </section>
  );
}

export default ProjectDetailsPage;
