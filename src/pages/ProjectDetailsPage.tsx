import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type ApiAttachment, type ApiComment, type ApiProject, type ApiTask } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const statusLabel: Record<ApiTask["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function ProjectDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [attachments, setAttachments] = useState<ApiAttachment[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [commentBody, setCommentBody] = useState("");
  const [commentSaving, setCommentSaving] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssigneeId, setTaskAssigneeId] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError("");
    try {
      const [projectResponse, taskResponse, commentResponse, attachmentResponse] = await Promise.all([
        api.project(id),
        api.projectTasks(id),
        api.comments(id),
        api.attachments(id),
      ]);
      setProject(projectResponse.project);
      setTasks(taskResponse.tasks);
      setComments(commentResponse.comments);
      setAttachments(attachmentResponse.attachments);
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

  async function createTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || taskTitle.trim().length < 2) return;
    setTaskSaving(true);
    setError("");
    try {
      const response = await api.createTask(id, {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        assigneeId: taskAssigneeId || null,
      });
      setTasks((current) => [...current, response.task]);
      setTaskTitle("");
      setTaskDescription("");
      setTaskAssigneeId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create task.");
    } finally {
      setTaskSaving(false);
    }
  }

  async function saveProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !project) return;
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await api.updateProject(id, {
        name: String(form.get("name") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        status: String(form.get("status") ?? project.status) as ApiProject["status"],
        dueDate: String(form.get("dueDate") ?? "") || null,
      });
      setProject(response.project);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save project.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProject() {
    if (!id || !window.confirm("Delete this project and all of its tasks? This cannot be undone.")) return;
    try {
      await api.deleteProject(id);
      navigate("/projects", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete project.");
    }
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || commentBody.trim().length < 1) return;
    setCommentSaving(true);
    try {
      const response = await api.createComment(id, commentBody.trim());
      setComments((current) => [response.comment, ...current]);
      setCommentBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to add comment.");
    } finally {
      setCommentSaving(false);
    }
  }

  async function removeComment(comment: ApiComment) {
    try {
      await api.deleteComment(comment.id);
      setComments((current) => current.filter((item) => item.id !== comment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete comment.");
    }
  }

  async function uploadFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!id || !selectedFile) return;
    setUploading(true);
    setError("");
    try {
      const response = await api.uploadAttachment(id, selectedFile);
      setAttachments((current) => [response.attachment, ...current]);
      setSelectedFile(null);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to upload file.");
    } finally {
      setUploading(false);
    }
  }

  async function removeAttachment(attachment: ApiAttachment) {
    if (!window.confirm(`Delete ${attachment.filename}?`)) return;
    try {
      await api.deleteAttachment(attachment.id);
      setAttachments((current) => current.filter((item) => item.id !== attachment.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete file.");
    }
  }

  async function changeMemberRole(memberId: string, role: "ADMIN" | "MEMBER") {
    if (!id) return;
    try {
      await api.updateMemberRole(id, memberId, role);
      setProject((current) => current ? { ...current, memberships: current.memberships?.map((member) => member.user.id === memberId ? { ...member, role } : member) } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update member.");
    }
  }

  async function removeMember(memberId: string) {
    if (!id || !window.confirm("Remove this member from the project?")) return;
    try {
      await api.removeMember(id, memberId);
      setProject((current) => current ? { ...current, memberships: current.memberships?.filter((member) => member.user.id !== memberId) } : current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to remove member.");
    }
  }

  if (loading) return <section className="page"><div className="empty-state"><h2>Loading project...</h2></div></section>;

  if (error && !project) {
    return (
      <section className="page error-page">
        <p className="dashboard-label">PROJECT</p>
        <h1>{error || "Project not found"}</h1>
        <p className="page-description">The project may have been removed or the link is invalid.</p>
        <Link className="button-primary inline-button" to="/projects">Back to projects</Link>
      </section>
    );
  }

  if (!project) return null;

  const members = project.memberships ?? [];
  const done = tasks.filter((task) => task.status === "DONE").length;
  const isOwner = project.ownerId === user?.id;

  return (
    <section className="page">
      <Link className="back-link" to="/projects">← Back to projects</Link>

      <div className="detail-header">
        <div>
          <p className="dashboard-label">PROJECT</p>
          <h1>{project.name}</h1>
          <p className="page-description">{project.description}</p>
        </div>
        <div className="detail-actions">
          <span className={`status-badge status-${project.status.toLowerCase()}`}>{project.status}</span>
          {isOwner && <button className="button-secondary" type="button" onClick={() => setEditing((value) => !value)}>{editing ? "Cancel" : "Edit"}</button>}
          {isOwner && <button className="button-danger" type="button" onClick={() => void deleteProject()}>Delete</button>}
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {editing && (
        <form className="detail-panel project-form project-edit-form" onSubmit={saveProject}>
          <div className="section-header"><div><h2>Edit project</h2><p>Update the project details and delivery target.</p></div></div>
          <label>Project name<input name="name" defaultValue={project.name} minLength={3} required /></label>
          <label>Description<textarea name="description" defaultValue={project.description} minLength={10} rows={4} required /></label>
          <div className="form-row">
            <label>Status<select name="status" defaultValue={project.status}><option value="PLANNING">Planning</option><option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option></select></label>
            <label>Due date<input name="dueDate" type="date" defaultValue={project.dueDate ? project.dueDate.slice(0, 10) : ""} /></label>
          </div>
          <div className="modal-actions"><button className="button-primary" disabled={saving} type="submit">{saving ? "Saving..." : "Save changes"}</button></div>
        </form>
      )}

      <div className="detail-grid">
        <article className="detail-card"><span>Progress</span><strong>{progress}%</strong><div className="progress-track"><div className="progress-fill" style={{ width: `${progress}%` }} /></div></article>
        <article className="detail-card"><span>Tasks</span><strong>{done}/{tasks.length}</strong><small>completed</small></article>
        <article className="detail-card"><span>Team</span><strong>{members.length}</strong><small>members</small></article>
        <article className="detail-card"><span>Due date</span><strong>{project.dueDate ? new Date(project.dueDate).toLocaleDateString() : "Not set"}</strong><small>target date</small></article>
      </div>

      <div className="detail-panel">
        <div className="section-header">
          <div><h2>Project tasks</h2><p>Move tasks through the workflow as work progresses.</p></div>
          <Link className="button-secondary" to="/tasks">Open task board</Link>
        </div>

        <form className="task-inline-form" onSubmit={createTask}>
          <input aria-label="New task title" value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="Add a task..." minLength={2} required />
          <input aria-label="New task description" value={taskDescription} onChange={(event) => setTaskDescription(event.target.value)} placeholder="Description (optional)" />
          <select aria-label="Assign task" value={taskAssigneeId} onChange={(event) => setTaskAssigneeId(event.target.value)}>
            <option value="">Unassigned</option>
            {members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}
          </select>
          <button className="button-primary" disabled={taskSaving} type="submit">{taskSaving ? "Adding..." : "Add task"}</button>
        </form>

        {tasks.length === 0 ? (
          <div className="empty-state"><h2>No tasks yet</h2><p>Add the first task above or use the task board.</p></div>
        ) : (
          <div className="task-mini-list">
            {(["TODO", "IN_PROGRESS", "DONE"] as const).map((column) => (
              <div key={column}>
                <h3>{statusLabel[column]} <span className="column-count">{grouped[column].length}</span></h3>
                {grouped[column].map((task) => (
                  <article className="task-mini-card" key={task.id}>
                    <strong>{task.title}</strong>
                    {task.description && <p>{task.description}</p>}
                    <span className="task-assignee">{task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"}</span>
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

      <div className="detail-panel project-files-panel">
        <div className="section-header">
          <div><h2>Files</h2><p>Keep project documents and assets available to the whole team.</p></div>
          <span className="result-count">{attachments.length} {attachments.length === 1 ? "file" : "files"}</span>
        </div>
        <form className="file-upload-form" onSubmit={uploadFile}>
          <label className="file-picker">Choose file
            <input type="file" onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} accept=".pdf,.txt,.csv,.zip,.json,image/jpeg,image/png,image/webp,image/gif" />
          </label>
          <span className="file-help">{selectedFile ? selectedFile.name : "PDF, images, ZIP, JSON, CSV or text · max 10 MB"}</span>
          <button className="button-primary" disabled={!selectedFile || uploading} type="submit">{uploading ? "Uploading..." : "Upload file"}</button>
        </form>
        {attachments.length === 0 ? <p className="empty-comment">No files uploaded yet.</p> : (
          <div className="file-list">
            {attachments.map((attachment) => (
              <article className="file-card" key={attachment.id}>
                <div className="file-icon">FILE</div>
                <div className="file-info"><strong>{attachment.filename}</strong><span>{Math.ceil(attachment.size / 1024)} KB · uploaded by {attachment.uploader.name}</span></div>
                <div className="file-actions">
                  <a className="button-secondary" href={api.downloadAttachment(attachment.id)}>Download</a>
                  {attachment.uploaderId === user?.id && <button className="button-danger" type="button" onClick={() => void removeAttachment(attachment)}>Delete</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="detail-panel team-members-panel">
        <div className="section-header"><div><h2>Project members</h2><p>Manage roles for collaborators on this project.</p></div><span className="result-count">{members.length}</span></div>
        <div className="member-management-list">
          {members.map((member) => (
            <div className="member-management-row" key={member.user.id}>
              <div className="team-avatar">{member.user.name.charAt(0).toUpperCase()}</div>
              <div className="member-management-info"><strong>{member.user.name}</strong><span>{member.user.email}</span></div>
              <span className="status-badge status-active">{member.role}</span>
              {isOwner && member.user.id !== project.ownerId && (
                <>
                  <select aria-label={`Role for ${member.user.name}`} value={member.role} onChange={(event) => void changeMemberRole(member.user.id, event.target.value as "ADMIN" | "MEMBER")}>
                    <option value="MEMBER">Member</option><option value="ADMIN">Admin</option>
                  </select>
                  <button className="button-danger" type="button" onClick={() => void removeMember(member.user.id)}>Remove</button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <section className="detail-panel comments-panel">
        <div className="section-header"><div><h2>Discussion</h2><p>Keep project decisions and updates with the work.</p></div><span className="result-count">{comments.length} {comments.length === 1 ? "comment" : "comments"}</span></div>
        <form className="comment-form" onSubmit={addComment}>
          <label className="sr-only" htmlFor="project-comment">Add a comment</label>
          <textarea id="project-comment" value={commentBody} onChange={(event) => setCommentBody(event.target.value)} placeholder="Share an update or ask a question..." maxLength={2000} rows={3} required />
          <div className="comment-form-footer"><span>{commentBody.length}/2000</span><button className="button-primary" disabled={commentSaving || !commentBody.trim()} type="submit">{commentSaving ? "Posting..." : "Post comment"}</button></div>
        </form>

        {comments.length === 0 ? (
          <p className="empty-comment">No comments yet. Start the discussion.</p>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <article className="comment-card" key={comment.id}>
                <div className="comment-avatar">{comment.user.name.charAt(0).toUpperCase()}</div>
                <div className="comment-content">
                  <div className="comment-header"><strong>{comment.user.name}</strong><time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time></div>
                  <p>{comment.body}</p>
                  {comment.user.id === user?.id && <button className="comment-delete" type="button" onClick={() => void removeComment(comment)}>Delete</button>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default ProjectDetailsPage;
