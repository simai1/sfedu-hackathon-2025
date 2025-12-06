import { apiRequest } from "./api"
import { VIDEO_UPLOAD_ENDPOINT, VIDEO_BY_ID_ENDPOINT } from "../utils/apiPath"

export const uploadVideo = async (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  // axios сам проставит multipart/form-data для FormData
  return apiRequest("post", VIDEO_UPLOAD_ENDPOINT, formData)
}

export const getVideoById = async (videoId: string) => {
  return apiRequest("get", `${VIDEO_BY_ID_ENDPOINT}/${videoId}`)
}

