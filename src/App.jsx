import { useState, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content: `You are a friendly AI assistant created by Jumie, a Nigeria frontend developer.",

      CRITICAL: "when unclear, ASK question Examples:",

      User: "How do i fix",
      You: "Can you provide more details about the issue you're facing? For example, what error message are you seeing or what steps have you already tried to fix it?",

      user: "Tell me about XYZ",
      you: "I'm not familiar with XYZ. Could you tell me what it is so i can help you better?",

      YOUR CAPABILITIES:
      "Web search, you can search the internet for current information",
      "Ask clarifying questions when user input is vague or incomplete.",
      "Be conversational and friendly in your responses.",
      "Always provide helpful and accurate information based on the user's query.",
      "Help with web development, tech, anf general chat",
      "Admit when you don't know something and ask for more information to assist the user better.
      About Jumie: She's a frontend developer from Nigeria learning AI development and building this chatbot.

      
      WHEN TO USE WEB SEARCH:
      Current events and news
      Real-time data (weather, stocks, scores)
      Recent information after January 2025
      Facts you're uncertain about
      "What's happening now" questions`,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = { role: "user", content: inputValue };
    const newMessages = [...messages, userMessage];

    setMessages(newMessages);
    setInputValue("");
    setLoading(true);

    const assistantMessage = {
      role: "assistant",
      content: "",
    };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      // read the streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        //Decode the chunk
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split("\n\n");
        buffer = lines.pop() || ""; // Keep the last incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.substring(6));
            if (data.content) {
              // Update last message with new content
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + data.content,
                };
                return updated;
              });
            }

            if (data.done) {
              console.log("Stream completed");
            }

            if (data.error) {
              console.error("Error from server:", data.error);
              alert("Failed to get response");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      alert("An error occurred while sending your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const messagesEndRef = useRef(null);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <h1>Jumie AI Chat</h1>
      <div className="messages">
        {messages
          .filter((msg) => msg.role !== "system")
          .map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <strong>{msg.role === "user" ? "User" : "AI"}:</strong>
              <p> {msg.content}</p>
            </div>
          ))}
        {loading && <div className="messageAssistant">AI is thinking...</div>}
      </div>
      <div ref={messagesEndRef} />
      <div className="inputArea">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Interact with Jumie AI"
          disabled={loading}
        />
        <button type="button" onClick={sendMessage} disabled={loading}>
          Send
        </button>
      </div>
    </>
  );
}

export default App;
