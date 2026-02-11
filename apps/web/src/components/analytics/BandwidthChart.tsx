import type { BandwidthDataPoint } from '@clr-vault/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatBytes } from '@/lib/utils';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface BandwidthChartProps {
  data: BandwidthDataPoint[] | undefined;
  isLoading: boolean;
}

export function BandwidthChart({ data, isLoading }: BandwidthChartProps) {
  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bandwidth Usage (30 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date,
    bytes: parseInt(d.bytesServed, 10),
    requests: d.requests,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bandwidth Usage (30 days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="bandwidthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(245, 58%, 51%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => formatBytes(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              formatter={(value: number) => [formatBytes(value), 'Bandwidth']}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
              }
            />
            <Area
              type="monotone"
              dataKey="bytes"
              stroke="hsl(245, 58%, 51%)"
              strokeWidth={2}
              fill="url(#bandwidthGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
