import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "./StatCard";
import ProjectCard from "./ProjectCard";
import { api, type ApiProject } from "../lib/api";

function Dashboard() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.projects()
      .then((response) => setProjects(response.projects))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load projects."))
      .finally(() => setLoading(false));
  }, []);

  const activeTasks = projects.reduce((total, project) => total + (project._count?.tasks ?? 0), 0);
  const completedProjects = projects.filter((project) => project.status === "COMPLETED").length;
  const teamMembers = new Set(
    projects.flatMap((project) => project.memberships?.map((membership) => membership.user.id) ?? []),
  ).size;

  const cards = projects.slice(0, 3).map((project) => ({
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status === "PLANNING" ? "Planning" as const : project.status === "ACTIVE" ? "Active" as const : "Completed" as const,
    dueDate: project.dueDate ?? new Date().toISOString(),
    tasksTotal: project._count?.tasks ?? 0,
    tasksCompleted: project.tasks?.filter((task) => task.status === "DONE").length ?? 0,
    members: project._count?.memberships ?? 0,
  }));

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

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="stats-grid">
        <StatCard title="Total Projects" value={loading ? "—" : projects.length} />
        <StatCard title="Active Tasks" value={loading ? "—" : activeTasks} />
        <StatCard title="Completed Projects" value={loading ? "—" : completedProjects} />
        <StatCard title="Team Members" value={loading ? "—" : teamMembers} />
      </div>

      <div className="projects-section">
        <div className="section-header">
          <div>
            <h2>Your Projects</h2>
            <p>Manage and track your current projects.</p>
          </div>
          <Link className="view-all-button" to="/projects">View all</Link>
        </div>

        {loading ? (
          <div className="empty-state"><h2>Loading projects...</h2></div>
        ) : cards.length > 0 ? (
          <div className="projects-grid">
            {cards.map((project) => <ProjectCard key={project.id} project={project} />)}
          </div>
        ) : (
          <div className="empty-state">
            <h2>No projects yet</h2>
            <p>Create your first project to start tracking development work.</p>
            <Link className="button-primary inline-button" to="/projects">Create project</Link>
          </div>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
