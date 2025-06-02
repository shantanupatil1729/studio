
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DailyPlanner } from '@/components/calendar/daily-planner';
import { LoggingModal } from '@/components/logging/logging-modal';
import { AnalyticsCharts } from '@/components/dashboard/analytics-charts';
import { useAuth } from '@/contexts/auth-provider';
import type { CoreTask, PlannedTask, TaskLog } from '@/lib/types';
import { getCoreTasks, getPlannedTasksForDateRange, getTaskLogsForPeriod } from '@/services/firestore-service';
import { Lightbulb, Download, CheckCircle, ListChecks } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { getProductivitySuggestions } from '@/ai/flows/productivity-suggestions';
import { generateWeeklySummary } from '@/ai/flows/weekly-summary';
import { useRouter } from 'next/navigation';

// Helper to convert TaskLog[] to JSON string for AI
const formatTaskLogsForAI = (logs: TaskLog[]): string => {
  return JSON.stringify(logs.map(log => ({
    taskId: log.coreTaskId,
    focus: log.focusLevel,
    energyText: log.energyInput,
    category: log.energyCategory,
    timestamp: log.timestamp.toDate().toISOString(), // Convert Firestore Timestamp to ISO string
  })));
};


export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const [coreTasks, setCoreTasks] = useState<CoreTask[]>([]);
  const [plannedTasks, setPlannedTasks] = useState<PlannedTask[]>([]);
  const [taskLogs, setTaskLogs] = useState<TaskLog[]>([]);
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [aiSuggestions, setAISuggestions] = useState<string[]>([]);
  const [aiWeeklySummary, setAIWeeklySummary] = useState<string>('');
  const [loadingAI, setLoadingAI] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const tasks = await getCoreTasks(user.uid);
        setCoreTasks(tasks);
        
        const today = new Date();
        const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
        const plans = await getPlannedTasksForDateRange(user.uid, monthStart, monthEnd);
        setPlannedTasks(plans);

        const weekStart = startOfWeek(today, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
        const logs = await getTaskLogsForPeriod(user.uid, weekStart, weekEnd);
        setTaskLogs(logs);
      };
      fetchData();
    }
  }, [user]);

  const handleFetchAISuggestions = async () => {
    if (!user || taskLogs.length === 0) {
      // Handle no data case
      setAISuggestions(["Not enough data for suggestions yet. Keep logging your tasks!"]);
      setAIWeeklySummary("No summary available due to insufficient data.");
      setShowAISuggestions(true);
      return;
    }
    setLoadingAI(true);
    try {
      const weeklySummaryInput = {
        userId: user.uid,
        startDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        endDate: format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        taskLogs: formatTaskLogsForAI(taskLogs),
      };
      const summaryResult = await generateWeeklySummary(weeklySummaryInput);
      setAIWeeklySummary(summaryResult.summary);
      
      const productivityInput = {
        weeklySummary: summaryResult.summary,
        userPreferences: userProfile?.reminderTimes?.join(', ') || 'Default schedule',
      };
      const suggestionsResult = await getProductivitySuggestions(productivityInput);
      setAISuggestions(suggestionsResult.suggestions);
      setShowAISuggestions(true);
    } catch (error) {
      console.error("AI suggestions error:", error);
      setAISuggestions(["Could not fetch suggestions at this time."]);
      setAIWeeklySummary("Failed to generate weekly summary.");
    } finally {
      setLoadingAI(false);
    }
  };
  
  if (userProfile && !userProfile.coreTasksSet) {
    return (
      <div className="text-center py-10">
        <ListChecks className="mx-auto h-12 w-12 text-primary mb-4" />
        <h2 className="text-2xl font-headline mb-2">Welcome to FocusFlow!</h2>
        <p className="mb-4 text-muted-foreground">Please set up your 3 core tasks to get started.</p>
        <Button onClick={() => router.push('/core-tasks')}>Set Core Tasks</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-3xl">Daily Planner</CardTitle>
            <CardDescription>Schedule your focus time for your core tasks.</CardDescription>
          </div>
          <Button onClick={() => setIsLoggingModalOpen(true)}>Log Current Focus</Button>
        </CardHeader>
        <CardContent>
          <DailyPlanner coreTasks={coreTasks} plannedTasks={plannedTasks} setPlannedTasks={setPlannedTasks} />
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Analytics Overview</CardTitle>
            <CardDescription>Visualize your time allocation.</CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsCharts taskLogs={taskLogs} coreTasks={coreTasks} />
             <Button variant="outline" className="mt-4 w-full">
              <Download className="mr-2 h-4 w-4" /> Export Data (CSV/JSON)
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">AI Productivity Insights</CardTitle>
            <CardDescription>Get weekly summaries and tips.</CardDescription>
          </CardHeader>
          <CardContent>
            {!showAISuggestions && (
              <Button onClick={handleFetchAISuggestions} disabled={loadingAI} className="w-full">
                <Lightbulb className="mr-2 h-4 w-4" /> {loadingAI ? 'Generating Insights...' : 'Get AI Suggestions'}
              </Button>
            )}
            {showAISuggestions && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-1">Weekly Summary:</h4>
                  <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">{aiWeeklySummary || "No summary available."}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Productivity Tips:</h4>
                  {aiSuggestions.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      {aiSuggestions.map((tip, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-accent flex-shrink-0" />
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No suggestions available.</p>
                  )}
                </div>
                <Button variant="ghost" onClick={() => setShowAISuggestions(false)} className="w-full text-primary">
                  Hide Suggestions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <LoggingModal
        isOpen={isLoggingModalOpen}
        onClose={() => setIsLoggingModalOpen(false)}
        coreTasks={coreTasks}
        onLogSubmitted={(newLog) => setTaskLogs(prev => [...prev, newLog])}
      />
    </div>
  );
}
