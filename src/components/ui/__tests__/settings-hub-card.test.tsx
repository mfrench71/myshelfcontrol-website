/**
 * Unit Tests for components/ui/settings-hub-card.tsx
 * Tests for settings hub card and sidebar link components
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Settings, User, Bell } from 'lucide-react';
import { SettingsHubCard, SettingsSidebarLink } from '../settings-hub-card';

describe('SettingsHubCard', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
        />
      );

      expect(screen.getByText('General Settings')).toBeInTheDocument();
    });

    it('renders description', () => {
      render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
        />
      );

      expect(screen.getByText('Manage your preferences')).toBeInTheDocument();
    });

    it('renders as a link to href', () => {
      render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
        />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '/settings/general');
    });

    it('renders icon', () => {
      const { container } = render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
        />
      );

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders chevron icon', () => {
      const { container } = render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
        />
      );

      // ChevronRight should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThanOrEqual(2); // At least icon + chevron
    });
  });

  describe('badge', () => {
    it('does not render badge when not provided', () => {
      render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
        />
      );

      const badges = document.querySelectorAll('.rounded-full');
      // Only the icon container might be rounded, but not a badge
      const badgeSpans = document.querySelectorAll('span.rounded-full');
      expect(badgeSpans.length).toBe(0);
    });

    it('does not render badge when value is 0', () => {
      render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
          badge={0}
        />
      );

      const badgeSpans = document.querySelectorAll('span.rounded-full');
      expect(badgeSpans.length).toBe(0);
    });

    it('renders badge with count', () => {
      render(
        <SettingsHubCard
          icon={Bell}
          title="Notifications"
          description="Manage notifications"
          href="/settings/notifications"
          badge={5}
        />
      );

      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('renders danger badge variant by default', () => {
      render(
        <SettingsHubCard
          icon={Bell}
          title="Notifications"
          description="Manage notifications"
          href="/settings/notifications"
          badge={3}
        />
      );

      const badge = screen.getByText('3');
      expect(badge.classList.contains('bg-red-500')).toBe(true);
    });

    it('renders warning badge variant', () => {
      render(
        <SettingsHubCard
          icon={Bell}
          title="Notifications"
          description="Manage notifications"
          href="/settings/notifications"
          badge={3}
          badgeVariant="warning"
        />
      );

      const badge = screen.getByText('3');
      expect(badge.classList.contains('bg-amber-500')).toBe(true);
    });
  });

  describe('active state', () => {
    it('applies active styling when isActive is true', () => {
      const { container } = render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
          isActive={true}
        />
      );

      const link = container.querySelector('.settings-hub-card');
      expect(link?.classList.contains('border-primary')).toBe(true);
    });

    it('applies default styling when isActive is false', () => {
      const { container } = render(
        <SettingsHubCard
          icon={Settings}
          title="General Settings"
          description="Manage your preferences"
          href="/settings/general"
          isActive={false}
        />
      );

      const link = container.querySelector('.settings-hub-card');
      expect(link?.classList.contains('border-gray-200')).toBe(true);
    });
  });
});

describe('SettingsSidebarLink', () => {
  describe('rendering', () => {
    it('renders title', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
        />
      );

      expect(screen.getByText('Profile')).toBeInTheDocument();
    });

    it('renders as a link to href', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
        />
      );

      const link = screen.getByRole('link', { name: 'Profile' });
      expect(link).toHaveAttribute('href', '/settings/profile');
    });

    it('renders icon', () => {
      const { container } = render(
        <SettingsSidebarLink
          icon={Settings}
          title="General"
          href="/settings/general"
        />
      );

      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('badge', () => {
    it('does not render badge when not provided', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
        />
      );

      const badgeSpans = document.querySelectorAll('span.rounded-full');
      expect(badgeSpans.length).toBe(0);
    });

    it('does not render badge when value is 0', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          badge={0}
        />
      );

      const badgeSpans = document.querySelectorAll('span.rounded-full');
      expect(badgeSpans.length).toBe(0);
    });

    it('renders badge with count', () => {
      render(
        <SettingsSidebarLink
          icon={Bell}
          title="Notifications"
          href="/settings/notifications"
          badge={7}
        />
      );

      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('renders danger badge variant by default', () => {
      render(
        <SettingsSidebarLink
          icon={Bell}
          title="Notifications"
          href="/settings/notifications"
          badge={2}
        />
      );

      const badge = screen.getByText('2');
      expect(badge.classList.contains('bg-red-500')).toBe(true);
    });

    it('renders warning badge variant', () => {
      render(
        <SettingsSidebarLink
          icon={Bell}
          title="Notifications"
          href="/settings/notifications"
          badge={2}
          badgeVariant="warning"
        />
      );

      const badge = screen.getByText('2');
      expect(badge.classList.contains('bg-amber-500')).toBe(true);
    });
  });

  describe('active state', () => {
    it('applies active styling when isActive is true', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={true}
        />
      );

      const link = screen.getByRole('link', { name: 'Profile' });
      expect(link.classList.contains('bg-primary/10')).toBe(true);
      expect(link.classList.contains('text-primary')).toBe(true);
    });

    it('applies default styling when isActive is false', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={false}
        />
      );

      const link = screen.getByRole('link', { name: 'Profile' });
      expect(link.classList.contains('text-gray-600')).toBe(true);
    });
  });

  describe('sub-links', () => {
    const subLinks = [
      { label: 'Account', href: '#account' },
      { label: 'Security', href: '#security' },
      { label: 'Privacy', href: '#privacy' },
    ];

    it('does not render sub-links when not active', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={false}
          subLinks={subLinks}
        />
      );

      expect(screen.queryByText('Account')).not.toBeInTheDocument();
      expect(screen.queryByText('Security')).not.toBeInTheDocument();
      expect(screen.queryByText('Privacy')).not.toBeInTheDocument();
    });

    it('renders sub-links when active', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={true}
          subLinks={subLinks}
        />
      );

      expect(screen.getByText('Account')).toBeInTheDocument();
      expect(screen.getByText('Security')).toBeInTheDocument();
      expect(screen.getByText('Privacy')).toBeInTheDocument();
    });

    it('renders sub-links with correct hrefs', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={true}
          subLinks={subLinks}
        />
      );

      expect(screen.getByText('Account').closest('a')).toHaveAttribute('href', '#account');
      expect(screen.getByText('Security').closest('a')).toHaveAttribute('href', '#security');
      expect(screen.getByText('Privacy').closest('a')).toHaveAttribute('href', '#privacy');
    });

    it('renders sub-links nav with aria-label', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={true}
          subLinks={subLinks}
        />
      );

      const nav = screen.getByRole('navigation', { name: 'Profile sections' });
      expect(nav).toBeInTheDocument();
    });

    it('does not render sub-links nav when subLinks is empty', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={true}
          subLinks={[]}
        />
      );

      expect(screen.queryByRole('navigation', { name: 'Profile sections' })).not.toBeInTheDocument();
    });

    it('does not render sub-links nav when subLinks is not provided', () => {
      render(
        <SettingsSidebarLink
          icon={User}
          title="Profile"
          href="/settings/profile"
          isActive={true}
        />
      );

      expect(screen.queryByRole('navigation', { name: 'Profile sections' })).not.toBeInTheDocument();
    });
  });
});
