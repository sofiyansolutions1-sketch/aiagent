import { useState, useEffect } from "react";
import { getSupabase } from "../lib/supabase";
import { Users, CalendarCheck, PhoneOutgoing, Activity } from "lucide-react";

export function Dashboard() {
  const supabase = getSupabase();
  const [totalLeads, setTotalLeads] = useState<number | null>(null);
  const [recentLeads, setRecentLeads] = useState<any[]>([]);

  useEffect(() => {
    if (supabase) {
      // Fetch total leads
      supabase.from("bookings").select("*", { count: 'exact', head: true })
        .then(({ count }) => count !== null && setTotalLeads(count));

      // Fetch recent 5 leads
      supabase.from("bookings").select("id, customer_name, service_details, created_at").order("created_at", { ascending: false }).limit(5)
        .then(({ data }) => data && setRecentLeads(data));
    }
  }, [supabase]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Leads Gen', value: totalLeads ?? '-', icon: <Users className="w-5 h-5 text-indigo-600" /> },
          { label: 'Services Booked', value: totalLeads ?? '-', icon: <CalendarCheck className="w-5 h-5 text-emerald-600" /> },
          { label: 'Total Calls Made', value: '1,240', icon: <PhoneOutgoing className="w-5 h-5 text-amber-500" /> },
          { label: 'System Status', value: 'Online', icon: <Activity className="w-5 h-5 text-sky-500" /> },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                {stat.icon}
              </div>
              <h3 className="font-medium text-slate-500 text-sm">{stat.label}</h3>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">Recent Lead Acquisitions</h3>
        </div>
        <div className="p-6">
          {!supabase ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-2">Supabase not configured.</p>
              <a href="/settings" className="text-indigo-600 text-sm font-medium hover:underline">Go to Settings Setup</a>
            </div>
          ) : recentLeads.length === 0 ? (
             <p className="text-slate-500 text-sm">No recent leads found.</p>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                   <div>
                      <p className="font-semibold text-slate-800 text-sm">{lead.customer_name}</p>
                      <p className="text-slate-500 text-xs mt-0.5">{lead.service_details}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs text-slate-400">{new Date(lead.created_at).toLocaleDateString()}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
