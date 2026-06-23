import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import styles from "./Checkout.module.css";
import Colors from "../../themes/Colors";
import {
  ArrowLeft,
  ShoppingCart,
  MapPin,
  User,
  Wallet,
  Check,
  Send,
  Home,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { OrderController } from "../../controllers/order.controller";
import { PaymentMethod } from "../../dtos/enums/payment-method.enum";
import type { PaymentMethodEnum } from "../../dtos/enums/payment-method.enum";
import type { OrderRequestDto } from "../../dtos/request/order-request.dto";
import { useStoreStatus } from "../../hooks/useStoreStatus";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  subtitle?: string;
  image: string;
};

type CheckoutNavState = {
  items: CartItem[];
  orderObs?: string;
  deliveryFee: number;
  subtotal: number;
  total: number;
};

type PaymentType = PaymentMethodEnum;

type SavedAddress = {
  id: string;
  fullName: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  complement?: string;
  createdAt: number;
};

type CheckoutCssVars = CSSProperties & {
  "--bgPrimary": string;
  "--bgSecondary": string;
  "--highlight": string;
  "--textPrimary": string;
  "--textSecondary": string;
};

const LS_KEY = "mb_checkout_addresses_v1";
const LS_SELECTED_KEY = "mb_checkout_selected_address_v1";

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function onlyDigits(v: string) {
  return (v || "").replace(/\D/g, "");
}

function maskPhoneBR(input: string) {
  const d = onlyDigits(input).slice(0, 11);
  if (d.length === 0) return "";
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(input: string) {
  const d = onlyDigits(input).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function maskUf(input: string) {
  return input
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 2);
}

function maskMoneyBR(input: string) {
  const cleaned = input.replace(/[^\d,.]/g, "").replace(/\./g, ",");
  const parts = cleaned.split(",");
  const i = parts[0].replace(/\D/g, "").slice(0, 6);
  const f = (parts[1] || "").replace(/\D/g, "").slice(0, 2);
  if (!i && !f) return "";
  return f.length ? `${i || "0"},${f}` : `${i}`;
}

function parseLSAddresses(): SavedAddress[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.filter(Boolean);
  } catch {
    return [];
  }
}

function saveLSAddresses(list: SavedAddress[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(list));
}

export default function Checkout() {
  const nav = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as Partial<CheckoutNavState>;
  const items = state.items || [];
  const deliveryFee =
    typeof state.deliveryFee === "number" ? state.deliveryFee : 0;
  const subtotal = typeof state.subtotal === "number" ? state.subtotal : 0;
  const total =
    typeof state.total === "number"
      ? state.total
      : subtotal + (items.length ? deliveryFee : 0);
  const orderObs = state.orderObs || "";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [complement, setComplement] = useState("");
  const [payment, setPayment] = useState<PaymentType>(PaymentMethod.PIX);
  const [cashChange, setCashChange] = useState("");
  const [needChange, setNeedChange] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const storeStatus = useStoreStatus();

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [useNewAddress, setUseNewAddress] = useState(false);

  const brl = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  useEffect(() => {
    const list = parseLSAddresses().sort((a, b) => b.createdAt - a.createdAt);
    setSavedAddresses(list);
    try {
      const sel = localStorage.getItem(LS_SELECTED_KEY);
      if (sel) setSelectedAddressId(sel);
    } catch {
      // Ignore storage access errors.
    }
  }, []);

  useEffect(() => {
    if (payment !== PaymentMethod.CASH) {
      setNeedChange(null);
      setCashChange("");
    }
  }, [payment]);

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null;
    return savedAddresses.find((a) => a.id === selectedAddressId) || null;
  }, [savedAddresses, selectedAddressId]);
  const usingSavedAddress = !useNewAddress && !!selectedAddress;
  const fullNameValue = usingSavedAddress
    ? selectedAddress?.fullName || ""
    : fullName;
  const phoneValue = usingSavedAddress ? selectedAddress?.phone || "" : phone;
  const cepValue = usingSavedAddress ? selectedAddress?.cep || "" : cep;
  const streetValue = usingSavedAddress
    ? selectedAddress?.street || ""
    : street;
  const numberValue = usingSavedAddress
    ? selectedAddress?.number || ""
    : number;
  const districtValue = usingSavedAddress
    ? selectedAddress?.district || ""
    : district;
  const cityValue = usingSavedAddress ? selectedAddress?.city || "" : city;
  const ufValue = usingSavedAddress ? selectedAddress?.state || "" : uf;
  const complementValue = usingSavedAddress
    ? selectedAddress?.complement || ""
    : complement;

  const step1Done =
    fullNameValue.trim().length > 0 && onlyDigits(phoneValue).length >= 10;

  const step2Done =
    onlyDigits(cepValue).length === 8 &&
    streetValue.trim().length > 0 &&
    numberValue.trim().length > 0 &&
    districtValue.trim().length > 0 &&
    cityValue.trim().length > 0 &&
    ufValue.trim().length === 2;

  const step3Done =
    payment !== PaymentMethod.CASH ||
    needChange === false ||
    (needChange === true && cashChange.trim().length > 0);

  const canSend =
    items.length > 0 && step1Done && step2Done && step3Done && !isSubmitting;

  const openNow = storeStatus.openNow;

  function persistAddressAfterSend() {
    const base = {
      fullName: fullNameValue.trim(),
      phone: phoneValue.trim(),
      cep: cepValue.trim(),
      street: streetValue.trim(),
      number: numberValue.trim(),
      district: districtValue.trim(),
      city: cityValue.trim(),
      state: ufValue.trim(),
      complement: String(complementValue || "").trim(),
    };

    const newAddr: SavedAddress = {
      id: uid(),
      ...base,
      createdAt: Date.now(),
    };

    const same = (a: SavedAddress) =>
      onlyDigits(a.cep) === onlyDigits(newAddr.cep) &&
      a.street.trim().toLowerCase() === newAddr.street.trim().toLowerCase() &&
      a.number.trim().toLowerCase() === newAddr.number.trim().toLowerCase() &&
      a.district.trim().toLowerCase() ===
        newAddr.district.trim().toLowerCase() &&
      (a.complement || "").trim().toLowerCase() ===
        (newAddr.complement || "").trim().toLowerCase();

    const existing = savedAddresses.find(same);
    const next = existing
      ? savedAddresses.map((a) =>
          a.id === existing.id
            ? { ...a, ...newAddr, id: existing.id, createdAt: Date.now() }
            : a,
        )
      : [newAddr, ...savedAddresses];

    saveLSAddresses(next);
    setSavedAddresses(next);

    const chosenId = existing ? existing.id : newAddr.id;
    setSelectedAddressId(chosenId);
    localStorage.setItem(LS_SELECTED_KEY, chosenId);
    setUseNewAddress(false);
  }

  function handleSelectAddress(id: string) {
    const addr = savedAddresses.find((a) => a.id === id);
    setSelectedAddressId(id);
    localStorage.setItem(LS_SELECTED_KEY, id);
    setUseNewAddress(false);

    if (addr) {
      setFullName(addr.fullName || "");
      setPhone(addr.phone || "");
      setCep(addr.cep || "");
      setStreet(addr.street || "");
      setNumber(addr.number || "");
      setDistrict(addr.district || "");
      setCity(addr.city || "");
      setUf(addr.state || "");
      setComplement(addr.complement || "");
    }
  }

  function handleUseNewAddress() {
    setUseNewAddress(true);
    setSelectedAddressId(null);
    localStorage.removeItem(LS_SELECTED_KEY);
    setFullName("");
    setPhone("");
    setCep("");
    setStreet("");
    setNumber("");
    setDistrict("");
    setCity("");
    setUf("");
    setComplement("");
  }

  function handleDeleteAddress(id: string) {
    const next = savedAddresses.filter((a) => a.id !== id);
    saveLSAddresses(next);
    setSavedAddresses(next);
    if (selectedAddressId === id) {
      setSelectedAddressId(null);
      localStorage.removeItem(LS_SELECTED_KEY);
    }
  }

  function buildOrderPayload(): OrderRequestDto {
    const extraInfo = [
      String(complementValue || "").trim(),
      orderObs.trim() ? `Obs pedido: ${orderObs.trim()}` : "",
      payment === PaymentMethod.CASH && needChange === true
        ? `Troco para: R$ ${cashChange.trim()}`
        : "",
    ].filter(Boolean);

    return {
      paymentMethod: payment,
      customerName: fullNameValue.trim(),
      customerPhone: onlyDigits(phoneValue),
      addressStreet: `${streetValue.trim()}, Nº ${numberValue.trim()}`,
      addressCityState: `${cityValue.trim()}/${ufValue
        .trim()
        .toUpperCase()} - ${districtValue.trim()} - CEP ${cepValue.trim()}`,
      addressComplement: extraInfo.length ? extraInfo.join(" | ") : undefined,
      subtotal,
      deliveryFee: items.length ? deliveryFee : 0,
      discount: 0,
      total,
      items: items.map((item) => ({
        id: String(item.id),
        productId: String(item.id),
        name: item.name,
        description: item.subtitle,
        imageUrl: item.image,
        quantity: item.qty,
        unitPrice: item.price,
        totalPrice: item.price * item.qty,
        observations: item.note,
      })),
    };
  }

  async function handleCreateOrder() {
    if (!canSend) {
      alert("Preencha os dados obrigatórios do pedido");
      return;
    }

    if (storeStatus.loading) {
      toast.info("Verificando horário de funcionamento...", {
        autoClose: 1800,
      });
      return;
    }

    if (!openNow) {
      const left = storeStatus.hoursToOpen;
      toast.error(
        `Fechado, abrimos em ${left} ${left === 1 ? "hora" : "horas"}`,
        { autoClose: 2500 },
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const createdOrder = await OrderController.create(buildOrderPayload());

      persistAddressAfterSend();
      localStorage.removeItem("food");
      nav("/order-inform", {
        state: {
          orderId: createdOrder.id,
        },
      });
      localStorage.removeItem("food");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao criar pedido";
      toast.error(message, { autoClose: 3000 });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={styles.screen}
      style={
          {
          "--bgPrimary": Colors.Background.primary,
          "--bgSecondary": Colors.Background.secondary,
          "--highlight": Colors.Highlight.primary,
          "--textPrimary": Colors.Texts.primary,
          "--textSecondary": Colors.Texts.secondary,
        } as CheckoutCssVars
      }
    >
      <ToastContainer position="top-center" />
      <div className={styles.content}>
        <header className={styles.header}>
          <button
            className={styles.iconBtn}
            aria-label="Voltar"
            onClick={() => nav(-1)}
          >
            <ArrowLeft size={20} />
          </button>

          <div className={styles.headerTitle}>
            <div className={styles.headerTop}>Finalizar Pedido</div>
          </div>

          <button
            className={styles.headerCart}
            type="button"
            onClick={() => nav("/cart")}
          >
            <ShoppingCart size={18} />
          </button>
        </header>

        <div className={styles.stepBarContainer}>
          <div className={styles.stepBar}>
            <div
              className={`${styles.stepSeg} ${
                step3Done ? styles.stepSegOn : ""
              }`}
            />
            <div
              className={`${styles.stepSeg} ${
                step2Done ? styles.stepSegOn : ""
              }`}
            />
            <div
              className={`${styles.stepSeg} ${
                step1Done ? styles.stepSegOn : ""
              }`}
            />
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <div className={styles.sectionTitle}>
              <ShoppingCart size={16} />
              <span>Resumo</span>
            </div>

            <button
              type="button"
              className={styles.editOrderBtn}
              onClick={() => nav("/cart")}
            >
              Editar pedido
            </button>
          </div>

          <div className={styles.summaryList}>
            {items.map((it) => (
              <div key={it.id} className={styles.summaryItem}>
                <div className={styles.summaryThumbWrap}>
                  <img
                    className={styles.summaryThumb}
                    src={it.image}
                    alt={it.name}
                  />
                </div>

                <div className={styles.summaryInfo}>
                  <div className={styles.summaryName}>{it.name}</div>
                  <div className={styles.summaryMeta}>
                    {it.subtitle ? <span>{it.subtitle}</span> : <span />}
                    <span className={styles.summaryQty}>x{it.qty}</span>
                  </div>
                  <div className={styles.summaryPrice}>{brl(it.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <Home size={16} />
            <span>Endereços salvos</span>
          </div>

          {savedAddresses.length === 0 ? (
            <div className={styles.emptyAddressCard}>
              <div className={styles.emptyAddressTitle}>
                Nenhum endereço salvo ainda
              </div>
              <div className={styles.emptyAddressDesc}>
                Finalize um pedido para salvar seu endereço aqui.
              </div>
              <button
                type="button"
                className={styles.useNewBtn}
                onClick={handleUseNewAddress}
              >
                Adicionar endereço
              </button>
            </div>
          ) : (
            <div className={styles.addressList}>
              {savedAddresses.map((a) => {
                const active = a.id === selectedAddressId && !useNewAddress;
                return (
                  <button
                    key={a.id}
                    type="button"
                    className={`${styles.addressCard} ${
                      active ? styles.addressCardActive : ""
                    }`}
                    onClick={() => handleSelectAddress(a.id)}
                  >
                    <div className={styles.addressTopRow}>
                      <div className={styles.addressTitle}>
                        {a.street}, {a.number}
                      </div>
                      <button
                        type="button"
                        className={styles.addressTrash}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAddress(a.id);
                        }}
                        aria-label="Excluir endereço"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className={styles.addressMeta}>
                      <span>
                        {[a.district, a.city, a.state]
                          .filter(Boolean)
                          .join(" - ")}
                      </span>
                      <span className={styles.addressCep}>{a.cep}</span>
                    </div>
                    {a.complement ? (
                      <div className={styles.addressComp}>{a.complement}</div>
                    ) : null}
                  </button>
                );
              })}

              <button
                type="button"
                className={styles.useNewBtn}
                onClick={handleUseNewAddress}
              >
                Usar novo endereço
              </button>
            </div>
          )}
        </section>

        {useNewAddress ? (
          <>
            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                <User size={16} />
                <span>Seus Dados</span>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>Nome Completo</span>
                  <input
                    className={styles.input}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Como devemos te chamar?"
                    autoComplete="name"
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>Telefone / WhatsApp</span>
                  <input
                    className={styles.input}
                    value={phone}
                    onChange={(e) => setPhone(maskPhoneBR(e.target.value))}
                    placeholder="(00) 00000-0000"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </label>
              </div>
            </section>

            <section className={styles.section}>
              <div className={styles.sectionTitle}>
                <MapPin size={16} />
                <span>Entrega</span>
              </div>

              <div className={styles.formGrid}>
                <label className={styles.field}>
                  <span className={styles.label}>CEP</span>
                  <input
                    className={styles.input}
                    value={cep}
                    onChange={(e) => setCep(maskCep(e.target.value))}
                    placeholder="00000-000"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </label>

                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Rua</span>
                    <input
                      className={styles.input}
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      placeholder="Nome da rua"
                      autoComplete="address-line1"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>Número</span>
                    <input
                      className={styles.input}
                      value={number}
                      onChange={(e) =>
                        setNumber(onlyDigits(e.target.value).slice(0, 6))
                      }
                      placeholder="123"
                      inputMode="numeric"
                      autoComplete="off"
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.label}>Bairro</span>
                  <input
                    className={styles.input}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Seu bairro"
                    autoComplete="address-level3"
                  />
                </label>

                <div className={styles.row2}>
                  <label className={styles.field}>
                    <span className={styles.label}>Cidade</span>
                    <input
                      className={styles.input}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Sua cidade"
                      autoComplete="address-level2"
                    />
                  </label>

                  <label className={styles.field}>
                    <span className={styles.label}>UF</span>
                    <input
                      className={styles.input}
                      value={uf}
                      onChange={(e) => setUf(maskUf(e.target.value))}
                      placeholder="GO"
                      autoComplete="address-level1"
                    />
                  </label>
                </div>

                <label className={styles.field}>
                  <span className={styles.label}>Complemento (Opcional)</span>
                  <input
                    className={styles.input}
                    value={complement}
                    onChange={(e) => setComplement(e.target.value)}
                    placeholder="Apto, Bloco, Ponto de referência..."
                    autoComplete="address-line2"
                  />
                </label>
              </div>
            </section>
          </>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <Wallet size={16} />
            <span>Pagamento</span>
          </div>

          <div className={styles.payList}>
            <button
              type="button"
              className={`${styles.payItem} ${
                payment === PaymentMethod.PIX ? styles.payItemActive : ""
              }`}
              onClick={() => setPayment(PaymentMethod.PIX)}
            >
              <div className={styles.payLeft}>
                <div className={styles.payIcon}>
                  <Check size={16} />
                </div>
                <div className={styles.payTexts}>
                  <div className={styles.payName}>Pix</div>
                  <div className={styles.payDesc}>Pagamento instantâneo</div>
                </div>
              </div>
              <div
                className={`${styles.radio} ${
                  payment === PaymentMethod.PIX ? styles.radioOn : ""
                }`}
              />
            </button>

            <button
              type="button"
              className={`${styles.payItem} ${
                payment === PaymentMethod.CREDIT_CARD
                  ? styles.payItemActive
                  : ""
              }`}
              onClick={() => setPayment(PaymentMethod.CREDIT_CARD)}
            >
              <div className={styles.payLeft}>
                <div className={styles.payIcon}>
                  <Check size={16} />
                </div>
                <div className={styles.payTexts}>
                  <div className={styles.payName}>Cartão de crédito</div>
                  <div className={styles.payDesc}>Pagamento na entrega</div>
                </div>
              </div>
              <div
                className={`${styles.radio} ${
                  payment === PaymentMethod.CREDIT_CARD ? styles.radioOn : ""
                }`}
              />
            </button>

            <button
              type="button"
              className={`${styles.payItem} ${
                payment === PaymentMethod.DEBIT_CARD ? styles.payItemActive : ""
              }`}
              onClick={() => setPayment(PaymentMethod.DEBIT_CARD)}
            >
              <div className={styles.payLeft}>
                <div className={styles.payIcon}>
                  <Check size={16} />
                </div>
                <div className={styles.payTexts}>
                  <div className={styles.payName}>Cartão de débito</div>
                  <div className={styles.payDesc}>Pagamento na entrega</div>
                </div>
              </div>
              <div
                className={`${styles.radio} ${
                  payment === PaymentMethod.DEBIT_CARD ? styles.radioOn : ""
                }`}
              />
            </button>

            <button
              type="button"
              className={`${styles.payItem} ${
                payment === PaymentMethod.CASH ? styles.payItemActive : ""
              }`}
              onClick={() => setPayment(PaymentMethod.CASH)}
            >
              <div className={styles.payLeft}>
                <div className={styles.payIcon}>
                  <Check size={16} />
                </div>
                <div className={styles.payTexts}>
                  <div className={styles.payName}>Dinheiro</div>
                  <div className={styles.payDesc}>Precisa de troco?</div>
                </div>
              </div>
              <div
                className={`${styles.radio} ${
                  payment === PaymentMethod.CASH ? styles.radioOn : ""
                }`}
              />
            </button>

            {payment === PaymentMethod.CASH ? (
              <div className={styles.cashBox}>
                <div className={styles.payList}>
                  <button
                    type="button"
                    className={`${styles.payItem} ${
                      needChange === true ? styles.payItemActive : ""
                    }`}
                    onClick={() => setNeedChange(true)}
                  >
                    <div className={styles.payLeft}>
                      <div className={styles.payIcon}>
                        <Check size={16} />
                      </div>
                      <div className={styles.payTexts}>
                        <div className={styles.payName}>Sim</div>
                        <div className={styles.payDesc}>
                          Vou precisar de troco
                        </div>
                      </div>
                    </div>
                    <div
                      className={`${styles.radio} ${
                        needChange === true ? styles.radioOn : ""
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    className={`${styles.payItem} ${
                      needChange === false ? styles.payItemActive : ""
                    }`}
                    onClick={() => {
                      setNeedChange(false);
                      setCashChange("");
                    }}
                  >
                    <div className={styles.payLeft}>
                      <div className={styles.payIcon}>
                        <Check size={16} />
                      </div>
                      <div className={styles.payTexts}>
                        <div className={styles.payName}>Não</div>
                        <div className={styles.payDesc}>Sem troco</div>
                      </div>
                    </div>
                    <div
                      className={`${styles.radio} ${
                        needChange === false ? styles.radioOn : ""
                      }`}
                    />
                  </button>
                </div>

                {needChange === true ? (
                  <label className={styles.field} style={{ marginTop: 10 }}>
                    <span className={styles.label}>Troco para</span>
                    <input
                      className={styles.input}
                      value={cashChange}
                      onChange={(e) =>
                        setCashChange(maskMoneyBR(e.target.value))
                      }
                      placeholder="Ex: 50,00"
                      inputMode="decimal"
                      autoComplete="off"
                    />
                  </label>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className={styles.bottomSpacer} />
      </div>

      <div className={styles.bottomBar}>
        <div className={styles.totalRow}>
          <span className={styles.totalLabel}>Total do pedido</span>
          <span className={styles.totalValue}>{brl(total)}</span>
        </div>

        <button
          className={styles.sendBtn}
          type="button"
          disabled={!canSend}
          onClick={handleCreateOrder}
        >
          <span className={styles.sendLeft}>
            <Send size={18} />
            <span>{isSubmitting ? "Enviando..." : "Enviar pedido"}</span>
          </span>
        </button>
      </div>
    </div>
  );
}
