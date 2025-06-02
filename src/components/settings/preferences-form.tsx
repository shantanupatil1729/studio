'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/auth-provider';
import { getUserPreferences, updateUserPreferences } from '@/services/firestore-service';
import type { UserPreferences } from '@/lib/types';
import { BellRing } from 'lucide-react';

const defaultReminderTimes = ["09:00", "12:00", "15:00", "18:00", "21:00"];
const availableTimes = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

const preferencesSchema = z.object({
  reminderTimes: z.array(z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format")).min(1, "Select at least one reminder time."),
});

type PreferencesFormValues = z.infer<typeof preferencesSchema>;

export function PreferencesForm() {
  const { user, userProfile, updateUserProfile: updateAuthProviderProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { toast } = useToast();

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      reminderTimes: defaultReminderTimes,
    },
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      if (user) {
        setInitialLoading(true);
        try {
          const prefs = await getUserPreferences(user.uid);
          if (prefs) {
            form.reset({ reminderTimes: prefs.reminderTimes });
          }
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to load preferences.', variant: 'destructive' });
        } finally {
          setInitialLoading(false);
        }
      }
    };
    fetchPreferences();
  }, [user, form, toast]);

  const onSubmit = async (data: PreferencesFormValues) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await updateUserPreferences(user.uid, data);
      if (updateAuthProviderProfile) {
        await updateAuthProviderProfile(data); // Update context state
      }
      toast({ title: 'Success', description: 'Preferences saved successfully!' });
    } catch (error: any) {
      toast({
        title: 'Save Failed',
        description: error.message || 'Could not save preferences.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <p>Loading preferences...</p>;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label className="text-base font-medium flex items-center mb-2">
          <BellRing className="h-5 w-5 mr-2 text-primary" /> Reminder Times
        </Label>
        <p className="text-sm text-muted-foreground mb-4">
          Select when you'd like to receive prompts to log your focus. (Note: Actual notifications not implemented in this scaffold).
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {availableTimes.map((time) => (
            <div key={time} className="flex items-center space-x-2">
              <Checkbox
                id={`time-${time}`}
                checked={form.watch('reminderTimes')?.includes(time)}
                onCheckedChange={(checked) => {
                  const currentTimes = form.getValues('reminderTimes') || [];
                  if (checked) {
                    form.setValue('reminderTimes', [...currentTimes, time].sort());
                  } else {
                    form.setValue('reminderTimes', currentTimes.filter((t) => t !== time).sort());
                  }
                }}
              />
              <Label htmlFor={`time-${time}`} className="font-normal cursor-pointer">{time}</Label>
            </div>
          ))}
        </div>
        {form.formState.errors.reminderTimes && (
          <p className="text-sm text-destructive mt-2">{form.formState.errors.reminderTimes.message}</p>
        )}
      </div>
      
      {/* Placeholder for Visual Layout Customization */}
      {/* <div>
        <Label className="text-base font-medium">Visual Layout</Label>
        <p className="text-sm text-muted-foreground mb-2">Choose your preferred theme.</p>
        <RadioGroup defaultValue={userProfile?.theme || 'light'}>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="theme-light" />
                <Label htmlFor="theme-light">Light</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="theme-dark" />
                <Label htmlFor="theme-dark">Dark</Label>
            </div>
        </RadioGroup>
      </div> */}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save Preferences'}
      </Button>
    </form>
  );
}