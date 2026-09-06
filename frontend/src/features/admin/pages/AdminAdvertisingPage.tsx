import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone,
  Plus,
  Play,
  Pause,
  Calendar,
  Layers,
  Building,
  Target,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  Trash2,
  Edit,
  Image as ImageIcon,
  Sparkles,
  AlertTriangle,
  Globe
} from 'lucide-react';
import {
  AdvertisingService,
  CampaignItem,
  AdvertiserItem,
  AdPlacementItem,
  AdCreativeItem
} from '@/services/api/advertising-service';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Skeleton';

const SAMPLE_IMAGE_PRESETS = [
  { label: 'Agriculture & Rural', url: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44' },
  { label: 'Technology & Business', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f' },
  { label: 'Community & Culture', url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c' },
  { label: 'Education & Careers', url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644' },
];

export const AdminAdvertisingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'CAMPAIGNS' | 'CREATIVES' | 'ADVERTISERS' | 'PLACEMENTS'>('CAMPAIGNS');

  // Modal controls
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showAdvertiserModal, setShowAdvertiserModal] = useState(false);
  const [showCreativeModal, setShowCreativeModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);

  // New Advertiser form state
  const [newAdvName, setNewAdvName] = useState('');
  const [newAdvContact, setNewAdvContact] = useState('');
  const [newAdvEmail, setNewAdvEmail] = useState('');
  const [newAdvPhone, setNewAdvPhone] = useState('');

  // Default dates for campaigns (Today -> 30 days ahead)
  const defaultStartDate = useMemo(() => new Date().toISOString().split('T')[0], []);
  const defaultEndDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, []);

  // New Campaign form state
  const [selectedAdvId, setSelectedAdvId] = useState('');
  const [newCampName, setNewCampName] = useState('');
  const [newCampStart, setNewCampStart] = useState(defaultStartDate);
  const [newCampEnd, setNewCampEnd] = useState(defaultEndDate);
  const [newCampBudget, setNewCampBudget] = useState('');
  const [newCampLocation, setNewCampLocation] = useState('');
  const [newCampHeadline, setNewCampHeadline] = useState('');
  const [newCampDestUrl, setNewCampDestUrl] = useState('https://abawareness.in');
  const [newCampMediaUrl, setNewCampMediaUrl] = useState(SAMPLE_IMAGE_PRESETS[0].url);
  const [newCampDesc, setNewCampDesc] = useState('');
  const [newCampLaunchLive, setNewCampLaunchLive] = useState(true);

  // Edit Campaign form state
  const [editingCampaign, setEditingCampaign] = useState<CampaignItem | null>(null);
  const [editCampName, setEditCampName] = useState('');
  const [editCampStart, setEditCampStart] = useState('');
  const [editCampEnd, setEditCampEnd] = useState('');
  const [editCampLocation, setEditCampLocation] = useState('');

  // Add Creative form state
  const [selectedCampIdForCreative, setSelectedCampIdForCreative] = useState('');
  const [newCrHeadline, setNewCrHeadline] = useState('');
  const [newCrDestUrl, setNewCrDestUrl] = useState('https://abawareness.in');
  const [newCrMediaUrl, setNewCrMediaUrl] = useState(SAMPLE_IMAGE_PRESETS[0].url);
  const [newCrDesc, setNewCrDesc] = useState('');

  // Queries
  const { data: campaigns = [], isLoading: isLoadingCampaigns } = useQuery({
    queryKey: ['admin-campaigns'],
    queryFn: () => AdvertisingService.getCampaigns(),
  });

  const { data: creatives = [], isLoading: isLoadingCreatives } = useQuery({
    queryKey: ['admin-creatives'],
    queryFn: () => AdvertisingService.getCreatives(),
  });

  const { data: advertisers = [], isLoading: isLoadingAdvertisers } = useQuery({
    queryKey: ['admin-advertisers'],
    queryFn: () => AdvertisingService.getAdvertisers(),
  });

  const { data: placements = [], isLoading: isLoadingPlacements } = useQuery({
    queryKey: ['admin-placements'],
    queryFn: () => AdvertisingService.getPlacements(),
  });

  // Mutations
  const createAdvertiserMutation = useMutation({
    mutationFn: () =>
      AdvertisingService.createAdvertiser({
        name: newAdvName,
        contactName: newAdvContact || undefined,
        email: newAdvEmail,
        phone: newAdvPhone || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-advertisers'] });
      setShowAdvertiserModal(false);
      setNewAdvName('');
      setNewAdvContact('');
      setNewAdvEmail('');
      setNewAdvPhone('');
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: () =>
      AdvertisingService.createCampaign({
        advertiserId: selectedAdvId,
        name: newCampName,
        startAt: newCampStart,
        endAt: newCampEnd,
        budget: newCampBudget ? parseFloat(newCampBudget) : undefined,
        targetLocation: newCampLocation || undefined,
        status: newCampLaunchLive ? 'ACTIVE' : 'DRAFT',
        headline: newCampHeadline.trim() || newCampName,
        destinationUrl: newCampDestUrl.trim() || 'https://abawareness.in',
        mediaUrl: newCampMediaUrl.trim() || SAMPLE_IMAGE_PRESETS[0].url,
        description: newCampDesc.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-creatives'] });
      queryClient.invalidateQueries({ queryKey: ['ad-serve'] });
      setShowCampaignModal(false);
      setNewCampName('');
      setNewCampStart(defaultStartDate);
      setNewCampEnd(defaultEndDate);
      setNewCampBudget('');
      setNewCampLocation('');
      setNewCampHeadline('');
      setNewCampDestUrl('https://abawareness.in');
      setNewCampDesc('');
    },
  });

  const updateCampaignMutation = useMutation({
    mutationFn: () => {
      if (!editingCampaign) return Promise.reject('No campaign selected');
      return AdvertisingService.updateCampaign(editingCampaign.id, {
        name: editCampName,
        startAt: editCampStart,
        endAt: editCampEnd,
        targetLocation: editCampLocation || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ad-serve'] });
      setShowEditCampaignModal(false);
      setEditingCampaign(null);
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => AdvertisingService.deleteCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-creatives'] });
      queryClient.invalidateQueries({ queryKey: ['ad-serve'] });
    },
  });

  const createCreativeMutation = useMutation({
    mutationFn: () =>
      AdvertisingService.createCreative({
        campaignId: selectedCampIdForCreative,
        name: `${newCrHeadline} Banner`,
        headline: newCrHeadline,
        destinationUrl: newCrDestUrl,
        mediaUrl: newCrMediaUrl || undefined,
        description: newCrDesc || undefined,
        status: 'ACTIVE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-creatives'] });
      queryClient.invalidateQueries({ queryKey: ['ad-serve'] });
      setShowCreativeModal(false);
      setNewCrHeadline('');
      setNewCrDestUrl('https://abawareness.in');
      setNewCrDesc('');
    },
  });

  const activateCampaignMutation = useMutation({
    mutationFn: (id: string) => AdvertisingService.activateCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['admin-creatives'] });
      queryClient.invalidateQueries({ queryKey: ['ad-serve'] });
    },
  });

  const pauseCampaignMutation = useMutation({
    mutationFn: (id: string) => AdvertisingService.pauseCampaign(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['ad-serve'] });
    },
  });

  const isExpired = (endDateStr: string) => {
    return new Date(endDateStr).getTime() < Date.now();
  };

  const openEditModal = (c: CampaignItem) => {
    setEditingCampaign(c);
    setEditCampName(c.name);
    setEditCampStart(new Date(c.startAt).toISOString().split('T')[0]);
    // If expired, suggest 30 days from now; otherwise keep existing end date
    const isPast = new Date(c.endAt).getTime() < Date.now();
    setEditCampEnd(isPast ? defaultEndDate : new Date(c.endAt).toISOString().split('T')[0]);
    setEditCampLocation(c.targetLocation || '');
    setShowEditCampaignModal(true);
  };

  const openAddCreativeModal = (campaignId?: string) => {
    if (campaignId) {
      setSelectedCampIdForCreative(campaignId);
    } else if (campaigns.length > 0) {
      setSelectedCampIdForCreative(campaigns[0].id);
    }
    setShowCreativeModal(true);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-indigo-400" /> Advertising & Sponsor Desk
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage commercial sponsorships, advertiser partners, placement slots, and campaign scheduling.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowAdvertiserModal(true)}>
            <Building className="w-3.5 h-3.5 mr-1.5" /> New Advertiser
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (advertisers.length > 0 && !selectedAdvId) {
                setSelectedAdvId(advertisers[0].id);
              }
              setShowCampaignModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Launch Campaign
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('CAMPAIGNS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'CAMPAIGNS'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Active Campaigns ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('CREATIVES')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'CREATIVES'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ad Creatives ({creatives.length})
        </button>
        <button
          onClick={() => setActiveTab('ADVERTISERS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'ADVERTISERS'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Advertisers ({advertisers.length})
        </button>
        <button
          onClick={() => setActiveTab('PLACEMENTS')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'PLACEMENTS'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ad Inventory Placements ({placements.length})
        </button>
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === 'CAMPAIGNS' && (
        <Card variant="glass" className="border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Campaign Name</th>
                  <th className="py-3.5 px-4 font-bold">Advertiser</th>
                  <th className="py-3.5 px-4 font-bold">Flight Dates</th>
                  <th className="py-3.5 px-4 font-bold">Targeting</th>
                  <th className="py-3.5 px-4 font-bold">Creatives</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoadingCampaigns ? (
                  [...Array(4)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={7} className="p-4">
                        <Skeleton className="h-6 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No ad campaigns found. Click "Launch Campaign" to create one.
                    </td>
                  </tr>
                ) : (
                  campaigns.map((c: CampaignItem) => {
                    const expired = isExpired(c.endAt);
                    const creativeCount = c._count?.creatives || 0;

                    return (
                      <tr key={c.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-200">{c.name}</div>
                          {c.budget && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              Budget: ₹{c.budget.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">{c.advertiser?.name || '—'}</td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {new Date(c.startAt).toLocaleDateString()} – {new Date(c.endAt).toLocaleDateString()}
                          </div>
                          {expired ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 mt-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" /> Expired (Needs Date Update)
                            </span>
                          ) : (
                            <span className="text-[9px] text-emerald-400 font-mono">In Flight Window</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {c.targetLocation ? (
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono border border-slate-700">
                              {c.targetLocation}
                            </span>
                          ) : (
                            <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                              <Globe className="w-3 h-3 text-slate-500" /> Universal
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {creativeCount > 0 ? (
                            <button
                              onClick={() => setActiveTab('CREATIVES')}
                              className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold hover:bg-indigo-500/30 transition-colors text-[10px]"
                            >
                              {creativeCount} Active {creativeCount === 1 ? 'Ad' : 'Ads'}
                            </button>
                          ) : (
                            <button
                              onClick={() => openAddCreativeModal(c.id)}
                              className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold hover:bg-amber-500/30 transition-colors text-[10px] flex items-center gap-1"
                            >
                              <AlertTriangle className="w-2.5 h-2.5" /> 0 Ads (+ Add)
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                              c.status === 'ACTIVE'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : c.status === 'PAUSED'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status === 'ACTIVE' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => pauseCampaignMutation.mutate(c.id)}
                                className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 text-xs px-2.5 py-1"
                                title="Pause Campaign"
                              >
                                <Pause className="w-3 h-3 mr-1" /> Pause
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => activateCampaignMutation.mutate(c.id)}
                                className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 text-xs px-2.5 py-1"
                                title="Activate Campaign (Auto-extends dates & adds ad if needed)"
                              >
                                <Play className="w-3 h-3 mr-1" /> Activate
                              </Button>
                            )}

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAddCreativeModal(c.id)}
                              className="text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 text-xs px-2 py-1"
                              title="Add Ad Creative"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(c)}
                              className="text-slate-400 border-slate-700 hover:bg-slate-800 text-xs px-2 py-1"
                              title="Edit Flight Dates & Targeting"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete campaign "${c.name}"?`)) {
                                  deleteCampaignMutation.mutate(c.id);
                                }
                              }}
                              className="text-rose-400 border-rose-500/30 hover:bg-rose-500/10 text-xs px-2 py-1"
                              title="Delete Campaign"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: AD CREATIVES */}
      {activeTab === 'CREATIVES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Active creative artwork, headlines, and destination links currently serving on the public news portal.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAddCreativeModal()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Creative
            </Button>
          </div>

          {isLoadingCreatives ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full rounded-2xl" />
              ))}
            </div>
          ) : creatives.length === 0 ? (
            <Card variant="glass" className="p-12 text-center text-slate-500 text-xs">
              No ad creatives created yet. Click "+ New Creative" or launch a new campaign to add one.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.map((cr: AdCreativeItem) => (
                <Card
                  key={cr.id}
                  variant="glass"
                  className="border-slate-800/80 p-4 space-y-3 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    {/* Media Thumbnail */}
                    {cr.mediaUrl ? (
                      <div className="w-full h-32 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                        <img
                          src={cr.mediaUrl}
                          alt={cr.headline}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[9px] font-mono text-emerald-400 border border-slate-800 uppercase font-bold">
                          {cr.status}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-24 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 text-xs">
                        <ImageIcon className="w-6 h-6 mr-1" /> No Media
                      </div>
                    )}

                    {/* Headline & Description */}
                    <div>
                      <h4 className="font-bold text-slate-200 text-xs line-clamp-2">{cr.headline}</h4>
                      {cr.description && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {cr.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>Campaign:</span>
                      <span className="text-slate-200 font-bold truncate max-w-[150px]">
                        {cr.campaign?.name || '—'}
                      </span>
                    </div>

                    <a
                      href={cr.destinationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 border border-slate-800 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      <span className="truncate max-w-[200px]">{cr.destinationUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ADVERTISERS */}
      {activeTab === 'ADVERTISERS' && (
        <Card variant="glass" className="border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Advertiser Organization</th>
                  <th className="py-3.5 px-4 font-bold">Contact Name</th>
                  <th className="py-3.5 px-4 font-bold">Email</th>
                  <th className="py-3.5 px-4 font-bold">Phone</th>
                  <th className="py-3.5 px-4 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoadingAdvertisers ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-4">
                        <Skeleton className="h-6 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : advertisers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No advertisers registered yet.
                    </td>
                  </tr>
                ) : (
                  advertisers.map((a: AdvertiserItem) => (
                    <tr key={a.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-200">{a.name}</td>
                      <td className="py-3.5 px-4 text-slate-300">{a.contactName || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{a.email}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{a.phone || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: PLACEMENTS */}
      {activeTab === 'PLACEMENTS' && (
        <Card variant="glass" className="border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800/80">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Placement Slot</th>
                  <th className="py-3.5 px-4 font-bold">Inventory Code</th>
                  <th className="py-3.5 px-4 font-bold">Dimensions</th>
                  <th className="py-3.5 px-4 font-bold">Priority</th>
                  <th className="py-3.5 px-4 font-bold">Active Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {isLoadingPlacements ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={5} className="p-4">
                        <Skeleton className="h-6 w-full rounded-lg" />
                      </td>
                    </tr>
                  ))
                ) : (
                  placements.map((p: AdPlacementItem) => (
                    <tr key={p.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-200">{p.name}</td>
                      <td className="py-3.5 px-4 text-indigo-400 font-mono font-bold">{p.code}</td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono">{p.dimensions || 'Responsive'}</td>
                      <td className="py-3.5 px-4 text-slate-300 font-mono">{p.priority}</td>
                      <td className="py-3.5 px-4">
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* MODAL 1: Create Advertiser Modal */}
      {showAdvertiserModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-indigo-400" /> Register Advertiser Partner
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Company / Brand Name *</label>
                <input
                  type="text"
                  required
                  value={newAdvName}
                  onChange={(e) => setNewAdvName(e.target.value)}
                  placeholder="e.g. State Bank / Agro Corp"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Billing / Account Email *</label>
                <input
                  type="email"
                  required
                  value={newAdvEmail}
                  onChange={(e) => setNewAdvEmail(e.target.value)}
                  placeholder="ads@partner.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Contact Person Name</label>
                <input
                  type="text"
                  value={newAdvContact}
                  onChange={(e) => setNewAdvContact(e.target.value)}
                  placeholder="e.g. Ramesh Verma"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="text-slate-300 block mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newAdvPhone}
                  onChange={(e) => setNewAdvPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdvertiserModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newAdvName.trim() || !newAdvEmail.trim() || createAdvertiserMutation.isPending}
                onClick={() => createAdvertiserMutation.mutate()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Create Advertiser
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Launch Campaign Modal (with Embedded Creative Setup) */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" /> Launch Advertising Campaign
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Immediate Live Public Serving
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Define the campaign schedule and ad creative details so it serves live on the public news portal immediately upon launch.
            </p>

            <div className="space-y-4 text-xs">
              {/* Campaign Basic Info */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider font-mono">1. Campaign Settings</h4>
                <div>
                  <label className="text-slate-300 block mb-1">Advertiser Partner *</label>
                  <select
                    value={selectedAdvId}
                    onChange={(e) => setSelectedAdvId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                  >
                    {advertisers.map((a: AdvertiserItem) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Campaign Flight Name *</label>
                  <input
                    type="text"
                    required
                    value={newCampName}
                    onChange={(e) => setNewCampName(e.target.value)}
                    placeholder="e.g. Monsoon Farmers Subsidy Initiative"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newCampStart}
                      onChange={(e) => setNewCampStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newCampEnd}
                      onChange={(e) => setNewCampEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-slate-300 block mb-1">Target Location (Optional)</label>
                    <input
                      type="text"
                      value={newCampLocation}
                      onChange={(e) => setNewCampLocation(e.target.value)}
                      placeholder="Leave blank for Universal or e.g. palamu"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 block mb-1">Total Budget (₹)</label>
                    <input
                      type="number"
                      value={newCampBudget}
                      onChange={(e) => setNewCampBudget(e.target.value)}
                      placeholder="e.g. 50000"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Creative Artwork & Copy */}
              <div className="space-y-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-300 text-xs uppercase tracking-wider font-mono">
                    2. Ad Creative & Artwork
                  </h4>
                  <span className="text-[10px] text-emerald-400">Displayed on Public Banners</span>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Ad Headline / Title *</label>
                  <input
                    type="text"
                    required
                    value={newCampHeadline}
                    onChange={(e) => setNewCampHeadline(e.target.value)}
                    placeholder="e.g. Avail Low Interest Crop Loans Today"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Target Destination URL *</label>
                  <input
                    type="url"
                    required
                    value={newCampDestUrl}
                    onChange={(e) => setNewCampDestUrl(e.target.value)}
                    placeholder="https://example.com/promotion"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Banner Image URL</label>
                  <input
                    type="url"
                    value={newCampMediaUrl}
                    onChange={(e) => setNewCampMediaUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono text-[11px]"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-500 self-center">Presets:</span>
                    {SAMPLE_IMAGE_PRESETS.map((p) => (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => setNewCampMediaUrl(p.url)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          newCampMediaUrl === p.url
                            ? 'bg-indigo-600/30 text-indigo-300 border-indigo-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">Short Ad Description / Subtitle</label>
                  <textarea
                    rows={2}
                    value={newCampDesc}
                    onChange={(e) => setNewCampDesc(e.target.value)}
                    placeholder="Special subsidy scheme for citizens across Jharkhand."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Status Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                <div>
                  <div className="font-bold text-slate-200">Launch Live Immediately</div>
                  <div className="text-[11px] text-slate-400">
                    Makes campaign and creative active and eligible for ad slots on the portal.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={newCampLaunchLive}
                  onChange={(e) => setNewCampLaunchLive(e.target.checked)}
                  className="w-4 h-4 accent-indigo-600 rounded cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowCampaignModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newCampName.trim() || !newCampStart || !newCampEnd || createCampaignMutation.isPending}
                onClick={() => createCampaignMutation.mutate()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                {createCampaignMutation.isPending ? 'Launching...' : 'Launch Campaign Live'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Quick Add Creative Modal */}
      {showCreativeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-400" /> Add Ad Creative to Campaign
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Target Campaign *</label>
                <select
                  value={selectedCampIdForCreative}
                  onChange={(e) => setSelectedCampIdForCreative(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                >
                  {campaigns.map((c: CampaignItem) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Creative Headline *</label>
                <input
                  type="text"
                  required
                  value={newCrHeadline}
                  onChange={(e) => setNewCrHeadline(e.target.value)}
                  placeholder="e.g. Special Discount for Local Residents"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Target Click Destination URL *</label>
                <input
                  type="url"
                  required
                  value={newCrDestUrl}
                  onChange={(e) => setNewCrDestUrl(e.target.value)}
                  placeholder="https://example.com/promo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={newCrMediaUrl}
                  onChange={(e) => setNewCrMediaUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Ad Copy / Description</label>
                <textarea
                  rows={2}
                  value={newCrDesc}
                  onChange={(e) => setNewCrDesc(e.target.value)}
                  placeholder="Brief promotional copy..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowCreativeModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!newCrHeadline.trim() || !newCrDestUrl.trim() || createCreativeMutation.isPending}
                onClick={() => createCreativeMutation.mutate()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Save Creative
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Edit Campaign Modal */}
      {showEditCampaignModal && editingCampaign && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Edit className="w-4 h-4 text-indigo-400" /> Edit Campaign Flight & Dates
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Campaign Name</label>
                <input
                  type="text"
                  required
                  value={editCampName}
                  onChange={(e) => setEditCampName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={editCampStart}
                    onChange={(e) => setEditCampStart(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={editCampEnd}
                    onChange={(e) => setEditCampEnd(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">Geographic Targeting</label>
                <input
                  type="text"
                  value={editCampLocation}
                  onChange={(e) => setEditCampLocation(e.target.value)}
                  placeholder="e.g. palamu (or blank for Universal)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setShowEditCampaignModal(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!editCampName.trim() || !editCampStart || !editCampEnd || updateCampaignMutation.isPending}
                onClick={() => updateCampaignMutation.mutate()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Update Campaign
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
