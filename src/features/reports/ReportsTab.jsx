import React from 'react';
import { buildReportModel } from './buildReportModel.js';
import { exportPdf } from './exportPdf.js';
import { exportExcel } from './exportExcel.js';
import Icon from '../../components/Icon.jsx';

export default function ReportsTab({ org, event, data }) {
  function model() {
    return buildReportModel({
      org,
      event,
      categories: data.categories,
      expenses: data.expenses,
      income: data.income,
    });
  }

  return (
    <div className="panel">
      <div className="panel-head"><h2 className="panel-title">Event Budget Summary</h2></div>
      <p className="muted" style={{ marginTop: 0 }}>
        Generate a printable report with budget vs actual, income, totals, and signature lines.
      </p>
      <div className="form-row" style={{ marginBottom: 0 }}>
        <button className="btn btn-primary" onClick={() => exportPdf(model())}>
          <Icon name="doc" size={16} /> Export PDF
        </button>
        <button className="btn" onClick={() => exportExcel(model())}>
          <Icon name="doc" size={16} /> Export Excel
        </button>
      </div>
    </div>
  );
}
