import React from 'react';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Users } from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  useDocumentTitle('User Management');

  return (
    <div className="space-y-6 pb-12">
      <div className="border-b border-slate-800 pb-3">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Users className="w-6 h-6 text-rose-500" /> User Management
        </h1>
        <p className="text-xs text-slate-400">Manage registered readers and citizen reporters</p>
      </div>

      <Card variant="glass" className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono border-b border-slate-800">
              <tr>
                <th className="p-3">User Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">District</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr>
                <td className="p-3 font-bold text-slate-100">Abhishek Bhardwaj</td>
                <td className="p-3">admin@abmedia.in</td>
                <td className="p-3"><Badge variant="rose">SUPER_ADMIN</Badge></td>
                <td className="p-3">Palamu</td>
              </tr>
              <tr>
                <td className="p-3 font-bold text-slate-100">Ramesh Kumar</td>
                <td className="p-3">ramesh@gmail.com</td>
                <td className="p-3"><Badge variant="emerald">USER</Badge></td>
                <td className="p-3">Garhwa</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
