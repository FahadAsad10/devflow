import { useEffect, useState } from "react";

const COOKIE_KEY = "devflow-cookie-consent";

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(localStorage.getItem(COOKIE_KEY) === null);
  }, []);

  if (!visible) return null;

  const choose = (value: "accepted" | "declined") => {
    localStorage.setItem(COOKIE_KEY, value);
    setVisible(false);
  };

  return (
    <aside className="cookie-banner" aria-label="Cookie consent">
      <div>
        <strong>Privacy choices</strong>
        <p>
          DevFlow uses essential storage for app preferences. Optional analytics
          only runs after you give consent.
        </p>
      </div>
      <div className="cookie-actions">
        <button className="button-secondary" onClick={() => choose("declined")}>
          Decline
        </button>
        <button className="button-primary" onClick={() => choose("accepted")}>
          Accept
        </button>
      </div>
    </aside>
  );
}

export default CookieBanner;
