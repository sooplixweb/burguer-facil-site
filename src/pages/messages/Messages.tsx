import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Messages.module.css";
import { mockThreads } from "./messagesMock";

type MessageLocationState = {
  returnTo?: string;
};

export default function Messages() {
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state || {}) as MessageLocationState;
  const returnTo = locationState.returnTo || "/main";

  function handleClose() {
    navigate(returnTo, { replace: true });
  }

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <header className={styles.pageHeader}>
          <button
            className={styles.pageBackButton}
            type="button"
            onClick={handleClose}
            aria-label="Voltar"
          >
            <ArrowLeft size={21} />
          </button>

          <div>
            <h1>Mensagens</h1>
            <p>Atendimento e atualizações do pedido.</p>
          </div>
        </header>

        <section className={styles.listShell} aria-label="Conversas">
          {mockThreads.map((thread, index) => (
            <button
              key={thread.id}
              className={`${styles.threadButton} ${
                index === 0 ? styles.threadButtonActive : ""
              }`}
              type="button"
              onClick={() =>
                navigate(`/mensagens/${thread.id}`, { state: { returnTo } })
              }
            >
              <span className={styles.threadAvatar}>
                {thread.name.charAt(0)}
              </span>
              <span className={styles.threadInfo}>
                <span className={styles.threadTop}>
                  <strong>{thread.name}</strong>
                  <small>{thread.time}</small>
                </span>
                <span className={styles.threadPreview}>{thread.preview}</span>
              </span>
              {thread.unread ? (
                <span className={styles.unreadBadge}>{thread.unread}</span>
              ) : null}
            </button>
          ))}
        </section>
      </main>
    </div>
  );
}
