import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SystemService, SystemSettingItem, FeatureFlagItem } from '@/services/api/system-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { Skeleton } from '@/components/common/Skeleton';
import {
  Settings,
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  Plus,
  Activity,
  CheckCircle2,
  AlertCircle,
  Radio,
  Server,
  Zap
} from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  useDocumentTitle('Platform System Settings & Governance');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [newFlagKey, setNewFlagKey] = useState('');
  const [newFlagDesc, setNewFlagDesc] = useState('');
  const [isFlagModalOpen, setIsFlagModalOpen] = useState(false);

  // Component-level overrides for 0ms instant UI toggle response
  const [settingOverrides, setSettingOverrides] = useState<Record<string, boolean>>({});
  const [flagOverrides, setFlagOverrides] = useState<Record<string, boolean>>({});

  // Queries
  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => SystemService.getSettings(),
  });

  const { data: featureFlags, isLoading: isLoadingFlags } = useQuery({
    queryKey: ['admin-feature-flags'],
    queryFn: () => SystemService.getFeatureFlags(),
  });

  const { data: healthReadiness } = useQuery({
    queryKey: ['system-health-readiness'],
    queryFn: () => SystemService.getReadiness(),
    refetchInterval: 10000,
  });

  // Helper to strictly normalize boolean setting values (handles boolean, "true", "false", 1, 0)
  const parseBooleanSetting = (val: any, defaultVal: boolean = false): boolean => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true' || val === '1';
    }
    if (typeof val === 'number') return val === 1;
    return defaultVal;
  };

  // Safe helper to find setting value (checks local overrides first)
  const getSettingValue = (key: string, defaultValue: boolean = false): boolean => {
    if (key in settingOverrides) {
      return settingOverrides[key];
    }
    if (!settings) return defaultValue;
    const item = (settings as SystemSettingItem[]).find((s) => s.key === key);
    if (!item) return defaultValue;
    return parseBooleanSetting(item.value, defaultValue);
  };

  // Safe helper for feature flag enabled state
  const getFlagEnabled = (flag: FeatureFlagItem): boolean => {
    if (flag.key in flagOverrides) {
      return flagOverrides[flag.key];
    }
    return flag.enabled;
  };

  // System Setting Toggle Mutation with Optimistic Updates
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return SystemService.updateSetting(key, value);
    },
    onMutate: async ({ key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-settings'] });
      const previousSettings = queryClient.getQueryData<SystemSettingItem[]>(['admin-settings']);
      if (previousSettings) {
        queryClient.setQueryData<SystemSettingItem[]>(
          ['admin-settings'],
          previousSettings.map((s) => (s.key === key ? { ...s, value } : s))
        );
      }
      return { previousSettings };
    },
    onSuccess: (_, variables) => {
      toast.success('Setting Updated', `System setting '${variables.key}' has been saved.`);
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(['admin-settings'], context.previousSettings);
      }
      toast.error('Update Failed', err.response?.data?.message || 'Unable to update setting.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-config'] });
    },
  });

  // Feature Flag Mutation with Optimistic Updates
  const toggleFlagMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      return enabled ? SystemService.enableFeatureFlag(key) : SystemService.disableFeatureFlag(key);
    },
    onMutate: async ({ key, enabled }) => {
      await queryClient.cancelQueries({ queryKey: ['admin-feature-flags'] });
      const previousFlags = queryClient.getQueryData<FeatureFlagItem[]>(['admin-feature-flags']);
      if (previousFlags) {
        queryClient.setQueryData<FeatureFlagItem[]>(
          ['admin-feature-flags'],
          previousFlags.map((f) => (f.key === key ? { ...f, enabled } : f))
        );
      }
      return { previousFlags };
    },
    onSuccess: () => {
      toast.success('Feature Flag Updated', 'Feature flag status changed.');
    },
    onError: (err: any, _variables, context) => {
      if (context?.previousFlags) {
        queryClient.setQueryData(['admin-feature-flags'], context.previousFlags);
      }
      toast.error('Update Failed', err.response?.data?.message || 'Unable to update feature flag.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
    },
  });

  const createFlagMutation = useMutation({
    mutationFn: async () => {
      const trimmedKey = newFlagKey.trim();
      if (!trimmedKey) {
        throw new Error('Flag key cannot be empty.');
      }
      return SystemService.createFeatureFlag({ key: trimmedKey, description: newFlagDesc.trim(), enabled: true });
    },
    onSuccess: (newFlag) => {
      toast.success('Feature Flag Created', `Flag '${newFlag.key}' has been registered.`);
      queryClient.setQueryData<FeatureFlagItem[]>(['admin-feature-flags'], (old = []) => {
        const exists = old.some((f) => f.key === newFlag.key);
        return exists ? old.map((f) => (f.key === newFlag.key ? newFlag : f)) : [...old, newFlag];
      });
      setNewFlagKey('');
      setNewFlagDesc('');
      setIsFlagModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['admin-feature-flags'] });
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err?.response?.data?.message || err?.message || 'Unable to create feature flag.');
    },
  });

  // Toggle Handlers with immediate state feedback
  const handleToggleSetting = (key: string, currentValue: boolean) => {
    const newValue = !currentValue;
    setSettingOverrides((prev) => ({ ...prev, [key]: newValue }));
    updateSettingMutation.mutate(
      { key, value: newValue },
      {
        onError: () => {
          setSettingOverrides((prev) => ({ ...prev, [key]: currentValue }));
        },
      }
    );
  };

  const handleToggleFlag = (key: string, currentEnabled: boolean) => {
    const newEnabled = !currentEnabled;
    setFlagOverrides((prev) => ({ ...prev, [key]: newEnabled }));
    toggleFlagMutation.mutate(
      { key, enabled: newEnabled },
      {
        onError: () => {
          setFlagOverrides((prev) => ({ ...prev, [key]: currentEnabled }));
        },
      }
    );
  };

  const maintenanceMode = getSettingValue('maintenance_mode', false);
  const commentsEnabled = getSettingValue('comments_enabled', true);
  const breakingNewsEnabled = getSettingValue('breaking_news_enabled', true);

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-indigo-500/15 pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <Settings className="w-7 h-7 text-indigo-400" /> Platform System Settings & Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Global operational controls, maintenance overrides, feature flags, and infrastructure health.
          </p>
        </div>
      </div>

      {/* Infrastructure Health Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="p-4 flex items-center justify-between border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300">Core Node Liveness</span>
              <span className="text-xs text-emerald-400 font-mono font-bold block">Status: UP</span>
            </div>
          </div>
          <Badge variant="emerald">Live</Badge>
        </Card>

        <Card variant="glass" className="p-4 flex items-center justify-between border-indigo-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300">Database & Services</span>
              <span className="text-xs text-indigo-300 font-mono font-bold block">
                {healthReadiness?.services?.database === 'UP' ? 'Connected (Neon DB)' : 'Checking...'}
              </span>
            </div>
          </div>
          <Badge variant="indigo">Connected</Badge>
        </Card>

        <Card variant="glass" className="p-4 flex items-center justify-between border-amber-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-300">Maintenance Mode</span>
              <span className="text-xs text-amber-400 font-mono font-bold block">
                {maintenanceMode ? 'ACTIVE (Public Blocked 503)' : 'Disabled (Public Site Live)'}
              </span>
            </div>
          </div>
          <Badge variant={maintenanceMode ? 'amber' : 'emerald'}>{maintenanceMode ? 'MAINTENANCE' : 'NORMAL'}</Badge>
        </Card>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Platform Global Controls */}
        <Card variant="glass" className="p-5 space-y-5">
          <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-indigo-500/15 pb-3">
            <Zap className="w-5 h-5 text-indigo-400" /> Platform System Controls
          </h3>

          {isLoadingSettings ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-4">
              {/* Control 1: Maintenance Mode */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-indigo-500/15">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">System Maintenance Mode</span>
                    <Badge variant={maintenanceMode ? 'amber' : 'emerald'}>
                      {maintenanceMode ? 'ACTIVE (Public Blocked 503)' : 'OFF (Public Site Live)'}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 block">
                    {maintenanceMode
                      ? '⚠️ System maintenance is ON. Non-admin public visitors get 503 Service Unavailable.'
                      : '✅ Public site is Live. Turn ON only when performing emergency maintenance or upgrades.'}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleSetting('maintenance_mode', maintenanceMode)}
                  className="text-indigo-400 hover:text-indigo-300 transition-transform active:scale-95 flex items-center gap-2"
                  title={maintenanceMode ? 'Click to Disable Maintenance Mode (Make Site Live)' : 'Click to Enable Maintenance Mode (Block Public)'}
                >
                  {maintenanceMode ? <ToggleRight className="w-8 h-8 text-amber-400" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>

              {/* Control 2: Comments Engine */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-indigo-500/15">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Public Discussion & Comments</span>
                    <Badge variant={commentsEnabled ? 'emerald' : 'slate'}>
                      {commentsEnabled ? 'ENABLED' : 'PAUSED'}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 block">
                    Global switch to enable or pause reader comment submissions across all articles.
                  </span>
                </div>
                <button
                  onClick={() => handleToggleSetting('comments_enabled', commentsEnabled)}
                  className="text-indigo-400 hover:text-indigo-300 transition-transform active:scale-95"
                  title={commentsEnabled ? 'Click to Pause Comments' : 'Click to Enable Comments'}
                >
                  {commentsEnabled ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>

              {/* Control 3: Breaking News Ticker */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/80 border border-indigo-500/15">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Live Breaking News Banner</span>
                    <Badge variant={breakingNewsEnabled ? 'emerald' : 'slate'}>
                      {breakingNewsEnabled ? 'ACTIVE' : 'HIDDEN'}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 block">
                    Displays high-priority urgent news alert ribbon across user feeds.
                  </span>
                </div>
                <button
                  onClick={() => handleToggleSetting('breaking_news_enabled', breakingNewsEnabled)}
                  className="text-indigo-400 hover:text-indigo-300 transition-transform active:scale-95"
                  title={breakingNewsEnabled ? 'Click to Hide Breaking News Banner' : 'Click to Show Breaking News Banner'}
                >
                  {breakingNewsEnabled ? <ToggleRight className="w-8 h-8 text-emerald-400" /> : <ToggleLeft className="w-8 h-8 text-slate-600" />}
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* Section 2: Dynamic Feature Flags */}
        <Card variant="glass" className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-indigo-500/15 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" /> Server-Side Feature Flags
            </h3>
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsFlagModalOpen(true)}>
              New Flag
            </Button>
          </div>

          {isLoadingFlags ? (
            <Skeleton className="h-40 w-full" />
          ) : (() => {
            const flagsList = Array.isArray(featureFlags) ? (featureFlags as FeatureFlagItem[]) : [];
            if (flagsList.length === 0) {
              return (
                <div className="text-center py-8 bg-slate-950/40 border border-dashed border-indigo-500/20 rounded-xl space-y-2">
                  <Activity className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-xs font-semibold text-slate-300">No Feature Flags Registered</p>
                  <p className="text-[11px] text-slate-500">Click "+ New Flag" above to register your first server-side toggle.</p>
                </div>
              );
            }
            return (
              <div className="space-y-3">
                {flagsList.map((flag) => {
                  const isEnabled = getFlagEnabled(flag);
                  return (
                    <div key={flag.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/80 border border-indigo-500/15">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-indigo-300 text-xs">{flag.key}</span>
                          <Badge variant={isEnabled ? 'emerald' : 'amber'}>{isEnabled ? 'Enabled' : 'Disabled'}</Badge>
                        </div>
                        {flag.description && <span className="text-[11px] text-slate-400 block mt-0.5">{flag.description}</span>}
                      </div>

                      <button
                        onClick={() => handleToggleFlag(flag.key, isEnabled)}
                        className="text-slate-400 hover:text-white"
                        title={isEnabled ? 'Click to Disable Flag' : 'Click to Enable Flag'}
                      >
                        {isEnabled ? <ToggleRight className="w-7 h-7 text-emerald-400" /> : <ToggleLeft className="w-7 h-7 text-slate-600" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>
      </div>

      {/* Modal: Create Feature Flag */}
      {isFlagModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#090d19] border border-indigo-500/30 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-white text-base">Register New Feature Flag</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Flag Key (snake_case)</label>
                <input
                  type="text"
                  value={newFlagKey}
                  onChange={(e) => setNewFlagKey(e.target.value)}
                  placeholder="e.g. local_alerts_v2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  value={newFlagDesc}
                  onChange={(e) => setNewFlagDesc(e.target.value)}
                  placeholder="Purpose of this feature flag..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsFlagModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={createFlagMutation.isPending}
                onClick={() => createFlagMutation.mutate()}
              >
                Create Flag
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
