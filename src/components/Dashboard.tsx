import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "./StatCard";
import ProjectCard from "./ProjectCard";
import { api, type ApiProject, type DashboardAnalytics } from "../lib/api";

function Dashboard() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.projects(), api.analytics()])
      .then(([projectResponse, analyticsResponse]) => {
        setProjects(projectResponse.projects);
        setAnalytics(analyticsResponse);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

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
        <StatCard title="Total Projects" value={loading ? "—" : analytics?.projects.total ?? projects.length} />
        <StatCard title="Active Tasks" value={loading ? "—" : (analytics?.tasks.todo ?? 0) + (analytics?.tasks.inProgress ?? 0)} />
        <StatCard title="Completed Projects" value={loading ? "—" : analytics?.projects.completed ?? 0} />
        <StatCard title="Team Members" value={loading ? "—" : analytics?.teamMembers ?? 0} />
      </div>

      {!loading && analytics && (
        <div className="analytics-grid" aria-label="Development analytics">
          <article className="analytics-card">
            <div className="analytics-card-header"><div><p className="dashboard-label">TASK HEALTH</p><h2>Completion rate</h2></div><strong>{analytics.tasks.completionRate}%</strong></div>
            <div className="analytics-progress"><span style={{ width: `${analytics.tasks.completionRate}%` }} /></div>
            <div className="analytics-breakdown"><span>To Do <b>{analytics.tasks.todo}</b></span><span>In Progress <b>{analytics.tasks.inProgress}</b></span><span>Done <b>{analytics.tasks.done}</b></span></div>
          </article>

          <article className="analytics-card">
            <div className="analytics-card-header"><div><p className="dashboard-label">PROJECT HEALTH</p><h2>Project status</h2></div><strong>{analytics.projects.overdue}</strong></div>
            <div className="analytics-breakdown"><span>Planning <b>{analytics.projects.planning}</b></span><span>Active <b>{analytics.projects.active}</b></span><span>Completed <b>{analytics.projects.completed}</b></span></div>
            <p className="analytics-note">{analytics.projects.overdue === 0 ? "No overdue projects." : `${analytics.projects.overdue} project${analytics.projects.overdue === 1 ? "" : "s"} past the due date.`}</p>
          </article>
        </div>
      )}

      <div className="projects-section">
        <div className="section-header">
          <div><h2>Your Projects</h2><p>Manage and track your current projects.</p></div>
          <Link className="view-all-button" to="/projects">View all</Link>
        </div>

        {loading ? (
          <div className="empty-state"><h2>Loading projects...</h2></div>
        ) : cards.length > 0 ? (
          <div className="projects-grid">{cards.map((project) => <ProjectCard key={project.id} project={project} />)}</div>
        ) : (
          <div className="empty-state"><h2>No projects yet</h2><p>Create your first project to start tracking development work.</p><Link className="button-primary inline-button" to="/projects">Create project</Link></div>
        )}
      </div>
    </section>
  );
}

export default Dashboard;
