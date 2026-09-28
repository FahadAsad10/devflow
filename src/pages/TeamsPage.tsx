function TeamsPage() {
  return (
    <section className="page">
      <p className="dashboard-label">WORKSPACE</p>
      <h1>Teams</h1>
      <p className="page-description">
        Manage your team members and collaborate across your DevFlow projects.
      </p>

      <div className="empty-state">
        <div className="empty-state-icon">T</div>
        <h2>Your team workspace</h2>
        <p>
          Team members, roles, invitations, and collaboration tools will appear
          here once we connect DevFlow to the backend.
        </p>
        <button className="new-project-button">+ Invite Member</button>
      </div>
    </section>
  );
}

export default TeamsPage;
