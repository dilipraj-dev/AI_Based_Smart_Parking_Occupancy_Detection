import { Cpu, LayoutDashboard, Video, BarChart2, Radio, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header-wrapper">
      <div className="header-content">
        {/* Brand identity */}
        <div className="brand-section">
          <div className="brand-logo-icon">
            <Radio size={22} strokeWidth={2.2} />
          </div>
          <div className="brand-titles">
            <div className="brand-title">
              Smart Parking AI
              <span className="brand-badge">PRO</span>
            </div>
            <span className="brand-subtitle">
              AI-Based Smart Parking Occupancy Detection
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav aria-label="Main Navigation">
          <ul className="nav-links">
            <li>
              <a href="#overview" className="nav-link-item active">
                <LayoutDashboard size={15} />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#inference" className="nav-link-item">
                <Cpu size={15} />
                <span>Inference</span>
              </a>
            </li>
            <li>
              <a href="#visualization" className="nav-link-item">
                <Video size={15} />
                <span>Monitoring</span>
              </a>
            </li>
            <li>
              <a href="#analytics" className="nav-link-item">
                <BarChart2 size={15} />
                <span>Analytics</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* Controls & Readiness */}
        <div className="header-actions-group">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="theme-toggle-icon text-amber" />
                <span className="theme-toggle-label">LIGHT</span>
              </>
            ) : (
              <>
                <Moon size={15} className="theme-toggle-icon text-emerald" />
                <span className="theme-toggle-label">DARK</span>
              </>
            )}
          </button>

          {/* System readiness badge */}
          <div className="header-status-indicator">
            <span className="status-pulse-dot" />
            <span>SYSTEM READY</span>
          </div>
        </div>
      </div>
    </header>
  );
}

