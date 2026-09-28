import { Link } from "react-router-dom";
import StatCard from "./StatCard";
import ProjectCard from "./ProjectCard";
import { initialProjects } from "../data/projects";

function Dashboard() {
  const activeTasks = initialProjects.reduce((total, project) => total + project.tasksTotal - project.tasksCompleted, 0);
  const completed = initialProjects.reduce((total, project) => total + project.tasksCompleted, 0);

  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-label">OVERVIEW</p>
          <h1>Dashboard</h1>
          <p className="dashboard-description">Plan, track, and ship your development work.</p>
        </div>
        <Link className="button-primary inline-button" to="/projects">+ New Project</Link>
      </div>

      <div className="stats-grid">
        <StatCard title="Total Projects" value={initialProjects.length} />
        <StatCard title="Active Tasks" value={activeTasks} />
        <StatCard title="Completed" value={completed} />
        <StatCard title="Team Members" value={initialProjects.reduce((total, project) => total + project.members, 0)} />
      </div>

      <div className="projects-section">
        <div className="section-header">
          <div>
            <h2>Your Projects</h2>
            <p>Manage and track your current projects.</p>
          </div>
          <Link className="view-all-button" to="/projects">View all</Link>
        </div>

        <div className="projects-grid">
          {initialProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
