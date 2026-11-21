import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

// A tidy "in development" panel used by pages we haven't built yet.
// Each page passes its own icon, module number and planned features.
function ModulePlaceholder({ icon: Icon, module, title, summary, features }) {
  return (
    <section className="placeholder-panel">
      <div className="placeholder-icon">
        <Icon size={34} strokeWidth={1.5} />
      </div>

      <span className="module-badge">MODULE {module} · IN DEVELOPMENT</span>
      <h2>{title}</h2>
      <p className="placeholder-summary">{summary}</p>

      <ul className="feature-list">
        {features.map((feature) => (
          <li key={feature}>
            <CheckCircle2 size={15} />
            {feature}
          </li>
        ))}
      </ul>

      <Link to="/" className="secondary-button">
        <ArrowLeft size={15} /> Back to Overview
      </Link>
    </section>
  );
}

export default ModulePlaceholder;
