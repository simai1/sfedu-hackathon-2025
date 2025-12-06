import { apiRequest } from "./api"

const GROUPS_BASE = "/v1/groups"

export const apiListGroups = async () => {
  const response = await apiRequest("get", GROUPS_BASE)
  return response.data
}

export const apiCreateGroup = async (data: { name: string; description?: string | null }) => {
  const response = await apiRequest("post", GROUPS_BASE, data)
  return response.data
}

export const apiAddGroupMember = async (groupId: string, memberUserId: string) => {
  const response = await apiRequest("post", `${GROUPS_BASE}/${groupId}/members`, {
    member_user_id: memberUserId,
  })
  return response.data
}

export const apiAddGroupSession = async (groupId: string, file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  const response = await apiRequest("post", `${GROUPS_BASE}/${groupId}/sessions`, formData, {
    "Content-Type": "multipart/form-data",
  })
  return response.data
}

