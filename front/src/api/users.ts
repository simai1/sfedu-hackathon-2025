import { apiRequest } from "./api";

//! получение данных пользователя
export const apiUsersSelf = async () => {
  const response: any = await apiRequest("get", "/users/self");
  return response;
};

//! обновление данных пользователя
export const apiUpdateUser = async (
  data: any,
  headers: any = {},
  query?: string
) => {
  const response: any = await apiRequest(
    "put",
    `/users${query ? query : ""}`,
    data,
    headers
  );
  return response;
};

//! получение аксес через refresh token
export const apiRefresh = async () => {
  const response: any = await apiRequest("post", "/auth/refresh");
  return response;
};
