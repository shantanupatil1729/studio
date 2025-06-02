'use client';

import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-provider';
import { getCoreTasks, setCoreTasks } from '@/services/firestore-service';
import type { CoreTask } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Trash2, PlusCircle } from 'lucide-react';

const coreTaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Task name cannot be empty').max(50, 'Task name too long'),
  // color: z.string().optional(), // Add color picker later if needed
});

const coreTasksFormSchema = z.object({
  tasks: z.array(coreTaskSchema).length(3, 'Please define exactly 3 core tasks.'),
});

type CoreTasksFormValues = z.infer<typeof coreTasksFormSchema>;

const defaultTasks: CoreTask[] = [
  { id: 'task1', name: '' },
  { id: 'task2', name: '' },
  { id: 'task3', name: '' },
];

export function CoreTasksForm() {
  const { user, userProfile, updateUserProfile: updateAuthProviderProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CoreTasksFormValues>({
    resolver: zodResolver(coreTasksFormSchema),
    defaultValues: {
      tasks: defaultTasks,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "tasks",
  });

  useEffect(() => {
    const fetchTasks = async () => {
      if (user) {
        setInitialLoading(true);
        try {
          const existingTasks = await getCoreTasks(user.uid);
          if (existingTasks && existingTasks.length > 0) {
            form.reset({ tasks: existingTasks.slice(0,3) as [CoreTask, CoreTask, CoreTask] }); // Ensure 3 tasks
          } else {
            form.reset({tasks: defaultTasks});
          }
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to load existing tasks.', variant: 'destructive' });
          form.reset({tasks: defaultTasks});
        } finally {
          setInitialLoading(false);
        }
      }
    };
    fetchTasks();
  }, [user, form, toast]);


  const onSubmit = async (data: CoreTasksFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await setCoreTasks(user.uid, data.tasks);
      // Update userProfile in AuthContext and Firestore
      if (updateAuthProviderProfile) {
         await updateAuthProviderProfile({ coreTasksSet: true });
      }
      toast({ title: 'Success', description: 'Core tasks saved successfully!' });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save core tasks.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  if (initialLoading) {
    return <Card className="w-full max-w-lg mx-auto"><CardHeader><CardTitle>Loading Core Tasks...</CardTitle></CardHeader><CardContent><p>Please wait...</p></CardContent></Card>;
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Define Your Core Focus Areas</CardTitle>
        <CardDescription>
          What are the 3 main personal or professional goals you want to focus on?
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`tasks.${index}.name`}>Core Task #{index + 1}</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id={`tasks.${index}.name`}
                  placeholder={`E.g., Project Phoenix, Learn Spanish, Fitness`}
                  {...form.register(`tasks.${index}.name`)}
                  disabled={loading}
                  className="flex-grow"
                />
                {/* Fields are fixed at 3, so no add/remove buttons needed based on schema */}
              </div>
              {form.formState.errors.tasks?.[index]?.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.tasks?.[index]?.name?.message}
                </p>
              )}
            </div>
          ))}
           {form.formState.errors.tasks && typeof form.formState.errors.tasks === 'object' && 'message' in form.formState.errors.tasks && (
            <p className="text-sm text-destructive">{form.formState.errors.tasks.message}</p>
           )}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Save Core Tasks'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}