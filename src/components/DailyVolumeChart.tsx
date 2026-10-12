import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Activity, IndianRupee } from 'lucide-react';

export interface ChartTransaction {
  transactionId: number;
  transactionCode?: string;
  amount: number;
  status: string;
  transactionDate: string;
  paymentMethod?: string;
  gateway?: { name: string };
  merchant?: { name: string };
}

interface DailyVolumeChartProps {
  transactions: ChartTransaction[];
  title?: string;
  subtitle?: string;
  portalType: 'ADMIN' | 'MERCHANT';
  entityName?: string;
}

export const DailyVolumeChart: React.FC<DailyVolumeChartProps> = ({
  transactions,
  title,
  subtitle,
  portalType,
  entityName = portalType === 'ADMIN' ? 'All Merchants' : 'FoodFast'
}) => {
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(7);
  const [metricView, setMetricView] = useState<'volume' | 'count' | 'both'>('volume');

  // Palette customization based on portal role
  const isMerchant = portalType === 'MERCHANT';
  const primaryColor = isMerchant ? '#d97706' : '#4f46e5'; // Amber vs Indigo
  const secondaryColor = isMerchant ? '#2563eb' : '#06b6d4'; // Blue vs Cyan
  const successColor = '#10b981'; // Emerald

  // Process transactions into daily buckets for the selected time range
  const { chartData, metrics } = useMemo(() => {
    const buckets: {
      dateKey: string;
      label: string;
      fullDate: string;
      volume: number;
      successfulVolume: number;
      failedVolume: number;
      totalCount: number;
      successCount: number;
      failedCount: number;
    }[] = [];

    const now = new Date();

    // Create buckets in chronological order
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      buckets.push({
        dateKey,
        label,
        fullDate,
        volume: 0,
        successfulVolume: 0,
        failedVolume: 0,
        totalCount: 0,
        successCount: 0,
        failedCount: 0
      });
    }

    // Populate transaction data into buckets
    transactions.forEach((tx) => {
      if (!tx.transactionDate) return;
      const txDate = new Date(tx.transactionDate);
      if (isNaN(txDate.getTime())) return;
      const dateKey = txDate.toISOString().split('T')[0];

      const bucket = buckets.find((b) => b.dateKey === dateKey);
      if (bucket) {
        const amt = parseFloat(String(tx.amount)) || 0;
        bucket.volume += amt;
        bucket.totalCount += 1;

        if (tx.status === 'SUCCESS') {
          bucket.successfulVolume += amt;
          bucket.successCount += 1;
        } else if (tx.status === 'FAILED') {
          bucket.failedVolume += amt;
          bucket.failedCount += 1;
        }
      }
    });

    // Format numbers
    const processed = buckets.map((b) => ({
      ...b,
      volume: Math.round(b.volume * 100) / 100,
      successfulVolume: Math.round(b.successfulVolume * 100) / 100
    }));

    // Calculate aggregated summary metrics
    const totalVolume = processed.reduce((sum, b) => sum + b.volume, 0);
    const totalSuccessfulVolume = processed.reduce((sum, b) => sum + b.successfulVolume, 0);
    const totalCount = processed.reduce((sum, b) => sum + b.totalCount, 0);
    const avgDailyVolume = timeRange > 0 ? totalVolume / timeRange : 0;

    // Growth comparison: First half of range vs Second half of range
    const half = Math.floor(timeRange / 2);
    const firstHalfVolume = processed.slice(0, half).reduce((sum, b) => sum + b.volume, 0);
    const secondHalfVolume = processed.slice(half).reduce((sum, b) => sum + b.volume, 0);

    let growthPercentage = 0;
    if (firstHalfVolume > 0) {
      growthPercentage = ((secondHalfVolume - firstHalfVolume) / firstHalfVolume) * 100;
    } else if (secondHalfVolume > 0) {
      growthPercentage = 100;
    }

    // Peak day
    let peakDay = processed[0] || null;
    processed.forEach((b) => {
      if (!peakDay || b.volume > peakDay.volume) {
        peakDay = b;
      }
    });

    return {
      chartData: processed,
      metrics: {
        totalVolume,
        totalSuccessfulVolume,
        totalCount,
        avgDailyVolume,
        growthPercentage: Math.round(growthPercentage * 10) / 10,
        peakDay
      }
    };
  }, [transactions, timeRange]);

  const defaultTitle = isMerchant
    ? 'Daily Transaction Volume & Growth'
    : 'System-Wide Daily Transaction Volume';

  const defaultSubtitle = isMerchant
    ? `Growth trend for ${entityName} over the past ${timeRange} days`
    : `Platform-wide gross transaction growth and activity trends`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 transition-all">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-white ${
                isMerchant ? 'bg-amber-600' : 'bg-indigo-600'
              }`}
            >
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm tracking-tight">
              {title || defaultTitle}
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isMerchant
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {entityName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{subtitle || defaultSubtitle}</p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric View Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setMetricView('volume')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                metricView === 'volume'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Volume (₹)
            </button>
            <button
              onClick={() => setMetricView('count')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                metricView === 'count'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Txn Count
            </button>
            <button
              onClick={() => setMetricView('both')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                metricView === 'both'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Both
            </button>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            {([7, 14, 30] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  timeRange === r
                    ? isMerchant
                      ? 'bg-amber-600 text-white font-bold shadow-2xs'
                      : 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r}D
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick KPI Metric Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Period Volume</span>
            <IndianRupee className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            ₹{metrics.totalVolume.toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            ₹{metrics.totalSuccessfulVolume.toLocaleString('en-IN')} successful
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Daily Average</span>
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            ₹{Math.round(metrics.avgDailyVolume).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            across {timeRange} days
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Growth Trend</span>
            {metrics.growthPercentage >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            )}
          </div>
          <div
            className={`text-lg font-black mt-1 ${
              metrics.growthPercentage >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {metrics.growthPercentage >= 0 ? `+${metrics.growthPercentage}%` : `${metrics.growthPercentage}%`}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            vs previous half
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
          <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center justify-between">
            <span>Peak Day</span>
            <Activity className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-lg font-black text-slate-900 mt-1">
            ₹{metrics.peakDay ? metrics.peakDay.volume.toLocaleString('en-IN') : '0'}
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate">
            {metrics.peakDay ? metrics.peakDay.label : 'N/A'}
          </div>
        </div>
      </div>

      {/* Main Recharts Line Chart */}
      <div className="w-full h-72 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 15, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11 }}
            />
            {/* Primary Left Y-Axis for Volume */}
            {(metricView === 'volume' || metricView === 'both') && (
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => {
                  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
                  return `₹${value}`;
                }}
              />
            )}
            {/* Secondary Right Y-Axis for Transaction Count */}
            {(metricView === 'count' || metricView === 'both') && (
              <YAxis
                yAxisId="right"
                orientation={metricView === 'both' ? 'right' : 'left'}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => `${value} tx`}
              />
            )}

            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
            />

            {(metricView === 'volume' || metricView === 'both') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="volume"
                name="Total Volume (₹)"
                stroke={primaryColor}
                strokeWidth={2.5}
                dot={{ r: 4, fill: primaryColor, stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: primaryColor, stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {(metricView === 'volume' || metricView === 'both') && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="successfulVolume"
                name="Success Volume (₹)"
                stroke={successColor}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: successColor, stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: successColor, stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}

            {(metricView === 'count' || metricView === 'both') && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="totalCount"
                name="Transaction Count"
                stroke={secondaryColor}
                strokeWidth={2}
                dot={{ r: 3, fill: secondaryColor, stroke: '#ffffff', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: secondaryColor, stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Info / Live sync indicator */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 mt-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Real-time daily transaction volume aggregation
        </span>
        <span className="font-medium text-slate-500">
          {transactions.length} total recorded transactions
        </span>
      </div>
    </div>
  );
};

// Custom Tooltip component for sleek modern hover card
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-3 min-w-[190px] text-xs">
        <div className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-2">
          {data.fullDate || label}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Gross Volume:</span>
            <span className="font-bold text-slate-900">
              ₹{Number(data.volume || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-emerald-600 font-medium">Successful:</span>
            <span className="font-bold text-emerald-700">
              ₹{Number(data.successfulVolume || 0).toLocaleString('en-IN')}
            </span>
          </div>
          {data.failedVolume > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-rose-500 font-medium">Failed:</span>
              <span className="font-bold text-rose-600">
                ₹{Number(data.failedVolume || 0).toLocaleString('en-IN')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <span className="text-slate-500">Total Count:</span>
            <span className="font-bold text-slate-800">
              {data.totalCount} ({data.successCount} ok)
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
