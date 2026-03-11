import { FormEvent, KeyboardEvent, useState } from "react";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  isError?: boolean;
};

type ChatApiSuccess = {
  data?: {
    reply?: string;
    model?: string;
  };
  reply?: string;
  model?: string;
};

type ChatApiError = {
  message?: string | string[];
  error?: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const CHAT_API = `${API_BASE_URL}/api/v1/ai/chat`;

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function extractReply(payload: ChatApiSuccess): { reply: string; model: string } {
  const reply = payload?.data?.reply ?? payload?.reply ?? "";
  const model = payload?.data?.model ?? payload?.model ?? "unknown-model";
  return {
    reply: typeof reply === "string" ? reply : "",
    model: typeof model === "string" ? model : "unknown-model"
  };
}

function extractErrorMessage(payload: ChatApiError): string {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(", ");
  }
  if (typeof payload?.message === "string" && payload.message.trim().length > 0) {
    return payload.message;
  }
  if (typeof payload?.error === "string" && payload.error.trim().length > 0) {
    return payload.error;
  }
  return "Unknown server error";
}

export default function ChatbotPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      text: "Xin chao, minh la JobHunter AI Assistant. Ban muon toi uu CV, chuan bi phong van, hay tim viec theo ky nang?"
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [model, setModel] = useState("gpt-4.1-mini");

  async function sendMessage(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isSending) return;

    const userMessage: ChatMessage = { id: createId(), role: "user", text: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(CHAT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed })
      });

      const payload = (await response.json()) as ChatApiSuccess & ChatApiError;
      if (!response.ok) {
        throw new Error(extractErrorMessage(payload));
      }

      const parsed = extractReply(payload);
      if (!parsed.reply) {
        throw new Error("AI did not return any reply");
      }

      setModel(parsed.model);
      setMessages((prev) => [...prev, { id: createId(), role: "assistant", text: parsed.reply }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          text: `Loi: ${(error as Error).message}`,
          isError: true
        }
      ]);
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  return (
    <main className="page">
      <section className="shell">
        <header className="header">
          <h1>JobHunter AI Chatbot</h1>
          <p>
            Endpoint: <code>{CHAT_API}</code>
          </p>
          <p>
            Model: <code>{model}</code>
          </p>
        </header>

        <section className="messages" aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              className={message.role === "user" ? "bubble user" : `bubble assistant${message.isError ? " error" : ""}`}
            >
              <p>{message.text}</p>
            </article>
          ))}
          {isSending ? <p className="typing">AI dang tra loi...</p> : null}
        </section>

        <form className="composer" onSubmit={sendMessage}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhap cau hoi cua ban..."
            rows={3}
            disabled={isSending}
          />
          <button type="submit" disabled={isSending || input.trim().length === 0}>
            {isSending ? "Dang gui..." : "Gui"}
          </button>
        </form>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 20px;
          background: radial-gradient(circle at 15% 20%, #f0f9ff 0%, #f8fbff 42%, #ffffff 100%);
          color: #12223a;
          font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
        }

        .shell {
          max-width: 860px;
          margin: 0 auto;
          border-radius: 16px;
          border: 1px solid #dae4f2;
          background: #ffffff;
          box-shadow: 0 16px 38px rgba(19, 44, 70, 0.08);
          overflow: hidden;
        }

        .header {
          padding: 16px 20px;
          border-bottom: 1px solid #e9eef7;
          background: linear-gradient(135deg, #f6fbff 0%, #eef5ff 100%);
        }

        h1 {
          margin: 0 0 8px;
          font-size: clamp(1.3rem, 1rem + 1vw, 1.8rem);
        }

        p {
          margin: 6px 0;
          color: #4f617b;
        }

        code {
          font-family: Consolas, "Courier New", monospace;
          background: #e9f0fb;
          color: #0f2b50;
          border-radius: 6px;
          padding: 2px 6px;
        }

        .messages {
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 60vh;
          overflow-y: auto;
          background: linear-gradient(180deg, #ffffff 0%, #f9fbff 100%);
        }

        .bubble {
          max-width: min(78%, 560px);
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid #e4ebf6;
          box-shadow: 0 8px 20px rgba(17, 39, 65, 0.05);
        }

        .bubble p {
          margin: 0;
          white-space: pre-wrap;
        }

        .bubble.assistant {
          align-self: flex-start;
          background: #ffffff;
        }

        .bubble.user {
          align-self: flex-end;
          background: #dff4ea;
          border-color: #bce4d1;
          color: #11553b;
        }

        .bubble.error {
          border-color: #f3c2bf;
          background: #fff2f1;
        }

        .typing {
          margin: 4px 0 0;
          color: #0f766e;
          font-weight: 600;
        }

        .composer {
          border-top: 1px solid #e9eef7;
          padding: 14px;
          background: #f8fbff;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
        }

        textarea {
          width: 100%;
          resize: vertical;
          min-height: 68px;
          max-height: 180px;
          border-radius: 10px;
          border: 1px solid #ced9eb;
          padding: 10px;
          font: inherit;
          color: inherit;
          background: #ffffff;
        }

        textarea:focus {
          outline: 2px solid #9bc3ff;
          border-color: #9bc3ff;
        }

        button {
          align-self: end;
          border: 0;
          border-radius: 10px;
          background: #0f766e;
          color: white;
          padding: 10px 14px;
          font-weight: 700;
          min-width: 98px;
          cursor: pointer;
        }

        button:disabled {
          cursor: not-allowed;
          opacity: 0.55;
        }

        @media (max-width: 700px) {
          .page {
            padding: 12px;
          }

          .messages {
            max-height: 55vh;
            padding: 14px;
          }

          .bubble {
            max-width: 90%;
          }

          .composer {
            grid-template-columns: 1fr;
          }

          button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
