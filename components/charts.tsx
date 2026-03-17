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
    <div className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-50 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
          승인 기준
        </span>
      </div>
      <div className="mt-4 h-64 rounded-[22px] bg-white p-2 sm:p-3">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                cursor={{ fill: "rgba(241, 245, 249, 0.7)" }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
                }}
                formatter={(value: number | string) => [`${value}km`, "거리"]}
              />
              <Bar dataKey="distanceKm" fill="#e85d04" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={32} />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)"
                }}
                formatter={(value: number | string) => [`${value}km`, "거리"]}
              />
              <Line
                type="monotone"
                dataKey="distanceKm"
                stroke="#132238"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
