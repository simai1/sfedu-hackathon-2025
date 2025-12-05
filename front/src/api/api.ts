import api, { server } from "./axios"

//! Универсальная функция для выполнения запросов
export const apiRequest = async (
  method: "get" | "post" | "put" | "delete" | "patch",
  endpoint: string,
  data: any = null,
  headers: Record<string, string> = {},
  serv = server,
  params: Record<string, any> = {}
) => {
  try {
    const config = {
      method,
      url: `${serv}${endpoint}`,
      headers,
      data,
      params,
    }

    const response = await api(config)
    return response
  } catch (error) {
    console.error("Ошибка при выполнении запроса:", error)

    // return error; // Пробрасываем ошибку дальше для обработки
    throw error
  }
}

//! Универсальная функция для установки куки
export const setCookie = (name: string, value: string, days: number) => {
  const date = new Date()
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
  const expires = `expires=${date.toUTCString()}`
  document.cookie = `${name}=${value};${expires};path=/`
}

export function getCookie(name: string): string | null {
  return (
    document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="))
      ?.split("=")[1] || null
  )
}
