import React from 'react';
import { CodegenIcon } from '../shared/icons/CodegenIcon';

const Header: React.FC = () => {
  return (
    <header className="dashboard-header">
      <div className="header-logo">
        <CodegenIcon />
        <h1>Codegen Agent Dashboard</h1>
      </div>
      <div className="header-actions">
        <button className="btn btn-primary">New Agent Run</button>
      </div>
    </header>
  );
};

export default Header;
