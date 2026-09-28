import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { api, type ApiProject } from "../lib/api";
import type { ProjectStatus } from "../types/project";

function toUiProject(project: ApiProject) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status === "PLANNING" ? "Planning" as const : project.status === "ACTIVE" ? "Active" as const : "Completed" as const,
    dueDate: project.dueDate ?? "",
    tasksTotal: project._count?.tasks ?? 0,
    tasksCompleted: project.tasks?.filter((task) => task.status === "DONE").length ?? 0,
    members: project._count?.memberships ?? 0,
  };
}

function ProjectsPage() {
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("Planning");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");

  async function loadProjects() {
    setLoading(true);
    try {
      setProjects((await api.projects()).projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load projects.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProjects(); }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) =>
      [project.name, project.description, project.status].some((value) => value.toLowerCase().includes(query)),
    );
  }, [projects, search]);

  function resetForm() {
    setName("");
    setDescription("");
    setStatus("Planning");
    setDueDate("");
    setError("");
  }

  async function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (name.trim().length < 3) return setError("Project name must be at least 3 characters.");
    if (description.trim().length < 10) return setError("Description must be at least 10 characters.");
    if (!dueDate) return setError("Choose a due date.");

    try {
      await api.createProject({
        name: name.trim(),
        description: description.trim(),
        status: status === "Planning" ? "PLANNING" : status === "Active" ? "ACTIVE" : "COMPLETED",
        dueDate,
      });
      await loadProjects();
      setShowForm(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project.");
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="dashboard-label">WORKSPACE</p>
          <h1>Projects</h1>
          <p className="page-description">Create, organize, and track the projects your team is working on.</p>
        </div>
        <button className="button-primary" type="button" onClick={() => setShowForm(true)}>+ New Project</button>
      </div>

      {error && !showForm && <p className="form-error" role="alert">{error}</p>}

      <div className="toolbar">
        <label className="search-box">
          <span className="sr-only">Search projects</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." />
        </label>
        <span className="result-count">{loading ? "Loading..." : `${filteredProjects.length} projects`}</span>
      </div>

      {loading ? (
        <div className="empty-state"><h2>Loading projects...</h2></div>
      ) : filteredProjects.length > 0 ? (
        <div className="project-list-grid">
          {filteredProjects.map((rawProject) => {
            const project = toUiProject(rawProject);
            const progress = project.tasksTotal ? Math.round((project.tasksCompleted / project.tasksTotal) * 100) : 0;

            return (
              <article className="project-list-card" key={project.id}>
                <div className="project-card-top">
                  <div className="project-icon">{project.name.charAt(0)}</div>
                  <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
                </div>
                <h2>{project.name}</h2>
                <p>{project.description}</p>
                <div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
                <div className="project-meta">
                  <span>{progress}% complete</span>
                  <span>{project.tasksCompleted}/{project.tasksTotal} tasks</span>
                </div>
                <Link className="view-button" to={`/projects/${project.id}`}>Open project</Link>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">P</div>
          <h2>No projects found</h2>
          <p>Try another search or create your first project.</p>
          <button className="button-primary" type="button" onClick={() => setShowForm(true)}>+ New Project</button>
        </div>
      )}

      {showForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowForm(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="new-project-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><p className="dashboard-label">PROJECT</p><h2 id="new-project-title">Create project</h2></div>
              <button className="icon-button" type="button" aria-label="Close" onClick={() => setShowForm(false)}>×</button>
            </div>

            <form onSubmit={createProject} className="project-form">
              <label>Project name<input value={name} onChange={(event) => setName(event.target.value)} minLength={3} required placeholder="e.g. Mobile App" /></label>
              <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} minLength={10} required rows={4} placeholder="What are you building?" /></label>
              <div className="form-row">
                <label>Status<select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}><option>Planning</option><option>Active</option><option>Completed</option></select></label>
                <label>Due date<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required /></label>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="button-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="button-primary">Create project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default ProjectsPage;
