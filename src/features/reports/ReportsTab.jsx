import React from 'react';
import { buildReportModel } from './buildReportModel.js';
import { exportPdf } from './exportPdf.js';
import { exportExcel } from './exportExcel.js';

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
    <div>
      <p>Generate the Event Budget Summary:</p>
      <button onClick={() => exportPdf(model())}>Export PDF</button>
      <button onClick={() => exportExcel(model())}>Export Excel</button>
    </div>
  );
}
