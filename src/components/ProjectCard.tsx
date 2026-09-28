type ProjectCardProps = {
  name: string;
  description: string;
  tasks: number;
};

function ProjectCard({
  name,
  description,
  tasks,
}: ProjectCardProps) {
  return (
    <div className="project-card">
      <div className="project-icon">
        {name.charAt(0)}
      </div>

      <h3>{name}</h3>

      <p>{description}</p>

      <div className="project-footer">
        <span>{tasks} tasks</span>

        <button className="view-button">
          View
        </button>
      </div>
    </div>
  );
}

export default ProjectCard;