import {
  ArrowLeft,
  Bell,
  CalendarDays,
  ChevronRight,
  Check,
  CircleHelp,
  ClipboardList,
  CreditCard,
  Home,
  LogOut,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Settings,
  Star,
  Ticket,
  Trash2,
  User,
} from "lucide-react";
import styles from "./Profile.module.css";
import { useEffect, useRef, useState } from "react";
import ConfirmationModal from "../../components/ConfirmationModal/ConfirmationModal";
import { UserService } from "../../service/user.service";
import type { UserResponseDto } from "../../dtos/response/user-response.dto";
import { useAuth } from "../../contexts/AuthContext";
import { AddressService } from "../../service/address.service";
import type { AddressResponseDto } from "../../dtos/response/address-response.dto";
import { getRequestErrorMessage } from "../../utils/getRequestErrorMessage";
import { useLocation, useNavigate } from "react-router-dom";

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
    title: "Mensagens",
    subtitle: "Falar com a loja",
    icon: MessageCircle,
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

type AddressFormState = {
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  complement: string;
  reference: string;
  isDefault: boolean;
};

const emptyAddressForm: AddressFormState = {
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  zipCode: "",
  complement: "",
  reference: "",
  isDefault: false,
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function maskCep(input: string) {
  const digits = onlyDigits(input).slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function maskUf(input: string) {
  return input
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
}

function formatAddressLine(address: AddressResponseDto) {
  return `${address.street}, ${address.number}`;
}

function formatAddressDetails(address: AddressResponseDto) {
  return [
    address.neighborhood,
    `${address.city}/${address.state}`,
    `CEP ${address.zipCode}`,
  ]
    .filter(Boolean)
    .join(" - ");
}

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const locationState = (location.state || {}) as { openAddresses?: boolean };
  const [user, setUser] = useState<UserResponseDto>();
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [reloading, setReloading] = useState<boolean>(false);
  const [showAddressScreen, setShowAddressScreen] = useState(
    Boolean(locationState.openAddresses),
  );
  const [addresses, setAddresses] = useState<AddressResponseDto[]>([]);
  const [addressForm, setAddressForm] =
    useState<AddressFormState>(emptyAddressForm);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(
    null,
  );
  const [addressError, setAddressError] = useState("");
  const hasLoadedUser = useRef(false);
  const optionEffectTimeoutRef = useRef<number | null>(null);
  const optionActionTimeoutRef = useRef<number | null>(null);
  const { logout: contextLogout } = useAuth();

  function invert() {
    setReloading((a) => !a);
  }

  function updateAddressField<K extends keyof AddressFormState>(
    field: K,
    value: AddressFormState[K],
  ) {
    setAddressForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetAddressForm() {
    setAddressForm({
      ...emptyAddressForm,
      isDefault: addresses.length === 0,
    });
    setEditingAddressId(null);
  }

  function fillAddressForm(address: AddressResponseDto) {
    setAddressForm({
      street: address.street,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      complement: address.complement || "",
      reference: address.reference || "",
      isDefault: address.isDefault,
    });
    setEditingAddressId(address.id);
    setIsAddressFormOpen(true);
    setAddressError("");
  }

  function isAddressFormValid() {
    return (
      addressForm.street.trim().length > 0 &&
      addressForm.number.trim().length > 0 &&
      addressForm.neighborhood.trim().length > 0 &&
      addressForm.city.trim().length > 0 &&
      addressForm.state.trim().length === 2 &&
      onlyDigits(addressForm.zipCode).length === 8
    );
  }

  async function loadAddresses() {
    setLoadingAddresses(true);

    try {
      const data = await AddressService.findAll();
      const sorted = [...data].sort((a, b) => {
        if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      });

      setAddresses(sorted);
      setAddressError("");
    } catch (error) {
      setAddressError(
        getRequestErrorMessage(error, "Não foi possível carregar endereços."),
      );
    } finally {
      setLoadingAddresses(false);
    }
  }

  async function handleSaveAddress() {
    if (!isAddressFormValid()) {
      setAddressError("Preencha rua, número, bairro, cidade, UF e CEP.");
      return;
    }

    setSavingAddress(true);

    try {
      const payload = {
        street: addressForm.street.trim(),
        number: addressForm.number.trim(),
        neighborhood: addressForm.neighborhood.trim(),
        city: addressForm.city.trim(),
        state: addressForm.state.trim().toUpperCase(),
        zipCode: maskCep(addressForm.zipCode.trim()),
        complement: addressForm.complement.trim() || undefined,
        reference: addressForm.reference.trim() || undefined,
        isDefault: addresses.length === 0 ? true : addressForm.isDefault,
      };

      if (editingAddressId) {
        await AddressService.update(editingAddressId, payload);
      } else {
        await AddressService.create(payload);
      }

      resetAddressForm();
      setIsAddressFormOpen(false);
      await loadAddresses();
    } catch (error) {
      setAddressError(
        getRequestErrorMessage(error, "Não foi possível salvar o endereço."),
      );
    } finally {
      setSavingAddress(false);
    }
  }

  async function handleDeleteAddress(id: string) {
    const shouldDelete = window.confirm("Deseja excluir este endereço?");
    if (!shouldDelete) return;

    setDeletingAddressId(id);

    try {
      await AddressService.remove(id);
      setAddresses((current) => current.filter((address) => address.id !== id));
      if (editingAddressId === id) {
        setIsAddressFormOpen(false);
        resetAddressForm();
      }
      setAddressError("");
    } catch (error) {
      setAddressError(
        getRequestErrorMessage(error, "Não foi possível excluir o endereço."),
      );
    } finally {
      setDeletingAddressId(null);
    }
  }

  useEffect(() => {
    if (hasLoadedUser.current) {
      return;
    }

    hasLoadedUser.current = true;
    const storedUserId = localStorage.getItem("userId");

    if (!storedUserId) {
      invert();
      return;
    }

    const loadUser = async () => {
      try {
        const data = await UserService.findOne(storedUserId);
        setUser(data);
      } catch (error) {
        alert("Erro ao buscar usuário");
        console.error(error);
      }
    };
    loadUser();
  }, [reloading]);

  useEffect(() => {
    void loadAddresses();
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

        {showAddressScreen ? (
          <section className={styles.addressScreen}>
            <div className={styles.addressScreenHeader}>
              <button
                className={styles.addressBackButton}
                type="button"
                onClick={() => setShowAddressScreen(false)}
                aria-label="Voltar"
              >
                <ArrowLeft size={20} />
              </button>

              <div>
                <h2>Endereços</h2>
                <p>{addresses.length} cadastrados</p>
              </div>

              <button
                className={styles.addressNewButton}
                type="button"
                onClick={() => {
                  resetAddressForm();
                  setIsAddressFormOpen(true);
                  setAddressError("");
                }}
              >
                <Plus size={18} />
                Novo
              </button>
            </div>

            {addressError ? (
              <div className={styles.addressError}>{addressError}</div>
            ) : null}

            {isAddressFormOpen ? (
              <div className={styles.addressForm}>
                <div className={styles.addressFormTitle}>
                  {editingAddressId ? "Editar endereço" : "Novo endereço"}
                </div>
                <div className={styles.formGrid}>
                  <label className={styles.formField}>
                    <span>Rua</span>
                    <input
                      value={addressForm.street}
                      onChange={(event) =>
                        updateAddressField("street", event.target.value)
                      }
                      placeholder="Nome da rua"
                      autoComplete="address-line1"
                    />
                  </label>

                  <div className={styles.formRow}>
                    <label className={styles.formField}>
                      <span>Número</span>
                      <input
                        value={addressForm.number}
                        onChange={(event) =>
                          updateAddressField(
                            "number",
                            onlyDigits(event.target.value).slice(0, 6),
                          )
                        }
                        placeholder="123"
                        inputMode="numeric"
                        autoComplete="off"
                      />
                    </label>

                    <label className={styles.formField}>
                      <span>CEP</span>
                      <input
                        value={addressForm.zipCode}
                        onChange={(event) =>
                          updateAddressField(
                            "zipCode",
                            maskCep(event.target.value),
                          )
                        }
                        placeholder="00000-000"
                        inputMode="numeric"
                        autoComplete="postal-code"
                      />
                    </label>
                  </div>

                  <label className={styles.formField}>
                    <span>Bairro</span>
                    <input
                      value={addressForm.neighborhood}
                      onChange={(event) =>
                        updateAddressField("neighborhood", event.target.value)
                      }
                      placeholder="Seu bairro"
                      autoComplete="address-level3"
                    />
                  </label>

                  <div className={styles.formRow}>
                    <label className={styles.formField}>
                      <span>Cidade</span>
                      <input
                        value={addressForm.city}
                        onChange={(event) =>
                          updateAddressField("city", event.target.value)
                        }
                        placeholder="Sua cidade"
                        autoComplete="address-level2"
                      />
                    </label>

                    <label className={styles.formField}>
                      <span>UF</span>
                      <input
                        value={addressForm.state}
                        onChange={(event) =>
                          updateAddressField(
                            "state",
                            maskUf(event.target.value),
                          )
                        }
                        placeholder="GO"
                        autoComplete="address-level1"
                      />
                    </label>
                  </div>

                  <label className={styles.formField}>
                    <span>Complemento</span>
                    <input
                      value={addressForm.complement}
                      onChange={(event) =>
                        updateAddressField("complement", event.target.value)
                      }
                      placeholder="Apto, bloco, casa..."
                      autoComplete="address-line2"
                    />
                  </label>

                  <label className={styles.formField}>
                    <span>Referência</span>
                    <input
                      value={addressForm.reference}
                      onChange={(event) =>
                        updateAddressField("reference", event.target.value)
                      }
                      placeholder="Próximo a..."
                    />
                  </label>

                  <label className={styles.defaultCheck}>
                    <input
                      type="checkbox"
                      checked={addresses.length === 0 || addressForm.isDefault}
                      disabled={addresses.length === 0}
                      onChange={(event) =>
                        updateAddressField("isDefault", event.target.checked)
                      }
                    />
                    <span>Definir como endereço padrão</span>
                  </label>
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.formCancel}
                    type="button"
                    onClick={() => {
                      setIsAddressFormOpen(false);
                      resetAddressForm();
                      setAddressError("");
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className={styles.formSave}
                    type="button"
                    disabled={savingAddress}
                    onClick={handleSaveAddress}
                  >
                    <Save size={17} />
                    {savingAddress
                      ? "Salvando..."
                      : editingAddressId
                        ? "Atualizar"
                        : "Salvar"}
                  </button>
                </div>
              </div>
            ) : null}

            {loadingAddresses ? (
              <div className={styles.addressEmpty}>Carregando endereços...</div>
            ) : addresses.length === 0 ? (
              <div className={styles.addressEmpty}>
                <MapPin size={26} />
                <strong>Nenhum endereço cadastrado</strong>
                <span>
                  Cadastre um endereço para usar na finalização do pedido.
                </span>
              </div>
            ) : (
              <div className={styles.addressList}>
                {addresses.map((address) => (
                  <article key={address.id} className={styles.addressCard}>
                    <div className={styles.addressCardIcon}>
                      {address.isDefault ? (
                        <Check size={19} />
                      ) : (
                        <Home size={19} />
                      )}
                    </div>

                    <div className={styles.addressCardBody}>
                      <div className={styles.addressCardTitle}>
                        <strong>{formatAddressLine(address)}</strong>
                        {address.isDefault ? <span>Padrão</span> : null}
                      </div>
                      <p>{formatAddressDetails(address)}</p>
                      {address.complement ? (
                        <small>{address.complement}</small>
                      ) : null}
                      {address.reference ? (
                        <small>{address.reference}</small>
                      ) : null}
                    </div>

                    <div className={styles.addressCardActions}>
                      <button
                        className={styles.addressEditButton}
                        type="button"
                        onClick={() => fillAddressForm(address)}
                        aria-label="Editar endereço"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        className={styles.addressDeleteButton}
                        type="button"
                        disabled={deletingAddressId === address.id}
                        onClick={() => handleDeleteAddress(address.id)}
                        aria-label="Excluir endereço"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <>
            <section
              className={styles.quickGrid}
              aria-label="Atalhos do perfil"
            >
              {profileActions.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.title}
                    className={styles.quickCard}
                    type="button"
                    onClick={() => {
                      if (item.title === "Endereços") {
                        setShowAddressScreen(true);
                        return;
                      }

                      if (item.title === "Histórico") {
                        navigate("/pedidos");
                        return;
                      }

                      if (item.title === "Mensagens") {
                        navigate("/mensagens", { state: { returnTo: "/perfil" } });
                      }
                    }}
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

            <section
              className={styles.optionsList}
              aria-label="Opções da conta"
            >
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
          </>
        )}
      </main>

      {showLogoutModal && (
        <ConfirmationModal
          icon={<LogOut size={26} />}
          title="Deseja sair?"
          description="Sua sessão será encerrada e você voltará para o login."
          confirmLabel="Sair"
          onCancel={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />
      )}
    </div>
  );
}
