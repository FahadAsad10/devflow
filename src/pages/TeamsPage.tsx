import { useEffect, useState, type FormEvent } from "react";
import { api, type ApiProject, type TeamInvitation, type TeamMember } from "../lib/api";

function TeamsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [projects, setProjects] = useState<ApiProject[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState("");
  const [role, setRole] = useState<"ADMIN" | "MEMBER">("MEMBER");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const errors: string[] = [];

    const [teamResult, projectResult, invitationResult] = await Promise.allSettled([
      api.teams(),
      api.projects(),
      api.invitations(),
    ]);

    if (teamResult.status === "fulfilled") {
      setMembers(teamResult.value.members);
    } else {
      errors.push(teamResult.reason instanceof Error ? `Team: ${teamResult.reason.message}` : "Team: unable to load.");
    }

    if (projectResult.status === "fulfilled") {
      setProjects(projectResult.value.projects);
      setProjectId((current) => current || projectResult.value.projects[0]?.id || "");
    } else {
      errors.push(projectResult.reason instanceof Error ? `Projects: ${projectResult.reason.message}` : "Projects: unable to load.");
    }

    if (invitationResult.status === "fulfilled") {
      setInvitations(invitationResult.value.invitations);
    } else {
      errors.push(invitationResult.reason instanceof Error ? `Invitations: ${invitationResult.reason.message}` : "Invitations: unable to load.");
    }

    if (errors.length) setError(errors.join(" "));
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!projectId || !email.trim()) return;
    try {
      await api.inviteMember(projectId, { email: email.trim(), role });
      setEmail("");
      setMessage("Invitation created. If the account already exists, they will see it in their notifications.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to invite member.");
    }
  }

  async function accept(id: string) {
    try {
      await api.acceptInvitation(id);
      setInvitations((current) => current.filter((invitation) => invitation.id !== id));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to accept invitation.");
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="dashboard-label">WORKSPACE</p>
          <h1>Teams</h1>
          <p className="page-description">Invite collaborators, manage project access, and accept pending invitations.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p className="form-success" role="status">{message}</p>}

      {loading ? <div className="empty-state"><h2>Loading team...</h2></div> : (
        <>
          <div className="team-management-grid">
            <form className="detail-panel project-form" onSubmit={invite}>
              <div><p className="dashboard-label">COLLABORATION</p><h2>Invite a member</h2></div>
              <label>Project<select value={projectId} onChange={(event) => setProjectId(event.target.value)}>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
              <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="developer@example.com" required /></label>
              <label>Role<select value={role} onChange={(event) => setRole(event.target.value as "ADMIN" | "MEMBER")}><option value="MEMBER">Member</option><option value="ADMIN">Admin</option></select></label>
              <button className="button-primary" disabled={!projectId} type="submit">Send invitation</button>
            </form>

            <div className="detail-panel">
              <div className="section-header"><div><p className="dashboard-label">INBOX</p><h2>Pending invitations</h2></div><span className="result-count">{invitations.length}</span></div>
              {invitations.length === 0 ? <p className="empty-comment">No pending invitations.</p> : invitations.map((invitation) => (
                <article className="invitation-card" key={invitation.id}>
                  <div><strong>{invitation.project.name}</strong><p>From {invitation.sender.name} · {invitation.role}</p><small>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</small></div>
                  <button className="button-primary" type="button" onClick={() => void accept(invitation.id)}>Accept</button>
                </article>
              ))}
            </div>
          </div>

          {members.length === 0 ? (
            <div className="empty-state"><h2>No team members yet</h2><p>Create a project or accept an invitation to start collaborating.</p></div>
          ) : (
            <div className="team-grid">
              {members.map((member) => (
                <article className="team-card" key={member.id}>
                  <div className="team-avatar">{member.name.charAt(0).toUpperCase()}</div>
                  <div><h2>{member.name}</h2><p>{member.email}</p><span className="status-badge status-active">{member.role}</span><small>{member.projects.join(" · ")}</small></div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default TeamsPage;
