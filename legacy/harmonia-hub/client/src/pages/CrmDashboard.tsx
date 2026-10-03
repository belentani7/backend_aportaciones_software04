import React from 'react';
import { trpc } from '@/lib/trpc';

export function CrmDashboard() {
  const { data: contacts, isLoading } = trpc.crm.listContacts.useQuery();
  const { data: jobs } = trpc.automation.listJobs.useQuery();

  return (
    <div className="p-8 bg-[#151718] min-h-screen text-[#ECEDEE]">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">BELENTANI CRM & Automation Hub</h1>
        <p className="text-[#9BA1A6] mb-8">Full-stack independent management panel for contacts, leads, and automated jobs.</p>

        {/* CRM Contacts Section */}
        <div className="bg-[#1e2022] border border-[#334155] rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-[#c084fc]">Contacts & Leads Pipeline</h2>
          {isLoading ? (
            <p className="text-[#9BA1A6]">Loading contacts...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#334155] text-xs text-[#9BA1A6] uppercase tracking-wider">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts?.map((c: any) => (
                    <tr key={c.id} className="border-b border-[#334155]/50 hover:bg-[#25282a]">
                      <td className="py-3 px-4 font-medium">{c.name}</td>
                      <td className="py-3 px-4 text-[#9BA1A6]">{c.email}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${c.status === 'customer' ? 'bg-green-500/20 text-green-400' : 'bg-purple-500/20 text-purple-400'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">${c.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Automation Jobs Section */}
        <div className="bg-[#1e2022] border border-[#334155] rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-[#c084fc]">Background Automation Jobs & PVC-U Ledger</h2>
          <div className="space-y-4">
            {jobs?.map((job: any) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-[#151718] border border-[#334155] rounded-xl">
                <div>
                  <h3 className="font-semibold text-foreground">{job.jobName}</h3>
                  <p className="text-xs text-[#9BA1A6]">Schedule: {job.schedule} • Status: {job.status}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 font-medium">Running</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CrmDashboard;
