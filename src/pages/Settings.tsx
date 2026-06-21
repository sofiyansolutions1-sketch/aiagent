import { useState, useEffect } from "react";
import { resetSupabaseClient } from "../lib/supabase";
import { Save, Trash2, CheckCircle2 } from "lucide-react";

export function Settings() {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [voice, setVoice] = useState("Aoede");
  const [activeWebhook, setActiveWebhook] = useState("");
  const [endingWebhook, setEndingWebhook] = useState("");
  const [backendUrl, setBackendUrl] = useState("");
  
  const [savedActiveWebhook, setSavedActiveWebhook] = useState("");
  const [savedEndingWebhook, setSavedEndingWebhook] = useState("");
  
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setUrl(localStorage.getItem("supabase_url") || "https://vqbnzcknflwuhbiznuim.supabase.co");
    setKey(localStorage.getItem("supabase_anon_key") || "sb_publishable_YKSbWVBxAltMjpIxGhNAIg_Ga8B9xST");
    setVoice(localStorage.getItem("ai_voice") || "Aoede");
    setBackendUrl(localStorage.getItem("backend_ws_url") || "");
    
    const storedActive = localStorage.getItem("call_active_webhook") || "";
    const storedEnding = localStorage.getItem("call_ending_webhook") || "";
    setActiveWebhook(storedActive);
    setEndingWebhook(storedEnding);
    setSavedActiveWebhook(storedActive);
    setSavedEndingWebhook(storedEnding);
  }, []);

  const handleSave = () => {
    localStorage.setItem("supabase_url", url);
    localStorage.setItem("supabase_anon_key", key);
    localStorage.setItem("ai_voice", voice);
    localStorage.setItem("backend_ws_url", backendUrl);
    localStorage.setItem("call_active_webhook", activeWebhook);
    localStorage.setItem("call_ending_webhook", endingWebhook);
    
    setSavedActiveWebhook(activeWebhook);
    setSavedEndingWebhook(endingWebhook);
    
    resetSupabaseClient();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };


  return (
    <div className="max-w-2xl text-sm">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200">
           <h3 className="font-semibold text-slate-800">Supabase Database Integration</h3>
           <p className="text-slate-500 text-xs mt-1">Configure your project credentials to store generated leads.</p>
        </div>
        <div className="p-6 space-y-4">
           <div>
              <label className="block font-medium text-slate-700 mb-1.5">Project URL</label>
              <input 
                type="text" 
                value={url} 
                onChange={e => setUrl(e.target.value)}
                placeholder="https://xxxx.supabase.co"
                className="w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
           </div>
           <div>
              <label className="block font-medium text-slate-700 mb-1.5">Anon Public Key</label>
              <input 
                type="password" 
                value={key} 
                onChange={e => setKey(e.target.value)}
                placeholder="eyJh..."
                className="w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200">
           <h3 className="font-semibold text-slate-800">Webhooks</h3>
           <p className="text-slate-500 text-xs mt-1">Trigger these URLs when a call starts or ends.</p>
        </div>
        <div className="p-6 space-y-4">
           <div>
              <label className="block font-medium text-slate-700 mb-1.5">Call Active Webhook</label>
              {savedActiveWebhook ? (
                  <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2 text-emerald-700 truncate mr-4">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{savedActiveWebhook}</span>
                      </div>
                      <button 
                        onClick={() => {
                            setSavedActiveWebhook('');
                            setActiveWebhook('');
                            localStorage.removeItem('call_active_webhook');
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              ) : (
                  <input 
                    type="text" 
                    value={activeWebhook} 
                    onChange={e => setActiveWebhook(e.target.value)}
                    placeholder="https://hook.site/call-active"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
              )}
           </div>
           <div>
              <label className="block font-medium text-slate-700 mb-1.5">Call Ending Webhook</label>
              {savedEndingWebhook ? (
                  <div className="flex items-center justify-between border border-emerald-200 bg-emerald-50 rounded-md px-3 py-2">
                      <div className="flex items-center gap-2 text-emerald-700 truncate mr-4">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span className="truncate">{savedEndingWebhook}</span>
                      </div>
                      <button 
                        onClick={() => {
                            setSavedEndingWebhook('');
                            setEndingWebhook('');
                            localStorage.removeItem('call_ending_webhook');
                        }}
                        className="text-slate-400 hover:text-rose-500 transition-colors shrink-0"
                      >
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              ) : (
                  <input 
                    type="text" 
                    value={endingWebhook} 
                    onChange={e => setEndingWebhook(e.target.value)}
                    placeholder="https://hook.site/call-ending"
                    className="w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
                  />
              )}
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200">
           <h3 className="font-semibold text-slate-800">Backend Server Configuration</h3>
           <p className="text-slate-500 text-xs mt-1">If hosted on Netlify, specify the external backend URL (e.g. Render/Railway) for WebSockets.</p>
        </div>
        <div className="p-6">
           <div>
              <label className="block font-medium text-slate-700 mb-1.5">Backend URL (Optional)</label>
              <input 
                type="text" 
                value={backendUrl} 
                onChange={e => setBackendUrl(e.target.value)}
                placeholder="https://my-backend.onrender.com"
                className="w-full border border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 placeholder:text-slate-400"
              />
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-slate-200">
           <h3 className="font-semibold text-slate-800">AI Voice Configuration</h3>
           <p className="text-slate-500 text-xs mt-1">Select the prebuilt voice for the Tele-Calling Agent.</p>
        </div>
        <div className="p-6">
           <div>
              <label className="block font-medium text-slate-700 mb-1.5">Voice Model</label>
              <select 
                 value={voice} 
                 onChange={e => setVoice(e.target.value)}
                 className="w-full border bg-white border-slate-300 rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900"
              >
                 <option value="Aoede">Default Female (Aoede)</option>
                 <option value="Puck">Male (Puck)</option>
                 <option value="Charon">Male Deep (Charon)</option>
                 <option value="Kore">Female Soft (Kore)</option>
                 <option value="Fenrir">Male Rough (Fenrir)</option>
                 <option value="Zephyr">Female Clear (Zephyr)</option>
              </select>
           </div>
        </div>
      </div>

      <div className="flex justify-end items-center gap-4">
         {saved && <p className="text-emerald-600 font-medium">Settings saved successfully!</p>}
         <button 
           onClick={handleSave} 
           className="bg-indigo-600 text-white px-5 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
         >
           <Save className="w-4 h-4" /> Save Configuration
         </button>
      </div>
    </div>
  );
}
