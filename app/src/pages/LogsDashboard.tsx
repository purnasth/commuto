import React from 'react';

const KIBANA_URL =
  'http://localhost:5601/app/discover#/?_a=(index:commuto-logs-*)';

const LogsDashboard: React.FC = () => {
  return (
    <div style={{ height: '100vh', width: '100vw', background: '#222' }}>
      <iframe
        src={KIBANA_URL}
        title="Kibana Logs Dashboard"
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
      />
    </div>
  );
};

export default LogsDashboard;
