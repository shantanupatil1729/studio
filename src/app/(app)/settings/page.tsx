'use client';

import { PreferencesForm } from '@/components/settings/preferences-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ListChecks } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-headline font-bold">Settings</h1>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Core Tasks</CardTitle>
          <CardDescription>Manage your 3 main personal or professional goals.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Your core tasks are the foundation of your focus tracking. You can edit them here.
          </p>
          <Link href="/core-tasks" passHref>
            <Button variant="outline">
              <ListChecks className="mr-2 h-4 w-4" /> Edit Core Tasks
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Preferences</CardTitle>
          <CardDescription>Customize your FocusFlow experience.</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm />
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl">Account</CardTitle>
          <CardDescription>Manage your account settings.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-sm text-muted-foreground">Further account management options can be added here, like changing password or deleting account.</p>
           {/* Placeholder for future