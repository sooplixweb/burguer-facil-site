import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  LogOut,
  MapPin,
  Settings,
  Star,
  Ticket,
  User,
} from "lucide-react";
import { Header } from "../../components/Header/Header";
import styles from "./Profile.module.css";

const profileActions = [
  {
    title: "Histórico",
    subtitle: "Ver pedidos",
    icon: ClipboardList,
  },
  {
    title: "Endereços",
    subtitle: "Gerenciar",
    icon: MapPin,
  },
  {
    title: "Cupons",
    subtitle: "Ver cupons",
    icon: Ticket,
  },
  {
    title: "Pagamentos",
    subtitle: "Formas salvas",
    icon: CreditCard,
  },
];

const settingsOptions = [
  {
    title: "Editar perfil",
    subtitle: "Nome, e-mail e telefone",
    icon: User,
  },
  {
    title: "Notificações",
    subtitle: "Preferências de alertas",
    icon: Bell,
  },
  {
    title: "Ajuda e suporte",
    subtitle: "Fale conosco",
    icon: CircleHelp,
  },
  {
    title: "Configurações",
    subtitle: "Privacidade e segurança",
    icon: Settings,
  },
  {
    title: "Sair da conta",
    subtitle: "Encerrar sessão",
    icon: LogOut,
  },
];

export default function Profile() {

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <section className={styles.profileCard}>
          <img
            className={styles.avatar}
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
            alt="Anderson Mendes"
          />

          <div className={styles.profileInfo}>
            <h1>Anderson Mendes</h1>
            <span>
              <Star size={14} />
              Cliente desde 2026
            </span>
          </div>

          <ChevronRight className={styles.chevron} size={24} />
        </section>

        <section className={styles.quickGrid} aria-label="Atalhos do perfil">
          {profileActions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                className={styles.quickCard}
                type="button"
              >
                <Icon size={30} />
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
              </button>
            );
          })}
        </section>

        <section className={styles.recentSection}>
          <div className={styles.sectionTitle}>
            <h2>Pedido recente</h2>
            <button type="button">
              Ver todos
              <ChevronRight size={20} />
            </button>
          </div>

          <button className={styles.recentOrder} type="button">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80"
              alt="Monster Bacon"
            />

            <div className={styles.orderInfo}>
              <span className={styles.status}>Entregue</span>
              <strong>Monster Bacon</strong>
              <p>1x Monster Bacon</p>
              <p>1x Batata Rústica</p>
              <span className={styles.orderDate}>
                <CalendarDays size={14} />
                25/05/2026 - 19:48
              </span>
            </div>

            <div className={styles.orderRight}>
              <ChevronRight size={22} />
              <strong>R$ 49,90</strong>
            </div>
          </button>
        </section>

        <section className={styles.optionsList} aria-label="Opções da conta">
          {settingsOptions.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.title}
                className={styles.optionItem}
                type="button"
              >
                <Icon className={styles.optionIcon} size={26} />
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.subtitle}</small>
                </span>
                <ChevronRight className={styles.optionChevron} size={22} />
              </button>
            );
          })}
        </section>
      </main>
    </div>
  );
}
