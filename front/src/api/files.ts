import { apiRequest } from "./api"
import { VIDEO_UPLOAD_ENDPOINT, VIDEO_BY_ID_ENDPOINT } from "../utils/apiPath"

export const uploadVideo = (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiRequest("post", VIDEO_UPLOAD_ENDPOINT, formData)
}

export const getVideoById = (videoId: string) => {
  return apiRequest("get", `${VIDEO_BY_ID_ENDPOINT}/${videoId}`)
}

