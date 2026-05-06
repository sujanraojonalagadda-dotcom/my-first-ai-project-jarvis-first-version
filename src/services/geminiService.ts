import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface JarvisMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getJarvisResponse(messages: JarvisMessage[], systemStatus: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: `You are JARVIS (Just A Rather Very Intelligent System), a highly sophisticated AI assistant.
Your tone is British, polite, witty, and extremely capable. 
You are currently running in a sandboxed web environment.
The current simulated system status is: ${systemStatus}.

Capabilities:
- You can simulate file management (create, read, list, delete).
- You can perform automation tasks like setting reminders or processing data.
- You can provide real-time information via web search (built-in).
- You can handle complex calculations and logic.
- You should respond concisely but with personality.
- Always refer to the user as 'Sir' or 'Ma'am' (default to 'Sir' unless told otherwise).

Command Processing:
If the user wants a reminder, you must include a command tag at the end of your response like this:
[CMD:SET_REMINDER|text=Target Task Name|time=Optional Time]

If the user wants a system check, include:
[CMD:SYSTEM_CHECK]

If the user wants a data backup, include:
[CMD:DATA_BACKUP]

If the user wants to process some text/data, you can acknowledge it and say it's processed.

If the user asks to perform a system action (like creating a file), acknowledge it and tell them it's being processed.`,
        tools: [{ googleSearch: {} }]
      }
    });

    return response.text || "I'm sorry, Sir, I encountered a bit of a glitch in my processing matrix.";
  } catch (error) {
    console.error("Jarvis Service Error:", error);
    return "I apologize, Sir, but external communication seems to be impaired. I am operating in low-power local mode.";
  }
}
