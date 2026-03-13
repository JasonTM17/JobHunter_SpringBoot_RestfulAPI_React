import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { fetchAiAvailability, sendChat } from "../../services/jobhunter-api";
import { ChatMessage } from "../../types/models";
import { toUserErrorMessage } from "../../utils/error-message";
import { createId } from "../../utils/format";

const AI_NOT_CONFIGURED_MESSAGE = "Tính năng AI hiện chưa được cấu hình trên máy chủ. Vui lòng thử lại sau.";
const AI_EMPTY_REPLY_MESSAGE = "Trợ lý AI chưa phản hồi được ở thời điểm này.";
const AI_UNAVAILABLE_FRIENDLY = "Trợ lý AI hiện chưa sẵn sàng. Vui lòng thử lại sau.";
const CHAT_PLACEHOLDER_DEFAULT = "Nhập câu hỏi về CV, phỏng vấn hoặc công việc...";
const CHAT_PLACEHOLDER_CHECKING = "Đang kiểm tra trạng thái trợ lý AI...";
const CHAT_PLACEHOLDER_UNAVAILABLE = "Trợ lý AI hiện chưa sẵn sàng.";
const DEFAULT_GREETING = "Xin chào, mình là trợ lý Jobhunter. Bạn cần hỗ trợ gì cho quá trình tìm việc?";

type AiStatus = "checking" | "ready" | "unavailable";

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("checking");
  const [aiNotice, setAiNotice] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId("chat"),
      role: "assistant",
      text: DEFAULT_GREETING
    }
  ]);

  useEffect(() => {
    let active = true;

    async function loadAiStatus() {
      setAiStatus("checking");
      try {
        const status = await fetchAiAvailability();
        if (!active) return;

        if (status.available) {
          setAiStatus("ready");
          setAiNotice("");
          return;
        }

        setAiStatus("unavailable");
        setAiNotice(status.message?.trim() || AI_UNAVAILABLE_FRIENDLY);
      } catch {
        if (!active) return;
        setAiStatus("unavailable");
        setAiNotice(AI_UNAVAILABLE_FRIENDLY);
      }
    }

    void loadAiStatus();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, sending, aiStatus, open]);

  function resetConversation() {
    setInput("");
    setSending(false);
    setLastFailedMessage(null);
    setMessages([
      {
        id: createId("chat"),
        role: "assistant",
        text: DEFAULT_GREETING
      }
    ]);
  }

  async function submitMessage(rawMessage: string) {
    const message = rawMessage.trim();
    if (!message || sending || aiStatus !== "ready") return;

    setMessages((prev) => [...prev, { id: createId("chat"), role: "user", text: message }]);
    setInput("");
    setSending(true);

    try {
      const response = await sendChat(message);
      const reply = response.reply?.trim() || AI_EMPTY_REPLY_MESSAGE;
      setMessages((prev) => [...prev, { id: createId("chat"), role: "assistant", text: reply }]);
      setLastFailedMessage(null);
    } catch (error) {
      const userMessage = toUserErrorMessage(error, "Không thể kết nối tới trợ lý AI.");
      if (userMessage === AI_NOT_CONFIGURED_MESSAGE || userMessage === AI_UNAVAILABLE_FRIENDLY) {
        setAiStatus("unavailable");
        setAiNotice(AI_UNAVAILABLE_FRIENDLY);
        setLastFailedMessage(null);
        return;
      }

      setLastFailedMessage(message);
      setMessages((prev) => [
        ...prev,
        {
          id: createId("chat"),
          role: "assistant",
          isError: true,
          text: userMessage
        }
      ]);
    } finally {
      setSending(false);
    }
  }

  async function submit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    await submitMessage(input);
  }

  function retryLastMessage() {
    if (!lastFailedMessage || sending || aiStatus !== "ready") return;
    void submitMessage(lastFailedMessage);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  const inputDisabled = sending || aiStatus !== "ready";
  const placeholder =
    aiStatus === "checking"
      ? CHAT_PLACEHOLDER_CHECKING
      : aiStatus === "unavailable"
        ? CHAT_PLACEHOLDER_UNAVAILABLE
        : CHAT_PLACEHOLDER_DEFAULT;

  return (
    <div className="fixed bottom-3 right-3 z-40 sm:bottom-4 sm:right-4">
      {open ? (
        <section className="grid h-[min(500px,calc(100vh-6rem))] w-[min(330px,calc(100vw-1rem))] grid-rows-[auto,1fr,auto] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[330px]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-slate-900 px-3 py-2.5 text-white">
            <strong className="text-sm">Trợ lý Jobhunter</strong>
            <div className="flex items-center gap-1.5">
              <button
                className="rounded-md border border-slate-500 px-2 py-1 text-[11px] font-semibold hover:bg-slate-700"
                onClick={resetConversation}
                type="button"
              >
                Làm mới
              </button>
              <button
                className="rounded-md border border-slate-500 px-2 py-1 text-[11px] font-semibold hover:bg-slate-700"
                onClick={() => setOpen(false)}
                type="button"
              >
                Đóng
              </button>
            </div>
          </header>

          <div ref={messagesContainerRef} className="grid gap-2 overflow-y-auto bg-slate-50 p-3">
            {aiStatus !== "ready" ? (
              <article className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {aiStatus === "checking" ? "Đang kiểm tra trạng thái trợ lý AI..." : aiNotice || AI_UNAVAILABLE_FRIENDLY}
              </article>
            ) : null}

            {messages.map((message) => (
              <article
                key={message.id}
                className={
                  message.role === "user"
                    ? "ml-auto max-w-[85%] rounded-xl border border-emerald-200 bg-emerald-100 px-3 py-2 text-sm text-emerald-900"
                    : message.isError
                      ? "max-w-[85%] rounded-xl border border-rose-200 bg-rose-100 px-3 py-2 text-sm text-rose-900"
                      : "max-w-[85%] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                }
              >
                {message.text}
              </article>
            ))}

            {sending ? <p className="text-xs font-semibold text-slate-500">Trợ lý đang phản hồi...</p> : null}
            {!sending && lastFailedMessage && aiStatus === "ready" ? (
              <button
                type="button"
                onClick={retryLastMessage}
                className="justify-self-start rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
              >
                Gửi lại câu vừa rồi
              </button>
            ) : null}
          </div>

          <form className="grid grid-cols-[1fr,auto] gap-2 border-t border-slate-200 bg-white p-3" onSubmit={submit}>
            <textarea
              className="min-h-[56px] resize-none rounded-xl border border-slate-300 p-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100"
              disabled={inputDisabled}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              rows={2}
              value={input}
            />
            <button
              className="rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={inputDisabled || input.trim().length === 0}
              type="submit"
            >
              Gửi
            </button>
          </form>
        </section>
      ) : (
        <button
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-700 text-white shadow-lg shadow-rose-500/30 transition hover:scale-105 sm:h-12 sm:w-12"
          onClick={() => setOpen(true)}
          type="button"
          aria-label="Mở trợ lý AI"
        >
          <img src="/chat-icon.svg" alt="Biểu tượng chat" className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
