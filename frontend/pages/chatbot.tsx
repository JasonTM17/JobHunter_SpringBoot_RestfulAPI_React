import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { fetchAiAvailability, sendChat } from "../services/jobhunter-api";
import { ChatMessage } from "../types/models";
import { toUserErrorMessage } from "../utils/error-message";
import { createId } from "../utils/format";

const AI_NOT_CONFIGURED_MESSAGE = "Tính năng AI hiện chưa được cấu hình trên máy chủ. Vui lòng thử lại sau.";
const AI_EMPTY_REPLY_MESSAGE = "Trợ lý AI chưa phản hồi được ở thời điểm này.";
const AI_UNAVAILABLE_FRIENDLY = "Trợ lý AI hiện chưa sẵn sàng. Vui lòng thử lại sau.";
const CHAT_PLACEHOLDER_DEFAULT = "Nhập câu hỏi của bạn...";
const CHAT_PLACEHOLDER_CHECKING = "Đang kiểm tra trạng thái trợ lý AI...";
const CHAT_PLACEHOLDER_UNAVAILABLE = "Trợ lý AI hiện chưa sẵn sàng.";
const GREETING = "Xin chào, mình là trợ lý Jobhunter. Bạn muốn tối ưu CV hay chuẩn bị phỏng vấn?";

type AiStatus = "checking" | "ready" | "unavailable";

export default function ChatbotPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [aiStatus, setAiStatus] = useState<AiStatus>("checking");
  const [aiNotice, setAiNotice] = useState("");
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLElement | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId("chat"),
      role: "assistant",
      text: GREETING
    }
  ]);

  const prefillJobId = useMemo(() => {
    const raw = router.query.jobId;
    if (!raw) return "";
    return Array.isArray(raw) ? raw[0] : raw;
  }, [router.query.jobId]);

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
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  }, [messages, sending, aiStatus]);

  function resetConversation() {
    setInput("");
    setSending(false);
    setLastFailedMessage(null);
    setMessages([
      {
        id: createId("chat"),
        role: "assistant",
        text: GREETING
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
      const payload = await sendChat(message);
      const reply = payload.reply?.trim() || AI_EMPTY_REPLY_MESSAGE;
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
        { id: createId("chat"), role: "assistant", isError: true, text: userMessage }
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
    <main className="mx-auto min-h-screen w-full max-w-[980px] px-3 py-5 sm:px-4">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
        <header className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-5 py-4 text-white">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-xl font-extrabold md:text-2xl">Trợ lý AI Jobhunter</h1>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={resetConversation}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                Làm mới hội thoại
              </button>
              <Link
                href={prefillJobId ? `/jobs/${prefillJobId}` : "/"}
                className="rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold text-white hover:bg-white/20"
              >
                {prefillJobId ? "Về chi tiết công việc" : "Về trang chủ"}
              </Link>
            </div>
          </div>
          {prefillJobId ? (
            <p className="mt-2 text-xs text-slate-200">Bạn đang tư vấn cho công việc ID: {prefillJobId}</p>
          ) : null}
        </header>

        <section ref={messagesContainerRef} className="grid max-h-[56vh] gap-2 overflow-y-auto bg-slate-50 px-3.5 py-3.5 sm:px-4 sm:py-4">
          {aiStatus !== "ready" ? (
            <article className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {aiStatus === "checking" ? "Đang kiểm tra trạng thái trợ lý AI..." : aiNotice || AI_UNAVAILABLE_FRIENDLY}
            </article>
          ) : null}

          {messages.map((message) => (
            <article
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl border border-emerald-200 bg-emerald-100 px-4 py-3 text-sm leading-relaxed text-emerald-900"
                  : message.isError
                    ? "max-w-[80%] rounded-2xl border border-rose-200 bg-rose-100 px-4 py-3 text-sm leading-relaxed text-rose-900"
                    : "max-w-[80%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700"
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
        </section>

        <form className="grid grid-cols-[1fr,auto] gap-2 border-t border-slate-200 bg-white p-3.5 max-md:grid-cols-1 sm:p-4" onSubmit={(event) => void submit(event)}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={3}
            disabled={inputDisabled}
            className="min-h-[72px] resize-vertical rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:cursor-not-allowed disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={inputDisabled || input.trim().length === 0}
            className="rounded-2xl bg-rose-600 px-6 py-2 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? "Đang gửi..." : "Gửi"}
          </button>
        </form>
      </section>
    </main>
  );
}
