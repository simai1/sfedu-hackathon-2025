import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { generatePairTokenEndpoint } from "../api/tokens"

// Query key для токена
export const pairTokenKeys = {
  all: ["pairToken"] as const,
  current: () => [...pairTokenKeys.all, "current"] as const,
}

// Хук для получения токена
export const usePairToken = () => {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: pairTokenKeys.current(),
    queryFn: async () => {
      // Проверяем, есть ли токен в кеше
      const cachedToken = queryClient.getQueryData<string>(
        pairTokenKeys.current()
      )

      // Если токен есть в кеше, возвращаем его
      if (cachedToken && cachedToken.trim() !== "") {
        return cachedToken
      }

      // Если токена нет в кеше, генерируем новый
      const newToken = await generatePairTokenEndpoint()
      return newToken as string
    },
    staleTime: Infinity, // Токен не устаревает автоматически
    gcTime: Infinity, // Храним в кеше бесконечно (до перезагрузки страницы)
    retry: 1,
  })
}

// Хук для генерации нового токена
export const useGeneratePairToken = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const token = await generatePairTokenEndpoint()
      return token as string
    },
    onSuccess: (newToken) => {
      // Обновляем кеш с новым токеном
      queryClient.setQueryData(pairTokenKeys.current(), newToken)
      // Инвалидируем запрос, чтобы все компоненты обновились
      queryClient.invalidateQueries({ queryKey: pairTokenKeys.all })
    },
  })
}
