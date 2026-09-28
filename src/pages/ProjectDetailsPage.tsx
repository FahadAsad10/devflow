import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type ApiProject, type ApiTask } from "../lib/api";

const statusLabel: Record<ApiTask["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [projectResponse, taskResponse] = await Promise.all([api.project(id), api.projectTasks(id)]);
      setProject(projectResponse.project);
      setTasks(taskResponse.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load project.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, [id]);

  const progress = tasks.length ? Math.round((tasks.filter((task) => task.status === "DONE").length / tasks.length) * 100) : 0;
  const grouped = useMemo(() => ({
    TODO: tasks.filter((task) => task.status === "TODO"),
    IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
    DONE: tasks.filter((task) => task.status === "DONE"),
  }), [tasks]);

  async function moveTask(task: ApiTask, status: ApiTask["status"]) {
    try {
      const response = await api.updateTask(task.id, { status });
      setTasks((current) => current.map((item) => item.id === task.id ? response.task : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task.");
    }
  }

  if (loading) return <section className="page"><div className="empty-state"><h2>Loading project...</h2></div></section>;

  if (error || !project) {
    return (
      <section className="page error-page">
        <p className="dashboard-label">PROJECT</p>
        <h1>{error || "Project not found"}</h1>
        <p className="page-description">The project may have been removed or the link is invalid.</p>
        <Link className="button-primary inline-button" to="/projects">Back to projects</Link>
      </section>
    );
  }

  const members = project.memberships ?? [];
  const done = tasks.filter((task) => task.status === "DONE").length;

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
        <article className="detail-card"><span>Progress</span><strong>{progress}%</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></article>
        <article className="detail-card"><span>Tasks</span><strong>{done}/{tasks.length}</strong><small>completed</small></article>
        <article className="detail-card"><span>Team</span><strong>{members.length}</strong><small>members</small></article>
        <article className="detail-card"><span>Due date</span><strong>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}</strong><small>target date</small></article>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="detail-panel">
        <div className="section-header">
          <div><h2>Project tasks</h2><p>Move tasks through the workflow as work progresses.</p></div>
          <Link className="button-secondary" to="/tasks">Open task board</Link>
        </div>

        {tasks.length === 0 ? (
          <div className="empty-state"><h2>No tasks yet</h2><p>Create tasks from the task board to start tracking this project.</p></div>
        ) : (
          <div className="task-mini-list">
            {(["TODO", "IN_PROGRESS", "DONE"] as const).map((column) => (
              <div key={column}>
                <h3>{statusLabel[column]} <span className="column-count">{grouped[column].length}</span></h3>
                {grouped[column].map((task) => (
                  <article className="task-mini-card" key={task.id}>
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                    <select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => void moveTask(task, event.target.value as ApiTask["status"])}>
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                    </select>
                  </article>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProjectDetailsPage;
