"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { ChartPoint } from "@/types/db";

export function DistanceCharts({
  daily,
  weekly
}: {
  daily: ChartPoint[];
  weekly: ChartPoint[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ChartCard title="일별 승인 거리" data={daily} type="bar" />
      <ChartCard title="주별 승인 거리" data={weekly} type="line" />
    </div>
  );
}

function ChartCard({
  title,
  data,
  type
}: {
  title: string;
  data: ChartPoint[];
  type: "bar" | "line";
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="distanceKm" fill="#e85d04" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="distanceKm" stroke="#132238" strokeWidth={3} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
