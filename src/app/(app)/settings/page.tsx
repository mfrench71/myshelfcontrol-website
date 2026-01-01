/**
 * Settings Page - Redirects to Profile
 */
import { redirect } from 'next/navigation';

export default function SettingsPage() {
  redirect('/settings/profile');
}
