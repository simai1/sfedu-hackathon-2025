import { LOGIN_ENDPOINT, REGISTER_ENDPOINT } from "../utils/apiPath"
import { apiRequest } from "./api"

//! получение аксес через refresh token
export const loginEndpoint = async (data: any) => {
  try {
    const response = await apiRequest("post", LOGIN_ENDPOINT, data)
    return response.data
  } catch (error) {
    console.error("Login error:", error)
    throw error
  }
}

export const registerEndpoint = async (data: any) => {
  try {
    const response = await apiRequest("post", REGISTER_ENDPOINT, data)
    return response.data
  } catch (error) {
    console.error("Registration error:", error)
    throw error
  }
}
