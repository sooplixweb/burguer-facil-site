import { useState, type CSSProperties } from "react";
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import Colors from "../../themes/Colors";
import styles from "./login.module.css";
import { UserService } from "../../service/user.service";
import type { LoginRequestDto } from "../../dtos/request/login-request.dto";
import { getRequestErrorMessage } from "../../utils/getRequestErrorMessage";

type LoginCssVars = CSSProperties & {
  "--bg-primary": string;
  "--bg-secondary": string;
  "--text-primary": string;
  "--text-secondary": string;
  "--highlight": string;
};

type LoginErrors = Partial<Record<"email" | "password", string>>;

export default function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const navigate = useNavigate();

  function validateFields(): boolean {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) nextErrors.email = "E-mail precisa ser preenchido.";
    if (!password.trim()) nextErrors.password = "Senha precisa ser preenchida.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function login(): Promise<void> {
    if (!validateFields()) return;

    const payload: LoginRequestDto = {
      email: email.trim(),
      password,
    };

    try {
      const response = await UserService.login(payload);
      localStorage.setItem("token", response.token);
      navigate("/main");
    } catch (error) {
      console.error(error);
      toast.error(
        <div className={styles.toastContent}>
          <strong className={styles.toastTitle}>Não foi possível entrar</strong>
          <span className={styles.toastMessage}>
            {getRequestErrorMessage(
              error,
              "Confira seus dados e tente novamente.",
            )}
          </span>
        </div>,
        {
          autoClose: 3600,
          position: "top-center",
          theme: "dark",
        },
      );
    }
  }

  return (
    <main
      className={styles.screen}
      style={
        {
          "--bg-primary": Colors.Background.primary,
          "--bg-secondary": Colors.Background.secondary,
          "--text-primary": Colors.Texts.primary,
          "--text-secondary": Colors.Texts.secondary,
          "--highlight": Colors.Highlight.primary,
        } as LoginCssVars
      }
    >
      <section className={styles.card} aria-label="Login">
        <div className={styles.hero} aria-hidden="true" />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1>Bem-vindo de volta</h1>
            <p>Acesse sua conta para continuar</p>
          </header>

          <form
            className={styles.form}
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              login();
            }}
          >
            <label className={styles.fieldGroup}>
              <span className={styles.label}>E-mail</span>
              <span
                className={`${styles.inputShell} ${
                  errors.email ? styles.inputError : ""
                }`}
              >
                <Mail size={20} aria-hidden="true" />
                <input
                  type="email"
                  placeholder="nome@exemplo.com"
                  autoComplete="email"
                  value={email}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                />
              </span>
              {errors.email && (
                <span className={styles.errorText} id="email-error">
                  {errors.email}
                </span>
              )}
            </label>

            <label className={styles.fieldGroup}>
              <span className={styles.label}>Senha</span>
              <span
                className={`${styles.inputShell} ${
                  errors.password ? styles.inputError : ""
                }`}
              >
                <LockKeyhole size={20} aria-hidden="true" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="........"
                  autoComplete="current-password"
                  value={password}
                  aria-invalid={!!errors.password}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((current) => ({
                      ...current,
                      password: undefined,
                    }));
                  }}
                />
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </span>
              {errors.password && (
                <span className={styles.errorText} id="password-error">
                  {errors.password}
                </span>
              )}
            </label>

            <Link className={styles.forgotLink} to="/login">
              Esqueceu a senha?
            </Link>

            <button className={styles.submitButton} type="submit">
              <span>Entrar</span>
              <ArrowRight size={22} aria-hidden="true" />
            </button>
          </form>

          <p className={styles.signupText}>
            Novo no Mais Burguer? <Link to="/register">Criar conta</Link>
          </p>
        </div>
      </section>
      <ToastContainer position="top-center" />
    </main>
  );
}
