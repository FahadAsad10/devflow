import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await logout();
    navigate("/login", { replace: true });
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? "U";

  return (
    <header className="topbar">
      <div className="topbar-logo">DevFlow</div>

      <div className="topbar-user">
        <span className="user-avatar" aria-hidden="true">{initial}</span>
        <span>{user?.name ?? "User"}</span>
        <button className="button-secondary nav-logout" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          Account
        </button>
        {open && (
          <div className="account-menu">
            <span>{user?.email}</span>
            <button className="button-secondary" type="button" onClick={signOut}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
