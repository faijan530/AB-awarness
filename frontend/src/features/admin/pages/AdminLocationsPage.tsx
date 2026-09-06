import React, { useState } from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LocationService, LocationItem, LocationType } from '@/services/api/location-service';
import { useToast } from '@/hooks/useToast';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Modal } from '@/components/common/Modal';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Compass,
  Globe,
  Filter
} from 'lucide-react';

export const AdminLocationsPage: React.FC = () => {
  useDocumentTitle('Geographic Location Governance — Super Admin');
  const toast = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<LocationType>('DISTRICT');
  const [parentId, setParentId] = useState<string>('');
  const [stateCode, setStateCode] = useState('');
  const [districtCode, setDistrictCode] = useState('');

  // 1. Fetch Locations
  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['admin-locations'],
    queryFn: () => LocationService.getAdminLocations(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: () =>
      LocationService.createLocation({
        name: name.trim(),
        type,
        parentId: parentId || null,
        stateCode: stateCode.trim() || undefined,
        districtCode: districtCode.trim() || undefined,
      }),
    onSuccess: (loc) => {
      toast.success('Location Created', `"${loc.name}" (${loc.type}) added to database.`);
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      resetForm();
      setIsAddModalOpen(false);
    },
    onError: (err: any) => {
      toast.error('Creation Failed', err.response?.data?.message || err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      LocationService.updateLocation(editingLocation!.id, {
        name: name.trim(),
        type,
        parentId: parentId || null,
        stateCode: stateCode.trim() || undefined,
        districtCode: districtCode.trim() || undefined,
      }),
    onSuccess: (loc) => {
      toast.success('Location Updated', `"${loc.name}" updated successfully.`);
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
      resetForm();
      setEditingLocation(null);
    },
    onError: (err: any) => {
      toast.error('Update Failed', err.response?.data?.message || err.message);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      isActive ? LocationService.activateLocation(id) : LocationService.deactivateLocation(id),
    onSuccess: (_, vars) => {
      toast.success('Status Updated', `Location ${vars.isActive ? 'activated' : 'deactivated'}.`);
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => LocationService.deleteLocation(id),
    onSuccess: () => {
      toast.success('Location Processed', 'Location removed or safely deactivated.');
      queryClient.invalidateQueries({ queryKey: ['admin-locations'] });
    },
  });

  const resetForm = () => {
    setName('');
    setType('DISTRICT');
    setParentId('');
    setStateCode('');
    setDistrictCode('');
  };

  const handleOpenEdit = (loc: LocationItem) => {
    setEditingLocation(loc);
    setName(loc.name);
    setType(loc.type);
    setParentId(loc.parentId || '');
    setStateCode(loc.stateCode || '');
    setDistrictCode(loc.districtCode || '');
  };

  const filteredLocations = locations.filter((l) => {
    const matchesSearch =
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.slug.toLowerCase().includes(search.toLowerCase());
    const matchesType = selectedType === 'ALL' || l.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-500/15 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              GEOGRAPHIC CLASSIFICATION
            </span>
            <span className="text-xs text-slate-400 font-medium">Jharkhand & Regional Master Data</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 tracking-tight">
            Geographic Location Governance
          </h1>
        </div>

        <Button
          variant="emerald"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => {
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          Add New Location
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card-admin rounded-2xl p-5 space-y-2">
          <span className="text-xs text-slate-400 font-semibold uppercase">Total Registered Locations</span>
          <p className="text-3xl font-black text-white font-mono">{locations.length}</p>
        </div>
        <div className="glass-card-admin rounded-2xl p-5 space-y-2 border-l-4 border-l-emerald-500">
          <span className="text-xs text-slate-400 font-semibold uppercase">Districts & Divisions</span>
          <p className="text-3xl font-black text-emerald-400 font-mono">
            {locations.filter((l) => l.type === 'DISTRICT' || l.type === 'DIVISION').length}
          </p>
        </div>
        <div className="glass-card-admin rounded-2xl p-5 space-y-2 border-l-4 border-l-indigo-500">
          <span className="text-xs text-slate-400 font-semibold uppercase">Cities, Towns & Villages</span>
          <p className="text-3xl font-black text-indigo-300 font-mono">
            {locations.filter((l) => l.type === 'CITY' || l.type === 'TOWN' || l.type === 'BLOCK' || l.type === 'LOCAL_AREA').length}
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card-admin rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-indigo-500/15 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Compass className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-white text-base">Geographic Registry Master</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent text-white outline-none font-semibold text-xs cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="STATE">State</option>
                <option value="DIVISION">Division</option>
                <option value="DISTRICT">District</option>
                <option value="BLOCK">Block</option>
                <option value="CITY">City</option>
                <option value="LOCAL_AREA">Local Area</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search location name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No Locations Found"
            description="No geographic locations match your search or filter settings."
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-indigo-500/15 bg-[#090d19]/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-indigo-950/40 text-indigo-200 uppercase font-semibold border-b border-indigo-500/15">
                <tr>
                  <th className="p-4">Location Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Parent Region</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10 font-medium">
                {filteredLocations.map((loc) => {
                  const parentLoc = locations.find((p) => p.id === loc.parentId);
                  return (
                    <tr key={loc.id} className="hover:bg-indigo-950/30 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> {loc.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">/location/{loc.slug}</div>
                      </td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                          {loc.type}
                        </span>
                      </td>
                      <td className="p-4">
                        {parentLoc ? (
                          <span className="text-slate-300 font-semibold">{parentLoc.name}</span>
                        ) : (
                          <Badge variant="indigo">Top-Level Root</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        {loc.isActive ? (
                          <Badge variant="emerald">ACTIVE</Badge>
                        ) : (
                          <Badge variant="rose">INACTIVE</Badge>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() =>
                            toggleActiveMutation.mutate({ id: loc.id, isActive: !loc.isActive })
                          }
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-all"
                        >
                          {loc.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleOpenEdit(loc)}
                          className="p-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/20 hover:border-indigo-400/50 transition-all"
                          title="Edit Location"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(loc.id)}
                          className="p-1.5 rounded-lg bg-rose-950/60 text-rose-300 border border-rose-500/20 hover:border-rose-400/50 transition-all"
                          title="Delete Location"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isAddModalOpen || !!editingLocation}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'Edit Geographic Location' : 'Register New Geographic Location'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingLocation) updateMutation.mutate();
            else createMutation.mutate();
          }}
          className="space-y-4"
        >
          <Input
            label="Location Name"
            placeholder="e.g., Palamu, Garhwa, Medininagar..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Administrative Level / Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LocationType)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
              >
                <option value="STATE">STATE</option>
                <option value="DIVISION">DIVISION</option>
                <option value="DISTRICT">DISTRICT</option>
                <option value="SUBDIVISION">SUBDIVISION</option>
                <option value="BLOCK">BLOCK</option>
                <option value="CITY">CITY</option>
                <option value="TOWN">TOWN</option>
                <option value="VILLAGE">VILLAGE</option>
                <option value="LOCAL_AREA">LOCAL_AREA</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Parent Geographic Region</label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white outline-none"
              >
                <option value="">None (Root State / Country Level)</option>
                {locations
                  .filter((l) => l.id !== editingLocation?.id)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="State Code (e.g., JH)"
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
            />
            <Input
              label="District Code (e.g., PAL)"
              value={districtCode}
              onChange={(e) => setDistrictCode(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setIsAddModalOpen(false);
                setEditingLocation(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="emerald"
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingLocation ? 'Update Location' : 'Save Location'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
