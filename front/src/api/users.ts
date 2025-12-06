import { apiRequest } from "./api"

const USERS_SELF_ENDPOINT = "/v1/users/self"

//! получение данных пользователя
export const apiUsersSelf = async () => {
  const response = await apiRequest("get", USERS_SELF_ENDPOINT)
  return response.data
}

//! обновление данных пользователя
export const apiUpdateUser = async (data: any, headers: any = {}) => {
  const response = await apiRequest("put", USERS_SELF_ENDPOINT, data, headers)
  return response.data
}

//! получение аксес через refresh token
export const apiRefresh = async () => {
  const response = await apiRequest("post", "/auth/refresh")
  return response
}
