'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { EnergyLogForm } from './energy-log-form';
import type { CoreTask, TaskLog } from '@/lib/types';
import { useAuth } from '@/contexts/auth-provider';
import { addTaskLog } from '@/services/firestore-service';
import { useToast } from '@/hooks/use-toast';
import { Activity } from 'lucide-react';

interface LoggingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coreTasks: CoreTask[];
  onLogSubmitted: (newLog: TaskLog) => void; // To update local state if needed
}

export function LoggingModal({ isOpen, onClose, coreTasks, onLogSubmitted }: LoggingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmitLog = async (logData: Omit<TaskLog, 'id' | 'timestamp'>) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    try {
      const newLogId = await addTaskLog(user.uid, logData);
      // Construct the full log object to pass back (timestamp will be server-generated, this is an approximation)
      const fullLog: TaskLog = { 
        ...logData, 
        id: newLogId, 
        timestamp: { seconds: Date.now()/1000, nanoseconds: 0 } as any // Approximate client-side timestamp
      };
      onLogSubmitted(fullLog);
      toast({ title: 'Focus Logged!', description: 'Your current focus has been recorded.' });
      onClose();
    } catch (error) {
      toast({ title: 'Logging Failed', description: 'Could not save your focus log.', variant: 'destructive' });
    }
  };
  
  if (coreTasks.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Log Your Focus</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground py-4">
            Please set up your <a href="/core-tasks" className="text-primary underline">Core Tasks</a> first before logging your focus.
          </p>
        </DialogContent>
      </Dialog>
    );
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Log Your Focus</DialogTitle>
          <DialogDescription>
            Tell us what you&apos;re working on and how you feel. This helps track your energy patterns.
          </DialogDescription>
        </DialogHeader>
        <EnergyLogForm
          coreTasks={coreTasks}
          onSubmitLog={handleSubmitLog}
          onCancel={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}