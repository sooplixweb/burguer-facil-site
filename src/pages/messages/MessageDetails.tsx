import { ArrowLeft, CheckCheck, Clock, Phone, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import styles from "./Messages.module.css";
import { getThreadById, type ChatMessage } from "./messagesMock";

type MessageLocationState = {
  returnTo?: string;
};

function createInitialMessages(messages: ChatMessage[]) {
  return messages;
}

export default function MessageDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { threadId } = useParams();
  const thread = getThreadById(threadId);
  const locationState = (location.state || {}) as MessageLocationState;
  const returnTo = locationState.returnTo || "/main";
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(() =>
    createInitialMessages(thread?.messages || []),
  );

  const title = thread?.name || "Mensagem";
  const status = thread?.status || "Atendimento";

  const orderedMessages = useMemo(() => messages, [messages]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    const time = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    setMessages((current) => [
      ...current,
      {
        id: `${threadId || "thread"}-${Date.now()}`,
        from: "customer",
        text,
        time,
      },
    ]);
    setDraft("");
  }

  return (
    <div className={styles.screen}>
      <main className={`${styles.content} ${styles.detailContent}`}>
        <section className={styles.detailShell} aria-label={title}>
          <header className={styles.detailTop}>
            <button
              className={styles.backButton}
              type="button"
              onClick={() => navigate("/mensagens", { state: { returnTo } })}
              aria-label="Voltar para mensagens"
            >
              <ArrowLeft size={21} />
            </button>

            <div className={styles.threadAvatar}>{title.charAt(0)}</div>
            <div className={styles.detailTitle}>
              <h1>{title}</h1>
              <span>
                <Clock size={14} />
                {status}
              </span>
            </div>
            <button
              className={styles.callButton}
              type="button"
              aria-label="Ligar para a loja"
            >
              <Phone size={19} />
            </button>
          </header>

          <div className={styles.messageList}>
            {orderedMessages.map((message) => (
              <article
                key={message.id}
                className={`${styles.messageBubble} ${
                  message.from === "customer"
                    ? styles.customerMessage
                    : styles.storeMessage
                }`}
              >
                <p>{message.text}</p>
                <span>
                  {message.time}
                  {message.from === "customer" ? <CheckCheck size={14} /> : null}
                </span>
              </article>
            ))}
          </div>

          <form
            className={styles.composer}
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
          >
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Digite sua mensagem"
            />
            <button type="submit" aria-label="Enviar mensagem">
              <Send size={19} />
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}
