import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside className="dashboard-sidebar">
      <nav>
        <ul className="sidebar-nav">
          <li className="sidebar-nav-item active">
            <a href="#/agent-runs">Agent Runs</a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#/repositories">Repositories</a>
          </li>
          <li className="sidebar-nav-item">
            <a href="#/settings">Settings</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
