import StatCard from "./StatCard";
import ProjectCard from "./ProjectCard";

function Dashboard() {
  return (
    <section className="dashboard">
      <div className="dashboard-header">
        <div>
          <p className="dashboard-label">OVERVIEW</p>

          <h1>Dashboard</h1>

          <p className="dashboard-description">
            Here's what's happening with your projects.
          </p>
        </div>

        <button className="new-project-button">
          + New Project
        </button>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Total Projects"
          value={8}
        />

        <StatCard
          title="Active Tasks"
          value={24}
        />

        <StatCard
          title="Completed"
          value={16}
        />

        <StatCard
          title="Team Members"
          value={6}
        />
      </div>

      <div className="projects-section">
        <div className="section-header">
          <div>
            <h2>Your Projects</h2>

            <p>
              Manage and track your current projects.
            </p>
          </div>

          <button className="view-all-button">
            View all
          </button>
        </div>

        <div className="projects-grid">
          <ProjectCard
            name="DevFlow"
            description="Developer project management platform."
            tasks={12}
          />

          <ProjectCard
            name="Smart Budget Tracker"
            description="Personal finance tracking application."
            tasks={8}
          />

          <ProjectCard
            name="PDF Clearer"
            description="PDF enhancement and OCR application."
            tasks={15}
          />
        </div>
      </div>
    </section>
  );
}

export default Dashboard;