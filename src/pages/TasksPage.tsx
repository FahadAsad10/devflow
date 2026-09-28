import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, type ApiTask } from "../lib/api";

const columns: { status: ApiTask["status"]; label: string }[] = [
  { status: "TODO", label: "To Do" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "DONE", label: "Done" },
];

function TasksPage() {
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.tasks(), api.projects()])
      .then(([taskResponse, projectResponse]) => {
        setTasks(taskResponse.tasks);
        setProjects(projectResponse.projects.map((project) => ({ id: project.id, name: project.name })));
        setProjectId((current) => current || projectResponse.projects[0]?.id || "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load tasks."))
      .finally(() => setLoading(false));
  }, []);

  const grouped = useMemo(() => ({
    TODO: tasks.filter((task) => task.status === "TODO"),
    IN_PROGRESS: tasks.filter((task) => task.status === "IN_PROGRESS"),
    DONE: tasks.filter((task) => task.status === "DONE"),
  }), [tasks]);

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!projectId) return setError("Create a project before adding tasks.");
    if (title.trim().length < 2) return setError("Task title must be at least 2 characters.");

    try {
      const response = await api.createTask(projectId, { title: title.trim(), description: description.trim() || undefined });
      setTasks((current) => [response.task, ...current]);
      setTitle("");
      setDescription("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    }
  }

  async function updateStatus(task: ApiTask, status: ApiTask["status"]) {
    try {
      const response = await api.updateTask(task.id, { status });
      setTasks((current) => current.map((item) => item.id === task.id ? response.task : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update task.");
    }
  }

  async function removeTask(id: string) {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.deleteTask(id);
      setTasks((current) => current.filter((task) => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete task.");
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="dashboard-label">WORKSPACE</p>
          <h1>Tasks</h1>
          <p className="page-description">Create tasks and move them through your development workflow.</p>
        </div>
      </div>

      <form className="task-create-form" onSubmit={createTask}>
        <div>
          <label className="sr-only" htmlFor="task-project">Project</label>
          <select id="task-project" value={projectId} onChange={(event) => setProjectId(event.target.value)} disabled={projects.length === 0}>
            {projects.length === 0 ? <option value="">No projects</option> : projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </div>
        <div>
          <label className="sr-only" htmlFor="task-title">Task title</label>
          <input id="task-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" minLength={2} required />
        </div>
        <div>
          <label className="sr-only" htmlFor="task-description">Task description</label>
          <input id="task-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
        </div>
        <button className="button-primary" type="submit" disabled={projects.length === 0}>Add task</button>
      </form>

      {error && <p className="form-error" role="alert">{error}</p>}

      {loading ? (
        <div className="empty-state"><h2>Loading tasks...</h2></div>
      ) : (
        <div className="kanban-preview">
          {columns.map((column) => (
            <div className="kanban-column" key={column.status}>
              <div className="kanban-column-header"><h2>{column.label}</h2><span>{grouped[column.status].length}</span></div>
              {grouped[column.status].length === 0 ? <p className="empty-column">No tasks yet</p> : grouped[column.status].map((task) => (
                <article className="task-card" key={task.id}>
                  <div className="task-card-title"><strong>{task.title}</strong><button type="button" className="task-delete" onClick={() => void removeTask(task.id)} aria-label={`Delete ${task.title}`}>×</button></div>
                  {task.description && <p>{task.description}</p>}
                  {task.project && <span className="task-project">{task.project.name}</span>}
                  <select aria-label={`Move ${task.title}`} value={task.status} onChange={(event) => void updateStatus(task, event.target.value as ApiTask["status"])}>
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
    </section>
  );
}

export default TasksPage;
