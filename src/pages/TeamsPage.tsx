import { useEffect, useState } from "react";
import { api, type TeamMember } from "../lib/api";

function TeamsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.teams()
      .then((response) => setMembers(response.members))
      .catch((err) => setError(err instanceof Error ? err.message : "Unable to load team."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="page">
      <div className="page-header">
        <div>
          <p className="dashboard-label">WORKSPACE</p>
          <h1>Teams</h1>
          <p className="page-description">See everyone collaborating across your DevFlow projects.</p>
        </div>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      {loading ? (
        <div className="empty-state"><h2>Loading team...</h2></div>
      ) : members.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">T</div>
          <h2>No team members yet</h2>
          <p>Your account will appear here once you create your first project.</p>
        </div>
      ) : (
        <div className="team-grid">
          {members.map((member) => (
            <article className="team-card" key={member.id}>
              <div className="team-avatar">{member.name.charAt(0).toUpperCase()}</div>
              <div>
                <h2>{member.name}</h2>
                <p>{member.email}</p>
                <span className="status-badge status-active">{member.role}</span>
                <small>{member.projects.join(" · ")}</small>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default TeamsPage;
