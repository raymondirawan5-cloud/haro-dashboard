"use client";

import { memo, useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type ExecutionDatum = {
  date: string;
  committed: number;
  completed_verified: number;
  completed_unverified: number;
  blocked: number;
};

type Props = {
  data: ExecutionDatum[];
};

function MissionExecutionGraph({ data }: Props) {
  const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  return (
    <div style={{ width: "100%", height: 220 }}>
      <ResponsiveContainer>
        <BarChart data={safeData} barCategoryGap={10}>
          <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={26} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              background: "var(--bg-elev)",
              border: "1px solid rgba(124, 58, 237, 0.22)",
              borderRadius: 10,
              color: "var(--text-primary)",
            }}
          />
          <Bar dataKey="committed" stackId="a" fill="rgba(107, 114, 128, 0.75)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="completed_unverified" stackId="a" fill="rgba(124, 58, 237, 0.6)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="completed_verified" stackId="a" fill="rgba(0, 240, 255, 0.92)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="blocked" stackId="a" fill="rgba(255, 59, 92, 0.75)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(MissionExecutionGraph);
