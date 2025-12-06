import axios from "./axios"
import {
  ORG_CREATE_ENDPOINT,
  ORG_JOIN_ENDPOINT,
  ORG_MEMBERS_ENDPOINT,
} from "../utils/apiPath"

export const createOrganization = async (name: string, code?: string) => {
  const response = await axios.post(ORG_CREATE_ENDPOINT, { name, code })
  return response.data
}

export const joinOrganization = async (code: string) => {
  const response = await axios.post(ORG_JOIN_ENDPOINT, { code })
  return response.data
}

export const getOrganizationMembers = async () => {
  const response = await axios.get(ORG_MEMBERS_ENDPOINT)
  return response.data
}

