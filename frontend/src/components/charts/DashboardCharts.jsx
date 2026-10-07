import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const PALETTE = ['#3457E8', '#0E7C8A', '#B4740F', '#C13B3B', '#5B7CF5', '#1D8A5C', '#8A94A6', '#7C5CF5', '#D97706'];

const tooltipStyle = {
  fontSize: 12,
  borderRadius: 10,
  border: '1px solid #E3E6EC',
  boxShadow: '0 10px 30px rgba(20,24,33,0.12)',
};

export function TicketTrendChart({ data }) {
  const chartData = data.map((d) => ({ ...d, label: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3457E8" stopOpacity={0.25} />
            <stop offset="100%" stopColor="#3457E8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#EEF0F3" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8A94A6' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#8A94A6' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="count" stroke="#3457E8" strokeWidth={2} fill="url(#trendFill)" name="Tickets" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="category" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((entry, i) => (
            <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-ink-muted">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

const STATUS_COLORS = {
  NEW: '#0E7C8A',
  TRIAGED: '#5B7CF5',
  ASSIGNED: '#3457E8',
  IN_PROGRESS: '#2643C4',
  WAITING_FOR_USER: '#B4740F',
  RESOLVED: '#1D8A5C',
  CLOSED: '#8A94A6',
  REOPENED: '#C13B3B',
};

export function StatusChart({ data }) {
  const chartData = data.map((d) => ({ ...d, label: d.status.replace('_', ' ') }));
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="#EEF0F3" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#8A94A6' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: '#5B6472' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="count" radius={[0, 6, 6, 0]}>
          {chartData.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#8A94A6'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function SlaChart({ met, atRisk, breached }) {
  const data = [
    { name: 'Met', value: met, color: '#1D8A5C' },
    { name: 'At Risk', value: atRisk, color: '#B4740F' },
    { name: 'Breached', value: breached, color: '#C13B3B' },
  ];
  const total = met + atRisk + breached || 1;
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie data={data} dataKey="value" innerRadius={42} outerRadius={62} paddingAngle={3}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2.5 flex-1">
        {data.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-ink-muted">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              {d.name}
            </span>
            <span className="font-medium text-ink">
              {d.value} <span className="text-ink-faint font-normal">({Math.round((d.value / total) * 100)}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WorkloadChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 46)}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barGap={4}>
        <CartesianGrid horizontal={false} stroke="#EEF0F3" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#8A94A6' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#5B6472' }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="assigned" name="Assigned" fill="#5B7CF5" radius={[0, 4, 4, 0]} />
        <Bar dataKey="resolved" name="Resolved" fill="#1D8A5C" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
