import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";

// Shown when someone visits a URL that doesn't exist
function NotFoundPage() {
  return (
    <section className="placeholder-panel">
      <div className="placeholder-icon">
        <Compass size={34} strokeWidth={1.5} />
      </div>
      <span className="module-badge">ERROR 404</span>
      <h2>This page doesn't exist</h2>
      <p className="placeholder-summary">
        The address may be mistyped, or the page may have moved.
      </p>
      <Link to="/" className="secondary-button">
        <ArrowLeft size={15} /> Back to Overview
      </Link>
    </section>
  );
}

export default NotFoundPage;
