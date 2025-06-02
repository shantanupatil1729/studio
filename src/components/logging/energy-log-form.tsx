'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CoreTask, TaskLog } from '@/lib/types';
import { Smile, Meh, Frown, Zap, BatteryLow, BatteryMedium, BatteryFull } from 'lucide-react';
import { useState } from 'react';
import { categorizeEnergy } from '@/ai/flows/auto-categorize-energy'; // Assuming this flow is available client-side or via server action wrapper
import { useToast } from '@/hooks/use-toast';

interface EnergyLogFormProps {
  coreTasks: CoreTask[];
  onSubmitLog: (logData: Omit<TaskLog, 'id' | 'timestamp'>) => Promise<void>;
  onCancel: () => void;
}

const energyLogSchema = z.object({
  coreTaskId: z.string().min(1, "Please select a task"),
  focusLevel: z.coerce.number().min(1).max(5).int() as unknown as z.ZodNativeEnum<{[key: string]: 1 | 2 | 3 | 4 | 5}>, // 1-5
  energyInput: z.string().optional(),
});

type EnergyLogFormValues = z.infer<typeof energyLogSchema>;

const focusLevels = [
  { value: 1, label: 'Very Low', icon: <Frown className="h-5 w-5 text-red-500" /> },
  { value: 2, label: 'Low', icon: <Meh className="h-5 w-5 text-orange-500" /> },
  { value: 3, label: 'Medium', icon: <Meh className="h-5 w-5 text-yellow-500" /> },
  { value: 4, label: 'High', icon: <Smile className="h-5 w-5 text-lime-500" /> },
  { value: 5, label: 'Very High', icon: <Smile className="h-5 w-5 text-green-500" /> },
];


export function EnergyLogForm({ coreTasks, onSubmitLog, onCancel }: EnergyLogFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const form = useForm<EnergyLogFormValues>({
    resolver: zodResolver(energyLogSchema),
    defaultValues: {
      coreTaskId: coreTasks.length > 0 ? coreTasks[0].id : '',
      focusLevel: 3 as 1 | 2 | 3 | 4 | 5,
      energyInput: '',
    },
  });

  const handleSubmit = async (data: EnergyLogFormValues) => {
    setIsSubmitting(true);
    let energyCategory: 'positive' | 'negative' | 'neutral' | undefined = undefined;
    if (data.energyInput && data.energyInput.trim() !== '') {
      try {
        const categoryResult = await categorizeEnergy({ energyInput: data.energyInput });
        energyCategory = categoryResult.category.toLowerCase() as 'positive' | 'negative' | 'neutral';
      } catch (error) {
        console.error("AI categorization error:", error);
        toast({title: "AI Info", description: "Could not auto-categorize energy input.", variant: "default"});
      }
    }

    const logData: Omit<TaskLog, 'id' | 'timestamp'> = {
      ...data,
      focusLevel: data.focusLevel as 1 | 2 | 3 | 4 | 5, // Ensure type
      energyCategory,
    };
    
    try {
      await onSubmitLog(logData);
    } catch (error) {
      // Error handling is done by parent (LoggingModal)
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="coreTaskId">What task are you working on?</Label>
        <Select 
          value={form.watch('coreTaskId')} 
          onValueChange={(value) => form.setValue('coreTaskId', value)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="coreTaskId">
            <SelectValue placeholder="Select a core task" />
          </SelectTrigger>
          <SelectContent>
            {coreTasks.map(task => (
              <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.coreTaskId && <p className="text-sm text-destructive mt-1">{form.formState.errors.coreTaskId.message}</p>}
      </div>

      <div>
        <Label>How focused do you feel?</Label>
        <RadioGroup
          defaultValue={String(form.getValues('focusLevel'))}
          onValueChange={(value) => form.setValue('focusLevel', parseInt(value, 10) as 1 | 2 | 3 | 4 | 5)}
          className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2"
          disabled={isSubmitting}
        >
          {focusLevels.map(level => (
            <Label
              key={level.value}
              htmlFor={`focus-${level.value}`}
              className="flex flex-col items-center space-y-1 p-3 border rounded-md cursor-pointer hover:bg-accent hover:text-accent-foreground data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground [&:has([data-state=checked])]:bg-primary [&:has([data-state=checked])]:text-primary-foreground"
            >
              <RadioGroupItem value={String(level.value)} id={`focus-${level.value}`} className="sr-only" />
              {level.icon}
              <span className="text-xs">{level.label}</span>
            </Label>
          ))}
        </RadioGroup>
        {form.formState.errors.focusLevel && <p className="text-sm text-destructive mt-1">{form.formState.errors.focusLevel.message}</p>}
      </div>

      <div>
        <Label htmlFor="energyInput">Describe your energy (optional)</Label>
        <Textarea
          id="energyInput"
          placeholder="E.g., 'Feeling energized and productive', 'A bit tired but pushing through'"
          {...form.register('energyInput')}
          rows={3}
          disabled={isSubmitting}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Logging...' : 'Log Focus'}
        </Button>
      </div>
    </form>
  );
}