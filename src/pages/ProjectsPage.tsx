function ProjectsPage() {
  return (
    <section className="page">
      <p className="dashboard-label">WORKSPACE</p>
      <h1>Projects</h1>
      <p className="page-description">
        Create, organize, and track the projects your team is working on.
      </p>
      <div className="empty-state">
        <div className="empty-state-icon">P</div>
        <h2>Projects workspace</h2>
        <p>This is where your real projects will live once we connect DevFlow to the backend and database.</p>
        <button className="new-project-button">+ New Project</button>
      </div>
    </section>
  );
}
export default ProjectsPage;