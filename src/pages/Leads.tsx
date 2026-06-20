import { useState, useEffect } from "react";
import { getSupabase } from "../lib/supabase";
import { Download, RefreshCw } from "lucide-react";

export function Leads() {
  const supabase = getSupabase();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = async () => {
    setLoading(true);
    if (!supabase) {
      setLoading(false);
      return;
    }
    const { data } = await supabase.from("bookings").select("*").order("created_at", { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeads();
  }, [supabase]);

  return (
    <div className="bg-white border text-sm border-slate-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
         <h3 className="font-semibold text-slate-800">All Captured Leads</h3>
         <div className="flex gap-2">
            <button onClick={fetchLeads} className="px-3 py-1.5 border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 flex items-center gap-2">
               <RefreshCw className="w-3.5 h-3.5" />
               Refresh
            </button>
            <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">
               <Download className="w-3.5 h-3.5" />
               Export CSV
            </button>
         </div>
      </div>
      
      {!supabase ? (
         <div className="p-8 text-center text-slate-500">Supabase not configured. Please go to Settings.</div>
      ) : (
         <div className="overflow-x-auto p-0 m-0">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                   <tr>
                      <th className="px-6 py-3 font-medium text-slate-500">ID</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Customer Name</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Contact Number</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Service Requested</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Service Date</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Timing</th>
                      <th className="px-6 py-3 font-medium text-slate-500">Address</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                   {loading ? (
                       <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading...</td></tr>
                   ) : leads.length === 0 ? (
                       <tr><td colSpan={7} className="text-center py-8 text-slate-500">No leads captured yet.</td></tr>
                   ) : leads.map((lead) => (
                       <tr key={lead.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-slate-500">#{lead.id}</td>
                          <td className="px-6 py-3 font-medium text-slate-800">{lead.customer_name}</td>
                          <td className="px-6 py-3 text-slate-600">{lead.contact_number}</td>
                          <td className="px-6 py-3 text-slate-600">{lead.service_details}</td>
                          <td className="px-6 py-3 text-slate-600">{lead.service_date}</td>
                          <td className="px-6 py-3 text-slate-600">{lead.service_timing}</td>
                          <td className="px-6 py-3 text-slate-600">{lead.address}, {lead.area_pin_code}</td>
                       </tr>
                   ))}
                </tbody>
             </table>
         </div>
      )}
    </div>
  );
}
