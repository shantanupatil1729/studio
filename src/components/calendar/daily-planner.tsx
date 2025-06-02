'use client';

import type { CoreTask, PlannedTask } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addPlannedTask, updatePlannedTask, deletePlannedTask } from '@/services/firestore-service';
import { useAuth } from '@/contexts/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { PlusCircle, Edit3, Trash2, CalendarDays } from 'lucide-react';

interface DailyPlannerProps {
  coreTasks: CoreTask[];
  plannedTasks: PlannedTask[];
  setPlannedTasks: React.Dispatch<React.SetStateAction<PlannedTask[]>>;
}

const plannedTaskSchema = z.object({
  date: z.string(),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid start time"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid end time"),
  coreTaskId: z.string().min(1, "Please select a core task"),
  title: z.string().optional(),
}).refine(data => data.startTime < data.endTime, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type PlannedTaskFormValues = z.infer<typeof plannedTaskSchema>;

export function DailyPlanner({ coreTasks, plannedTasks, setPlannedTasks }: DailyPlannerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannedTask | null>(null);

  const form = useForm<PlannedTaskFormValues>({
    resolver: zodResolver(plannedTaskSchema),
  });

  useEffect(() => {
    if (editingTask) {
      form.reset({
        date: editingTask.date,
        startTime: editingTask.startTime,
        endTime: editingTask.endTime,
        coreTaskId: editingTask.coreTaskId,
        title: editingTask.title || '',
      });
    } else if (selectedDate) {
      form.reset({
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        coreTaskId: '',
        title: '',
      });
    }
  }, [editingTask, selectedDate, form]);
  
  const tasksForSelectedDate = selectedDate 
    ? plannedTasks.filter(task => task.date === format(selectedDate, 'yyyy-MM-dd')).sort((a,b) => a.startTime.localeCompare(b.startTime))
    : [];

  const onSubmit = async (data: PlannedTaskFormValues) => {
    if (!user) return;
    try {
      if (editingTask && editingTask.id) {
        await updatePlannedTask(user.uid, editingTask.id, data);
        setPlannedTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...data } : t));
        toast({ title: 'Task Updated', description: 'Your scheduled task has been updated.' });
      } else {
        const newTaskId = await addPlannedTask(user.uid, data);
        setPlannedTasks(prev => [...prev, { id: newTaskId, ...data }]);
        toast({ title: 'Task Scheduled', description: 'Your task has been added to the calendar.' });
      }
      setIsModalOpen(false);
      setEditingTask(null);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save task.', variant: 'destructive' });
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!user || !taskId) return;
    try {
      await deletePlannedTask(user.uid, taskId);
      setPlannedTasks(prev => prev.filter(t => t.id !== taskId));
      toast({title: 'Task Deleted', description: 'Scheduled task removed.'});
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete task.', variant: 'destructive'});
    }
  };

  const openEditModal = (task: PlannedTask) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };
  
  const openAddModal = () => {
    setEditingTask(null); // Clear any editing state
    if (selectedDate) { // Ensure selectedDate is set before resetting form for "add"
      form.reset({
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        coreTaskId: coreTasks.length > 0 ? coreTasks[0].id : '', // Default to first core task if available
        title: '',
      });
    }
    setIsModalOpen(true);
  };


  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="rounded-md border shadow-sm"
          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate()-1)) && !isSameDay(date, new Date()) } // Allow today, disable past days
        />
      </div>
      <div className="md:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-headline">
            Tasks for: {selectedDate ? format(selectedDate, 'PPP') : 'Select a date'}
          </h2>
          <Button onClick={openAddModal} size="sm" disabled={!selectedDate || coreTasks.length === 0}>
            <PlusCircle className="h-4 w-4 mr-2" /> Add Task
          </Button>
        </div>
        {coreTasks.length === 0 && selectedDate && (
           <p className="text-muted-foreground text-sm">Please define your <Link href="/core-tasks" className="text-primary underline">Core Tasks</Link> first to schedule activities.</p>
        )}
        {selectedDate && tasksForSelectedDate.length > 0 ? (
          <ul className="space-y-3">
            {tasksForSelectedDate.map(task => {
              const coreTaskDetails = coreTasks.find(ct => ct.id === task.coreTaskId);
              return (
                <li key={task.id} className="p-3 border rounded-lg shadow-sm bg-card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-primary">{coreTaskDetails?.name || 'Unknown Task'}</p>
                      {task.title && <p className="text-sm text-muted-foreground">{task.title}</p>}
                      <p className="text-xs text-muted-foreground">
                        <CalendarDays className="h-3 w-3 inline-block mr-1" />
                        {task.startTime} - {task.endTime}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(task)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(task.id!)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : selectedDate && coreTasks.length > 0 ? (
          <p className="text-muted-foreground text-center py-4">No tasks scheduled for this day.</p>
        ) : null}
      </div>

      <Dialog open={isModalOpen} onOpenChange={(isOpen) => { setIsModalOpen(isOpen); if (!isOpen) setEditingTask(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">{editingTask ? 'Edit Task' : 'Schedule New Task'}</DialogTitle>
            <DialogDescription>
              {selectedDate ? `For ${format(selectedDate, 'PPP')}` : ''}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="coreTaskId">Core Task</Label>
              <Select value={form.watch('coreTaskId')} onValueChange={(value) => form.setValue('coreTaskId', value)}>
                <SelectTrigger id="coreTaskId">
                  <SelectValue placeholder="Select a core task" />
                </SelectTrigger>
                <SelectContent>
                  {coreTasks.map(ct => (
                    <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.coreTaskId && <p className="text-sm text-destructive mt-1">{form.formState.errors.coreTaskId.message}</p>}
            </div>
            <div>
              <Label htmlFor="title">Specific Title (Optional)</Label>
              <Input id="title" {...form.register('title')} placeholder="E.g., Morning coding session" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input id="startTime" type="time" {...form.register('startTime')} />
                {form.formState.errors.startTime && <p className="text-sm text-destructive mt-1">{form.formState.errors.startTime.message}</p>}
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input id="endTime" type="time" {...form.register('endTime')} />
                {form.formState.errors.endTime && <p className="text-sm text-destructive mt-1">{form.formState.errors.endTime.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setIsModalOpen(false); setEditingTask(null); }}>Cancel</Button>
              <Button type="submit">Save Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper function to compare dates without time
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Need Link for navigating to core tasks
import Link from 'next/link';