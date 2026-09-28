import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="page error-page">
      <p className="dashboard-label">404</p>
      <h1>Page not found</h1>
      <p className="page-description">
        The page you requested does not exist or may have moved.
      </p>
      <Link className="button-primary inline-button" to="/dashboard">
        Back to dashboard
      </Link>
    </section>
  );
}

export default NotFoundPage;
