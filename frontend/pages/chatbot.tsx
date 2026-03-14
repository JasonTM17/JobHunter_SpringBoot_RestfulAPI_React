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
const GREETING = "Xin chào, mình là trợ lý Jobhunter. Bạn muốn tối ưu CV, chuẩn bị phỏng vấn hay phân tích JD?";

type AiStatus = "checking" | "ready" | "unavailable";

function statusClasses(aiStatus: AiStatus) {
  if (aiStatus === "ready") {
    return {
      badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
      dot: "bg-emerald-500",
      panel: "border-emerald-200 bg-emerald-50/80 text-emerald-900"
    };
  }

  if (aiStatus === "checking") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      dot: "bg-amber-500",
      panel: "border-amber-200 bg-amber-50/80 text-amber-900"
    };
  }

  return {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    panel: "border-rose-200 bg-rose-50/80 text-rose-900"
  };
}

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

  const promptSuggestions = useMemo(() => {
    const base = [
      "Giúp mình viết phần tóm tắt CV cho vị trí frontend developer.",
      "Cho mình 5 câu hỏi phỏng vấn phổ biến và cách trả lời ngắn gọn.",
      "Đề xuất email ứng tuyển ngắn gọn nhưng chuyên nghiệp."
    ];

    if (!prefillJobId) {
      return base;
    }

    return [
      `Phân tích nhanh JD của công việc #${prefillJobId} và cho mình 3 điểm cần nhấn mạnh trong CV.`,
      `Hãy gợi ý 5 câu hỏi phỏng vấn có thể gặp cho công việc #${prefillJobId}.`,
      `Viết giúp mình đoạn giới thiệu bản thân phù hợp để ứng tuyển công việc #${prefillJobId}.`
    ];
  }, [prefillJobId]);

  const statusCopy = useMemo(() => {
    if (aiStatus === "ready") {
      return {
        label: "AI sẵn sàng",
        description: "Bạn có thể hỏi về CV, phỏng vấn, email ứng tuyển và phân tích JD ngay bây giờ."
      };
    }

    if (aiStatus === "checking") {
      return {
        label: "Đang kiểm tra hệ thống",
        description: "Jobhunter đang xác minh kết nối tới trợ lý AI trước khi mở phiên tư vấn."
      };
    }

    return {
      label: "AI tạm thời chưa khả dụng",
      description: aiNotice || AI_UNAVAILABLE_FRIENDLY
    };
  }, [aiNotice, aiStatus]);

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

  function usePrompt(prompt: string) {
    if (aiStatus === "ready" && !sending) {
      void submitMessage(prompt);
      return;
    }

    setInput(prompt);
  }

  const inputDisabled = sending || aiStatus !== "ready";
  const placeholder =
    aiStatus === "checking"
      ? CHAT_PLACEHOLDER_CHECKING
      : aiStatus === "unavailable"
        ? CHAT_PLACEHOLDER_UNAVAILABLE
        : CHAT_PLACEHOLDER_DEFAULT;
  const statusTone = statusClasses(aiStatus);

  return (
    <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[1.3fr,0.7fr]">
        <article className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-soft">
          <header className="border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-5 py-5 text-white sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
                  Trợ lý nghề nghiệp AI
                </p>
                <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">Trợ lý AI Jobhunter</h1>
                <p className="mt-3 text-sm leading-7 text-slate-200 sm:text-base">
                  Dùng trợ lý để tối ưu CV, chuẩn bị phỏng vấn, viết email ứng tuyển và phân tích nhanh JD trước khi nộp hồ sơ.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={resetConversation}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Làm mới hội thoại
                </button>
                <Link
                  href={prefillJobId ? `/jobs/${prefillJobId}` : "/"}
                  className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  {prefillJobId ? "Về chi tiết công việc" : "Về trang chủ"}
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusTone.badge}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${statusTone.dot}`} />
                {statusCopy.label}
              </div>
              {prefillJobId ? (
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/85">
                  Ngữ cảnh công việc: #{prefillJobId}
                </div>
              ) : null}
            </div>
          </header>

          <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
            <div className="grid gap-3">
              <p className="max-w-3xl text-sm leading-6 text-slate-600">{statusCopy.description}</p>
              <div className="flex flex-wrap gap-2">
                {promptSuggestions.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => usePrompt(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:text-rose-700"
                  >
                    {prompt.length > 48 ? `${prompt.slice(0, 48)}...` : prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section
            ref={messagesContainerRef}
            className="grid min-h-[420px] max-h-[62vh] gap-4 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,1),_rgba(248,250,252,1)_55%,_rgba(241,245,249,1)_100%)] px-5 py-5 sm:px-6"
          >
            {aiStatus !== "ready" ? (
              <article className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${statusTone.panel}`}>
                {aiStatus === "checking" ? "Đang kiểm tra trạng thái trợ lý AI..." : aiNotice || AI_UNAVAILABLE_FRIENDLY}
              </article>
            ) : null}

            {messages.length === 1 && aiStatus === "ready" ? (
              <div className="grid gap-3 rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm sm:grid-cols-3">
                {promptSuggestions.map((prompt, index) => (
                  <button
                    key={`${prompt}-${index}`}
                    type="button"
                    onClick={() => usePrompt(prompt)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left text-sm font-medium leading-6 text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            {messages.map((message) => {
              const isUser = message.role === "user";
              const bubbleClass = isUser
                ? "ml-auto border-emerald-200 bg-emerald-50 text-emerald-950"
                : message.isError
                  ? "border-rose-200 bg-rose-50 text-rose-900"
                  : "border-slate-200 bg-white text-slate-700";

              return (
                <article key={message.id} className={`max-w-[88%] rounded-[28px] border px-4 py-4 shadow-sm sm:px-5 ${bubbleClass} ${isUser ? "justify-self-end" : "justify-self-start"}`}>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{isUser ? "Bạn" : message.isError ? "Hệ thống" : "Jobhunter AI"}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 sm:text-[15px]">{message.text}</p>
                </article>
              );
            })}

            {sending ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                Trợ lý đang phản hồi...
              </div>
            ) : null}
          </section>

          <div className="border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
            {lastFailedMessage && aiStatus === "ready" && !sending ? (
              <button
                type="button"
                onClick={retryLastMessage}
                className="mb-3 inline-flex rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Gửi lại câu vừa rồi
              </button>
            ) : null}

            <form className="grid gap-3 lg:grid-cols-[1fr,auto]" onSubmit={(event) => void submit(event)}>
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                rows={4}
                disabled={inputDisabled}
                className="min-h-[110px] resize-y rounded-[26px] border border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 transition focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-100 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <button
                type="submit"
                disabled={inputDisabled || input.trim().length === 0}
                className="rounded-[26px] bg-rose-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60 lg:self-end"
              >
                {sending ? "Đang gửi..." : "Gửi câu hỏi"}
              </button>
            </form>
          </div>
        </article>

        <aside className="grid gap-4 self-start">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Trạng thái phiên</p>
            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">{statusCopy.label}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">{statusCopy.description}</p>
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${statusTone.panel}`}>
              {aiStatus === "ready"
                ? "Phiên tư vấn đang hoạt động bình thường. Bạn có thể gửi câu hỏi nối tiếp để đào sâu cùng một chủ đề."
                : aiStatus === "checking"
                  ? "Hệ thống sẽ mở nhập liệu ngay khi kiểm tra xong khả năng phản hồi của AI."
                  : "Trong lúc AI chưa sẵn sàng, bạn vẫn có thể chuẩn bị câu hỏi hoặc quay về tin tuyển dụng để đọc JD chi tiết."}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-soft sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Cách dùng hiệu quả</p>
            <ul className="mt-4 grid gap-3 text-sm leading-7 text-slate-600">
              <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Nêu rõ vai trò mục tiêu, số năm kinh nghiệm và tech stack để câu trả lời bám thực tế hơn.</li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Nếu cần viết CV hoặc email, hãy nói rõ giọng điệu mong muốn: ngắn gọn, formal hoặc thuyết phục.</li>
              <li className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">Khi đang xem một job cụ thể, mở chatbot từ job đó để trợ lý phân tích đúng JD và yêu cầu tuyển dụng.</li>
            </ul>
          </section>

          {prefillJobId ? (
            <section className="rounded-[28px] border border-slate-200 bg-gradient-to-br from-rose-50 via-white to-white p-5 shadow-soft sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">Ngữ cảnh hiện tại</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Công việc #{prefillJobId}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Bạn đang tư vấn trong ngữ cảnh một tin tuyển dụng cụ thể. Hãy hỏi trợ lý về điểm nổi bật trong JD, keyword nên thêm vào CV hoặc câu trả lời phỏng vấn phù hợp với vị trí này.
              </p>
              <Link
                href={`/jobs/${prefillJobId}`}
                className="mt-5 inline-flex rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Mở lại chi tiết công việc
              </Link>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
