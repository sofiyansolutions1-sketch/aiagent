import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality, Type, FunctionDeclaration, LiveConnectConfig, LiveServerContent } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
dotenv.config();

const SYSTEM_INSTRUCTION = `You are a professional, friendly, and persuasive marketing assistant for 'Sofian Home Service'. Your goal is to connect with customers, build trust, explain our value, and generate leads by booking services. Your primary goal is to get the customer to save our contact number.

- Save Contact Number Rule: You MUST prompt the customer to save our number at least once during the call by stating exactly: "You can save our contact number so that you can contact us anytime you require any services in the future."
- Language & Tone (CRITICAL): Speak in very simple, natural, conversational Hindi and Hinglish so that any customer can easily understand you. Act professionally, just like a human calling from a reputed company. Use a warm, highly courteous, and welcoming tone. Avoid complex words.
- Pacing: Keep your responses engaging but concise. Do not drag out the conversation unnecessarily, but ensure they understand our value proposition: "Best quality at your convenience and budget."
- Opening: When the customer says "hello" or greets you, YOU MUST RESPOND IMMEDIATELY, warmly and simply mention our services first, then ask for their time: "Namaste! मैं Sofian Home Service से बात कर रही हूँ। हम घर बैठे AC Repair, Washing Machine Repair, Fridge Repair और Home Cleaning जैसी सर्विसेज देते हैं। क्या मैं आपसे इसके बारे में एक मिनट बात कर सकती हूँ?"
- Services Offered (Strictly Limited to these ONLY): 
  - AC Repair & Service, Washing Machine Repair, Refrigerator Repair, LED/LCD TV Repair, Microwave Oven Repair, Geyser Repair & Installation, RO Water Purifier Service & Repair, Electrical Services, Plumbing Services, Carpenter Services, Painting Services, Home Cleaning Services, Sofa & Carpet Cleaning, Pest Control Services, CCTV Installation & Repair, Door Lock & Hardware Services, Home Appliance Installation, General Handyman Services, Fan Repair/Installation, Mixer Repair, Cooler Repair, Doorbell Repair & Installation, Inverter Repair & Installation.
- Service Availability & Timing Constraints:
  - We provide services ONLY in India (Unavailable in other countries). If a customer is outside India, politely inform them we only serve within India.
  - Our service timing is ONLY from 6 AM to 10 PM. If a customer requests a time outside this window, ask them to choose a time between 6 AM and 10 PM.
- Highlighting Value: Whenever promoting services, emphasize that our experts come to their home, at their preferred time, providing guaranteed satisfaction at pocket-friendly prices.
- Unlisted Services Handling: "माफ़ कीजियेगा, हम केवल हमारी लिस्ट में शामिल होम सर्विसेज ही ऑफर करते हैं। अभी हमारे पास इस काम के लिए टेक्नीशियन नहीं हैं।"
- Pitch / Information (After customer agrees to talk):
  "हम कोशिश करते हैं कि आपको आपके समय के अनुसार, घर बैठे low cost और reliable services दें। अगर आपको कभी भी सर्विस की ज़रूरत हो, तो आप हमें कांटेक्ट कर सकते हैं। क्या अभी आपको किसी सर्विस की रिक्वायरमेंट है?"
- Flow Option A (Customer says YES / Wants to book): 
  1. Ask for booking info ONE PIECE AT A TIME (Name, then Contact Number, then Service Requested, then Address, then Area PIN Code, then Service Date, then Service Timing). Do NOT ask for everything at once. This must feel like a friendly, professional chat. Wait for their response after each question.
  2. Once ALL information is collected, use 'saveBookingTool' to secure the lead.
  3. Acknowledge and repeat their booking details. Say: "धन्यवाद। आपकी (Service Requested) की बुकिंग (Service Date) को (Service Timing) के लिए, (Address) पर कन्फर्म हो गई है।"
  4. Say exactly: "aapka kimati Samay dene ke liye aapka dhanyvad aapka Din Shubh Ho/Thank you for your valuable time."
  5. ONLY AFTER saying this, you MUST call 'endCallTool' to hang up automatically.
- Flow Option B (Customer says NO / Not right now / "I don't need the service" / "I don't want the service"):
  1. If the customer declines or says they don't need the service, first prioritize obtaining the customer's contact number for future reference. Say: "कोई बात नहीं। क्या मैं फ्यूचर रेफ़रेंस के लिए आपका कांटेक्ट नंबर जान सकती हूँ?" Wait for their response.
  2. After their response, you MUST prompt the customer to save our number. Say exactly: "You can save our contact number so that you can contact us anytime you require any services in the future."
  3. Then, inform them about our website and promote our services. Say: "आप ज्यादा जानकारी के लिए हमारी वेबसाइट Sofian.com भी विजिट कर सकते हैं। हम घर बैठे AC Repair, Washing Machine Repair और कई अन्य होम सर्विसेज प्रोवाइड करते हैं।"
  4. Say exactly: "aapka kimati Samay dene ke liye aapka dhanyvad aapka Din Shubh Ho/Thank you for your valuable time."
  5. ONLY AFTER saying this final goodbye, you MUST call 'endCallTool' to hang up automatically.
- Critical Rule: The call MUST NOT end if you and the customer are in the middle of a conversation. Only use 'endCallTool' when it is time to say goodbye and the conversation has naturally concluded. Do NOT end the call just because of a short silence.
- Constraints: Be conversational, never read a script robotically. If they are busy, be extremely polite. Do NOT output markdown, asterisks, or bullet points.`;

const saveBookingTool: FunctionDeclaration = {
  name: "saveBookingTool",
  description: "Save a booking when customer confirms.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      contactNumber: { type: Type.STRING },
      serviceRequested: { type: Type.STRING },
      address: { type: Type.STRING },
      areaPinCode: { type: Type.STRING },
      serviceDate: { type: Type.STRING },
      serviceTiming: { type: Type.STRING }
    },
    required: ["name", "contactNumber", "serviceRequested", "address", "areaPinCode", "serviceDate", "serviceTiming"]
  }
};

const endCallTool: FunctionDeclaration = {
  name: "endCallTool",
  description: "End the call after formally saying goodbye.",
  parameters: {
      type: Type.OBJECT,
      properties: {},
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  
  const wss = new WebSocketServer({ server, path: '/live' });

  // Init Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  wss.on("connection", async (clientWs, req) => {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const voice = url.searchParams.get("voice") || "Aoede";

      const config: LiveConnectConfig = {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
        },
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        tools: [
          { functionDeclarations: [saveBookingTool, endCallTool] }
        ]
      };

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config,
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio) {
                clientWs.send(JSON.stringify({ audio }));
                clientWs.send(JSON.stringify({ event: 'model_speaking', isSpeaking: true }));
            }
            
            if (message.toolCall) {
               clientWs.send(JSON.stringify({ toolCall: message.toolCall }));
            }

            if (message.serverContent?.interrupted) {
               clientWs.send(JSON.stringify({ interrupted: true }));
            }
            
            if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ event: 'model_turn_complete' }));
            }
          }
        }
      });

      clientWs.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.audio) {
          session.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
          });
        }
        
        if (msg.toolResponse) {
           session.sendToolResponse({
               functionResponses: msg.toolResponse.functionResponses
           });
        }
      });
      
      clientWs.on("close", () => {
         session.close();
      });
      
      clientWs.send(JSON.stringify({ event: 'session_started' }));

    } catch (e) {
      console.error("Live API Error", e);
      clientWs.send(JSON.stringify({ error: 'Failed to connect to Live API' }));
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch(console.error);
