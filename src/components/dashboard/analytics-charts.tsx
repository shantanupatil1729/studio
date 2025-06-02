'use client';

import type { CoreTask, TaskLog } from '@/lib/types';
import { BarChart, PieChart as RechartsPieChart, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"

interface AnalyticsChartsProps {
  taskLogs: TaskLog[];
  coreTasks: CoreTask[];
}

// Define a color palette for tasks if not provided in CoreTask
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82Ca9D'];

export function AnalyticsCharts({ taskLogs, coreTasks }: AnalyticsChartsProps) {
  if (coreTasks.length === 0 || taskLogs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No data to display yet.</p>
        <p>Start logging your tasks to see your analytics.</p>
      </div>
    );
  }

  // Process data for charts
  // Example: Pie chart for time distribution among core tasks
  const timeDistributionData = coreTasks.map((coreTask, index) => {
    const logsForThisTask = taskLogs.filter(log => log.coreTaskId === coreTask.id);
    // Assuming each log represents a fixed duration or an average duration for now
    // For accurate time, plannedTasks or log duration would be needed
    const totalFocusUnits = logsForThisTask.reduce((sum, log) => sum + (log.focusLevel || 0), 0); // Example: sum of focus levels
    const totalTimeEstimate = logsForThisTask.length * 30; // Placeholder: 30 mins per log entry

    return {
      name: coreTask.name,
      value: totalTimeEstimate, // Use a 'value' that represents time spent
      fill: coreTask.color || COLORS[index % COLORS.length],
    };
  }).filter(data => data.value > 0);


  // Example: Bar chart for focus levels per task
  const focusLevelData = coreTasks.map(coreTask => {
    const logs = taskLogs.filter(log => log.coreTaskId === coreTask.id);
    const avgFocus = logs.length > 0 ? logs.reduce((sum, log) => sum + log.focusLevel, 0) / logs.length : 0;
    return {
      name: coreTask.name,
      averageFocus: parseFloat(avgFocus.toFixed(1)),
    };
  });
  
  const chartConfigTime = Object.fromEntries(
    timeDistributionData.map(item => [item.name, { label: item.name, color: item.fill }])
  );
  
  const chartConfigFocus = Object.fromEntries(
    focusLevelData.map((item, index) => [item.name, { label: item.name, color: COLORS[index % COLORS.length] }])
  );


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Time Distribution</CardTitle>
          <CardDescription>How your focus time is allocated across tasks (estimated).</CardDescription>
        </CardHeader>
        <CardContent>
          {timeDistributionData.length > 0 ? (
            <ChartContainer config={chartConfigTime} className="mx-auto aspect-square max-h-[300px]">
              <RechartsPieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
                <Pie data={timeDistributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {timeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                 <ChartLegend content={<ChartLegendContent nameKey="name" />} />
              </RechartsPieChart>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-sm">Not enough data for time distribution chart.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-lg">Average Focus Levels</CardTitle>
           <CardDescription>Your average focus level per task.</CardDescription>
        </CardHeader>
        <CardContent>
          {focusLevelData.filter(d => d.averageFocus > 0).length > 0 ? (
            <ChartContainer config={chartConfigFocus} className="aspect-video max-h-[300px]">
              <BarChart data={focusLevelData} layout="vertical" margin={{ right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 5]} ticks={[0,1,2,3,4,5]} />
                <YAxis dataKey="name" type="category" width={80} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="averageFocus" radius={4}>
                   {focusLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          ) : (
             <p className="text-muted-foreground text-sm">Not enough data for focus level chart.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}