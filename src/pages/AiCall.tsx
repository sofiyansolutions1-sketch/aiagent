import { useState, useRef, useEffect } from "react";
import { Mic, PhoneOff, Phone, ActivitySquare, ShieldAlert } from "lucide-react";
import { pcmToBase64, playAudioChunk, resetAudioPlayback } from "../lib/audio";
import { getSupabase } from "../lib/supabase";

export function AiCall() {
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<{ id: string; type: string; message: string }[]>([]);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (type: 'info' | 'tool' | 'error', message: string) => {
    setLogs(prev => [...prev, { id: Math.random().toString(), type, message }].slice(-20)); // keep last 20
  };

  const startCall = async () => {
    try {
      addLog('info', 'Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const inputCtx = new AudioContext({ sampleRate: 16000 });
      inputAudioCtxRef.current = inputCtx;
      
      const outputCtx = new AudioContext({ sampleRate: 24000 });
      outputAudioCtxRef.current = outputCtx;
      
      resetAudioPlayback();

      // Configure WebSocket
      const voice = localStorage.getItem("ai_voice") || "Aoede";
      const backendUrl = localStorage.getItem("backend_ws_url");
      let wsUrl = '';
      if (backendUrl) {
          try {
              const url = new URL(backendUrl);
              const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
              wsUrl = `${wsProtocol}//${url.host}/live?voice=${voice}`;
          } catch(e) {
              addLog('error', 'Invalid backend URL in settings. Using local.');
              const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
              wsUrl = `${protocol}//${window.location.host}/live?voice=${voice}`;
          }
      } else {
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${protocol}//${window.location.host}/live?voice=${voice}`;
      }
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        addLog('info', 'Connected to Live AI Server.');
        const webhookUrl = localStorage.getItem("call_active_webhook");
        if (webhookUrl) {
           fetch(webhookUrl, { method: "POST", mode: "no-cors" })
             .then(() => addLog('info', 'Triggered Call Active Webhook'))
             .catch(e => addLog('error', `Failed to trigger active webhook: ${e}`));
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        addLog('info', 'Call ended.');
        cleanup();
        const webhookUrl = localStorage.getItem("call_ending_webhook");
        if (webhookUrl) {
           fetch(webhookUrl, { method: "POST", mode: "no-cors" })
             .then(() => addLog('info', 'Triggered Call Ending Webhook'))
             .catch(e => addLog('error', `Failed to trigger ending webhook: ${e}`));
        }
      };
      
      ws.onerror = () => {
        addLog('error', 'WebSocket connection error.');
      };

      ws.onmessage = async (event) => {
        const msg = JSON.parse(event.data);
        
        if (msg.error) {
            addLog('error', msg.error);
        }
        
        if (msg.audio) {
            playAudioChunk(outputCtx, msg.audio);
        }
        
        if (msg.interrupted) {
            resetAudioPlayback();
        }

        if (msg.event === 'model_speaking') {
           setIsAiSpeaking(true);
           if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
           stopTimeoutRef.current = setTimeout(() => setIsAiSpeaking(false), 2000);
        }

        if (msg.toolCall) {
            await handleToolCall(ws, msg.toolCall);
        }
      };

      // Capture audio
      const source = inputCtx.createMediaStreamSource(stream);
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(inputCtx.destination);

      processor.onaudioprocess = (e) => {
         // Don't send audio if muted. Wait do we have access to latest isMuted?
         // Since this is a callback, we can use a ref, or just check the stream track.
         const track = stream.getAudioTracks()[0];
         if (!track.enabled) return; // Muted

         if (ws.readyState === WebSocket.OPEN) {
             const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
             ws.send(JSON.stringify({ audio: base64 }));
         }
      };

    } catch (e) {
      console.error(e);
      addLog('error', 'Microphone access denied or error occurred.');
    }
  };

  const handleToolCall = async (ws: WebSocket, toolCall: any) => {
      const functionCalls = toolCall.functionCalls;
      if (!functionCalls) return;

      const functionResponses = [];

      for (const call of functionCalls) {
          if (call.name === 'saveBookingTool') {
              addLog('tool', `AI invoked saveBookingTool for ${call.args.name || 'Unknown'}`);
              const sup = getSupabase();
              
              if (!sup) {
                  addLog('error', `Supabase not configured. Failed to save lead.`);
                  functionResponses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "Failed: Database not configured." }
                  });
                  continue;
              }

              const { data, error } = await sup.from('bookings').insert([{
                  customer_name: call.args.name,
                  contact_number: call.args.contactNumber,
                  address: call.args.address,
                  area_pin_code: call.args.areaPinCode,
                  service_details: call.args.serviceRequested,
                  service_date: call.args.serviceDate,
                  service_timing: call.args.serviceTiming
              }]);

              if (error) {
                  addLog('error', `Failed to save booking: ${error.message}`);
                  functionResponses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "Failed to save booking to database." }
                  });
              } else {
                  addLog('info', `Booking saved successfully.`);
                  functionResponses.push({
                      id: call.id,
                      name: call.name,
                      response: { result: "Booking successfully saved." }
                  });
              }
          } 
          else if (call.name === 'endCallTool') {
              addLog('tool', 'AI invoked endCallTool. Ending call...');
              functionResponses.push({
                  id: call.id,
                  name: call.name,
                  response: { result: "Hung up." }
              });
              // End call gracefully
              setTimeout(endCall, 4000);
          }
      }

      ws.send(JSON.stringify({
          toolResponse: { functionResponses }
      }));
  };

  const endCall = () => {
    if (wsRef.current) wsRef.current.close();
    cleanup();
    setIsConnected(false);
  };

  const cleanup = () => {
    if (processorRef.current) processorRef.current.disconnect();
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach(t => t.stop());
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
  };

  const toggleMute = () => {
      if (mediaStreamRef.current) {
          const track = mediaStreamRef.current.getAudioTracks()[0];
          track.enabled = !track.enabled;
          setIsMuted(!track.enabled);
      }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-8rem)]">
      {/* Visual Call Interface */}
      <div className="flex-1 bg-slate-900 rounded-2xl shadow-xl border border-slate-800 overflow-hidden relative flex flex-col items-center justify-center p-8">
         <div className="relative flex items-center justify-center w-48 h-48 mb-8">
            {/* Pulsing rings when AI is speaking */}
            {isAiSpeaking && (
              <>
                 <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20"></div>
                 <div className="absolute inset-4 bg-indigo-400 rounded-full animate-pulse opacity-30"></div>
              </>
            )}
            
            <div className="relative z-10 w-32 h-32 bg-indigo-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)]">
               <ActivitySquare className="w-12 h-12 text-white" />
            </div>
         </div>
         
         <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-white mb-2">Sofian AI Assistant</h3>
            <p className="text-slate-400 font-medium">
               {isConnected ? (isAiSpeaking ? "Assistant is speaking..." : "Listening...") : "Ready for call."}
            </p>
         </div>

         <div className="flex items-center gap-6">
            {!isConnected ? (
                <button 
                  onClick={startCall}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg shadow-emerald-500/20"
                >
                   <Phone className="w-6 h-6 fill-current" />
                </button>
            ) : (
               <>
                 <button 
                  onClick={toggleMute}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${isMuted ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-slate-700 hover:bg-slate-600 text-white shadow-black/20'}`}
                 >
                    <Mic className="w-6 h-6" />
                 </button>
                 <button 
                  onClick={endCall}
                  className="bg-rose-500 hover:bg-rose-600 text-white w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg shadow-rose-500/20"
                 >
                    <PhoneOff className="w-6 h-6" />
                 </button>
               </>
            )}
         </div>
      </div>

      {/* Logs Interface */}
      <div className="w-full lg:w-96 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden text-sm">
         <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
             <ShieldAlert className="w-4 h-4 text-slate-500" />
             <h3 className="font-semibold text-slate-800">System Logs</h3>
         </div>
         <div className="flex-1 overflow-y-auto p-5 space-y-3 font-mono text-xs">
            {logs.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No events to display.</p>
            ) : (
               logs.map(log => (
                  <div key={log.id} className="border-l-2 pl-3 py-0.5">
                     <span className={`font-semibold uppercase tracking-wider text-[10px] ${
                         log.type === 'info' ? 'text-blue-500' :
                         log.type === 'tool' ? 'text-indigo-500' : 'text-rose-500'
                     }`}>[{log.type}]</span>
                     <p className="text-slate-700 leading-relaxed mt-0.5">{log.message}</p>
                  </div>
               ))
            )}
         </div>
      </div>
    </div>
  );
}
