import React from 'react';

export function SkeletonCards({ count = 4 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 128, borderRadius: 16 }} />
      ))}
    </div>
  );
}

export function SkeletonRows({ rows = 4 }) {
  return (
    <div className="panel">
      <div className="skeleton" style={{ height: 22, width: 180, marginBottom: 18 }} />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 44, marginBottom: 10, borderRadius: 10 }} />
      ))}
    </div>
  );
}
