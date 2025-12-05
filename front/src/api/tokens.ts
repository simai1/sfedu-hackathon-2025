import { PAIR_TOKEN_ENDPOINT } from "../utils/apiPath"
import { apiRequest } from "./api"

export const generatePairTokenEndpoint = async () => {
  const response = await apiRequest("post", PAIR_TOKEN_ENDPOINT)
  return response.data
}