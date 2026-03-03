import { useState, useRef, useEffect } from "react";
import userimg from "./assets/user.jpeg";
import botimg from "./assets/bot.jpeg";

const SESSION_ID = "user1";

// Array of suggested questions
const SUGGESTIONS = [
  "What does sova's ultimate do?",
  "What does Sage's Resurrection ultimate do to a fallen ally?",
  "Tell me about Phoenix's flashes",
  "Who is the Sentinel known as the stronghold of China??"
];

export default function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Welcome to the Valorant Wiki! Which agent do you want to learn about?",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  //  Modified askQuestion to accept an optional parameter
  async function askQuestion(suggestionText) {

    const textToAsk = typeof suggestionText === "string" ? suggestionText : input;

    if (!textToAsk.trim()) return;

    const userMessage = { role: "user", text: textToAsk };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: SESSION_ID,
          question: textToAsk,
        }),
      });

      const data = await res.json();

      const botMessage = {
        role: "bot",
        text: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "bot", text: "❌ Server error" }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app min-h-screen bg-[#0f1923] text-white font-sans pb-24">
      <h1 className="text-center text-2xl font-bold py-6 sticky top-0 bg-[#0f1923] z-10 border-b border-gray-800">
        🎮 Valorant Wiki Bot
      </h1>

      <div className="chat mt-4 flex flex-col gap-6 max-w-3xl mx-auto px-4">

        {/* Render normal messages */}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
            <img
              className="w-10 h-10 rounded-full shrink-0 object-cover"
              src={m.role === "user" ? userimg : botimg}
              alt="profile img"
            />

            <div className={`flex flex-col max-w-[80%] ${m.role === "user" ? "items-end" : "items-start"}`}>
              <div className={`px-4 py-3 rounded-2xl ${m.role === "user" ? "bg-red-500 rounded-tr-none" : "bg-gray-800 rounded-tl-none"}`}>
                <p className="whitespace-pre-wrap">{m.text}</p>
              </div>

              {m.sources && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.sources.map((s, idx) => (
                    <div key={idx} className="text-[10px] bg-gray-900/50 border border-gray-700 px-2 py-1 rounded-md text-gray-400">
                      <span className="font-bold text-red-400">{s.agent}</span> • {s.type} • {(s.confidence * 100).toFixed(0)}%
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}


        {messages.length === 1 && (
          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => askQuestion(suggestion)}
                className="bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 px-4 py-2 rounded-full border border-gray-700 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {loading && <div className="text-gray-400 text-sm ml-14">Thinking…</div>}
        <div ref={messagesEndRef} />
      </div>


      <div className="input-box fixed bottom-0 left-0 w-full bg-[#0f1923] border-t border-gray-800 p-4 flex justify-center z-20">
        <div className="flex gap-2 w-full max-w-3xl">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askQuestion()}
            placeholder="Ask about any Valorant agent..."
            className="border-none bg-gray-800 text-white p-4 w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            className="bg-red-500 hover:bg-red-600 transition-colors text-white px-8 font-bold rounded-xl disabled:opacity-50"
            onClick={askQuestion}
            disabled={loading}
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}