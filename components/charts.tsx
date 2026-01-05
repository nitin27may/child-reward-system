'use client'

import { useEffect, useState } from 'react'

interface WeeklyChartProps {
  data: { day: string; points: number }[]
}

export function WeeklyAreaChart({ data }: WeeklyChartProps) {
  const [Chart, setChart] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    // Dynamically import recharts only on client side
    import('recharts').then((mod) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod
      
      const ChartComponent = ({ chartData }: { chartData: typeof data }) => (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Area
              type="monotone"
              dataKey="points"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorPoints)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )
      
      setChart(() => ChartComponent)
    })
  }, [])

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-slate-500">
        <p>No data for this week yet. Start tracking!</p>
      </div>
    )
  }

  if (!Chart) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <Chart chartData={data} />
}

interface HistoryChartProps {
  data: { week: string; earned: number; allowance: number }[]
}

export function HistoryBarChart({ data }: HistoryChartProps) {
  const [Chart, setChart] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    // Dynamically import recharts only on client side
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = mod
      
      const ChartComponent = ({ chartData }: { chartData: typeof data }) => (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} barGap={8}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="week" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar dataKey="earned" fill="#3b82f6" name="Screen Time (min)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
      
      setChart(() => ChartComponent)
    })
  }, [])

  if (data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500">
        <p>Complete weekly reviews to see history</p>
      </div>
    )
  }

  if (!Chart) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <Chart chartData={data} />
}

// Daily Breakdown Bar Chart for Weekly page
interface DailyBreakdownChartProps {
  data: { day: string; points: number }[]
}

export function DailyBreakdownBarChart({ data }: DailyBreakdownChartProps) {
  const [Chart, setChart] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    import('recharts').then((mod) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod
      
      const ChartComponent = ({ chartData }: { chartData: typeof data }) => (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Bar dataKey="points" fill="#3b82f6" name="Total Points" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )
      
      setChart(() => ChartComponent)
    })
  }, [])

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-slate-500">
        <p>No tracking data for this week</p>
      </div>
    )
  }

  if (!Chart) {
    return (
      <div className="h-[280px] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <Chart chartData={data} />
}

// Screen Time Pie Chart for Weekly page
interface ScreenTimePieChartProps {
  data: { name: string; value: number; fill: string }[]
  usagePercentage: number
}

export function ScreenTimePieChart({ data, usagePercentage }: ScreenTimePieChartProps) {
  const [Chart, setChart] = useState<React.ComponentType<any> | null>(null)

  useEffect(() => {
    import('recharts').then((mod) => {
      const { PieChart, Pie, Cell, ResponsiveContainer } = mod
      
      const ChartComponent = ({ chartData, percentage }: { chartData: typeof data; percentage: number }) => (
        <div className="relative mx-auto w-36 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
            <span className="text-xs text-slate-500">used</span>
          </div>
        </div>
      )
      
      setChart(() => ChartComponent)
    })
  }, [])

  if (!Chart) {
    return (
      <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <Chart chartData={data} percentage={usagePercentage} />
}
