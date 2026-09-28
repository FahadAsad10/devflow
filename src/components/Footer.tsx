import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="site-footer">
      <span>© 2026 DevFlow</span>
      <nav aria-label="Legal">
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </nav>
    </footer>
  );
}

export default Footer;
