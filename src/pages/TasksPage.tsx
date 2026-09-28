function TasksPage() {
  return (
    <section className="page">
      <p className="dashboard-label">WORKSPACE</p>
      <h1>Tasks</h1>
      <p className="page-description">
        Organize your work, track progress, and keep every task moving forward.
      </p>

      <div className="kanban-preview">
        <div className="kanban-column">
          <div className="kanban-column-header">
            <h2>To Do</h2>
            <span>0</span>
          </div>
          <p className="empty-column">No tasks yet</p>
        </div>

        <div className="kanban-column">
          <div className="kanban-column-header">
            <h2>In Progress</h2>
            <span>0</span>
          </div>
          <p className="empty-column">No tasks yet</p>
        </div>

        <div className="kanban-column">
          <div className="kanban-column-header">
            <h2>Done</h2>
            <span>0</span>
          </div>
          <p className="empty-column">No tasks yet</p>
        </div>
      </div>
    </section>
  );
}

export default TasksPage;
