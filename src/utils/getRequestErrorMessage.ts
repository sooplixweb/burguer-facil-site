import axios from "axios";

type ApiErrorData = {
  message?: string | string[];
  error?: string;
};

function normalizeMessage(message?: string | string[]): string {
  if (Array.isArray(message)) {
    return message.join("\n");
  }

  return message || "";
}

export function isEmailAlreadyRegisteredError(error: unknown): boolean {
  if (!axios.isAxiosError<ApiErrorData>(error) || !error.response) {
    return false;
  }

  const responseMessage = normalizeMessage(error.response.data?.message);
  const responseError = error.response.data?.error || "";
  const fullMessage = `${responseMessage} ${responseError}`.toLowerCase();

  return (
    error.response.status === 409 ||
    (fullMessage.includes("email") &&
      (fullMessage.includes("cadastrado") || fullMessage.includes("existe")))
  );
}

export function getRequestErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (!axios.isAxiosError<ApiErrorData>(error)) {
    return fallbackMessage;
  }

  if (!error.response) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }

  if (error.response.status === 401) {
    return "E-mail ou senha inválidos.";
  }

  if (isEmailAlreadyRegisteredError(error)) {
    return "Esse e-mail já está cadastrado. Entre na sua conta ou use outro e-mail.";
  }

  const responseMessage = error.response.data?.message;

  if (Array.isArray(responseMessage)) {
    return responseMessage.join("\n");
  }

  if (typeof responseMessage === "string" && responseMessage.trim()) {
    return responseMessage;
  }

  if (
    typeof error.response.data?.error === "string" &&
    error.response.data.error.trim()
  ) {
    return error.response.data.error;
  }

  return fallbackMessage;
}
