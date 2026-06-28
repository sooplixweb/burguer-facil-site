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
import styles from "./Profile.module.css";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserService } from "../../service/user.service";
import type { UserResponseDto } from "../../dtos/response/user-response.dto";
import { useAuth } from "../../contexts/AuthContext";

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

function formatRegistrationDate(date?: string) {
  if (!date) return "2026";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "2026";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
}

export default function Profile() {
  const [user, setUser] = useState<UserResponseDto>();
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const hasLoadedUser = useRef(false);
  const optionEffectTimeoutRef = useRef<number | null>(null);
  const optionActionTimeoutRef = useRef<number | null>(null);
  const { logout: contextLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (hasLoadedUser.current) {
      return;
    }

    hasLoadedUser.current = true;
    const data = localStorage.getItem("userId");
    alert(JSON.stringify(data));
    const loadUser = async () => {
      try {
        const data = await UserService.findOne(
          "94249467-68d4-4730-bfb8-10a4e1cc4d38",
        );
        setUser(data);
      } catch (error) {
        alert("Erro ao buscar usuário");
        console.error(error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    return () => {
      if (optionEffectTimeoutRef.current) {
        window.clearTimeout(optionEffectTimeoutRef.current);
      }

      if (optionActionTimeoutRef.current) {
        window.clearTimeout(optionActionTimeoutRef.current);
      }
    };
  }, []);

  function handleOptionClick(title: string, onClick: () => void) {
    if (optionEffectTimeoutRef.current) {
      window.clearTimeout(optionEffectTimeoutRef.current);
    }

    if (optionActionTimeoutRef.current) {
      window.clearTimeout(optionActionTimeoutRef.current);
    }

    setActiveOption(title);

    optionEffectTimeoutRef.current = window.setTimeout(() => {
      setActiveOption(null);
      optionEffectTimeoutRef.current = null;
    }, 260);

    optionActionTimeoutRef.current = window.setTimeout(() => {
      onClick();
      optionActionTimeoutRef.current = null;
    }, 120);
  }

  function confirmLogout() {
    contextLogout();
    setShowLogoutModal(false);
    navigate("/login");
  }

  const settingsOptions = [
    {
      title: "Editar perfil",
      subtitle: "Nome, e-mail e telefone",
      icon: User,
      onClick: () => alert("Edit"),
    },
    {
      title: "Notificações",
      subtitle: "Preferências de alertas",
      icon: Bell,
      onClick: () => alert("Not"),
    },
    {
      title: "Ajuda e suporte",
      subtitle: "Fale conosco",
      icon: CircleHelp,
      onClick: () => alert("Help"),
    },
    {
      title: "Configurações",
      subtitle: "Privacidade e segurança",
      icon: Settings,
      onClick: () => alert("config"),
    },
    {
      title: "Sair da conta",
      subtitle: "Encerrar sessão",
      icon: LogOut,
      onClick: () => setShowLogoutModal(true),
    },
  ];

  return (
    <div className={styles.screen}>
      <main className={styles.content}>
        <section className={styles.profileCard}>
          <img
            className={styles.avatar}
            src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
            alt={user?.name ?? "Cliente não definido"}
          />

          <div className={styles.profileInfo}>
            <h1 style={{ fontSize: "25px", fontWeight: "900" }}>
              {user?.name ?? "Cliente não definido"}
            </h1>
            <span>
              <Star size={14} />
              Cliente desde {formatRegistrationDate(user?.dateRegistration)}
            </span>
          </div>
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
                className={`${styles.optionItem} ${
                  activeOption === item.title ? styles.optionItemActive : ""
                }`}
                type="button"
                onClick={() => handleOptionClick(item.title, item.onClick)}
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

      {showLogoutModal && (
        <div
          className={styles.modalOverlay}
          role="presentation"
          onClick={() => setShowLogoutModal(false)}
        >
          <section
            className={styles.logoutModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <span className={styles.modalIcon} aria-hidden="true">
              <LogOut size={26} />
            </span>
            <h2 id="logout-modal-title">Deseja sair?</h2>
            <p>Sua sessão será encerrada e você voltará para o login.</p>

            <div className={styles.modalActions}>
              <button
                className={styles.modalCancel}
                type="button"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancelar
              </button>
              <button
                className={styles.modalConfirm}
                type="button"
                onClick={confirmLogout}
              >
                Sair
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
