import React from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { budgetVsActual } from '../events/eventTotals.js';
import { expenseByCategory, incomeBySource, cumulativeSpend } from './analyticsModel.js';
import { formatPeso } from '../../lib/format.js';

const PALETTE = ['#2dd4bf', '#8b5cf6', '#fb923c', '#ec4899', '#34d399', '#60a5fa', '#f59e0b', '#f87171'];
const AXIS = '#8a97ab';
const GRID = 'rgba(255,255,255,0.07)';

function tip(value) { return formatPeso(Number(value)); }

const tooltipStyle = {
  background: '#0e1420', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 10, color: '#e7edf5', fontSize: 13,
};

function ChartCard({ title, children, empty }) {
  return (
    <div className="panel" style={{ marginTop: 0 }}>
      <div className="panel-head"><h2 className="panel-title">{title}</h2></div>
      {empty ? <div className="empty"><p>{empty}</p></div> : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>{children}</ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function AnalyticsTab({ data }) {
  const { categories, expenses, income } = data;
  const budgetRows = budgetVsActual(categories, expenses);
  const byCat = expenseByCategory(categories, expenses);
  const bySource = incomeBySource(income);
  const cumulative = cumulativeSpend(expenses);

  const noData = budgetRows.length === 0 && byCat.length === 0 && bySource.length === 0;
  if (noData) {
    return (
      <div className="panel">
        <div className="empty">
          <h3>No analytics yet</h3>
          <p>Add budget categories, expenses, and income to see charts here.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20 }}>
      <ChartCard title="Budget vs Actual (by category)" empty={budgetRows.length ? null : 'No budget categories yet.'}>
        <BarChart data={budgetRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="name" stroke={AXIS} tick={{ fontSize: 12 }} />
          <YAxis stroke={AXIS} tick={{ fontSize: 12 }} width={70}
            tickFormatter={(v) => '₱' + (v >= 1000 ? (v / 1000) + 'k' : v)} />
          <Tooltip formatter={tip} contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="planned" name="Planned" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
          <Bar dataKey="spent" name="Spent" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <ChartCard title="Expense Breakdown" empty={byCat.length ? null : 'No approved expenses yet.'}>
        <PieChart>
          <Pie data={byCat} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={2}>
            {byCat.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />)}
          </Pie>
          <Tooltip formatter={tip} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ChartCard>

      <ChartCard title="Income by Source" empty={bySource.length ? null : 'No income recorded yet.'}>
        <PieChart>
          <Pie data={bySource} dataKey="value" nameKey="name" outerRadius={95} paddingAngle={2}>
            {bySource.map((_, i) => <Cell key={i} fill={PALETTE[(i + 2) % PALETTE.length]} stroke="none" />)}
          </Pie>
          <Tooltip formatter={tip} contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ChartCard>

      <ChartCard title="Cumulative Spending Over Time" empty={cumulative.length ? null : 'No approved expenses yet.'}>
        <AreaChart data={cumulative} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.5} />
              <stop offset="100%" stopColor="#2dd4bf" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
          <XAxis dataKey="date" stroke={AXIS} tick={{ fontSize: 11 }} />
          <YAxis stroke={AXIS} tick={{ fontSize: 12 }} width={70}
            tickFormatter={(v) => '₱' + (v >= 1000 ? (v / 1000) + 'k' : v)} />
          <Tooltip formatter={tip} contentStyle={tooltipStyle} />
          <Area type="monotone" dataKey="total" name="Cumulative spent" stroke="#2dd4bf" strokeWidth={2} fill="url(#spendGrad)" />
        </AreaChart>
      </ChartCard>
    </div>
  );
}
