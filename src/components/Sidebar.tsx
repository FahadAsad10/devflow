function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">DevFlow</div>

      <nav className="sidebar-nav">
        <a href="#" className="sidebar-link active">Dashboard</a>
        <a href="#" className="sidebar-link">Projects</a>
        <a href="#" className="sidebar-link">Tasks</a>
        <a href="#" className="sidebar-link">Teams</a>
      </nav>
    </aside>
  );
}

export default Sidebar;