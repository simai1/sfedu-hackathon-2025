import { apiRequest } from "./api"
import { VIDEO_UPLOAD_ENDPOINT, VIDEO_BY_ID_ENDPOINT, PHOTO_UPLOAD_ENDPOINT } from "../utils/apiPath"

export const uploadVideo = (file: File) => {
  const formData = new FormData()
  formData.append("file", file)
  return apiRequest("post", VIDEO_UPLOAD_ENDPOINT, formData)
}

export const getVideoById = (videoId: string) => {
  return apiRequest("get", `${VIDEO_BY_ID_ENDPOINT}/${videoId}`)
}

// Загрузка фото на сервер через /v1/photos
export const uploadPhoto = (imageDataUrl: string, filename: string = "screenshot.png") => {
  console.log("uploadPhoto вызвана:", {
    imageDataUrlLength: imageDataUrl.length,
    filename,
    endpoint: PHOTO_UPLOAD_ENDPOINT,
  });

  try {
    // Конвертируем data URL в Blob
    const base64Data = imageDataUrl.split(",")[1]
    if (!base64Data) {
      throw new Error("Неверный формат imageDataUrl")
    }
    
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    const blob = new Blob([byteArray], { type: "image/png" })
    const file = new File([blob], filename, { type: "image/png" })

    console.log("Файл создан:", {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    })

    const formData = new FormData()
    formData.append("file", file)
    
    console.log("Отправка POST запроса на:", PHOTO_UPLOAD_ENDPOINT)
    const response = apiRequest("post", PHOTO_UPLOAD_ENDPOINT, formData)
    
    console.log("Запрос отправлен, ожидаем ответ...")
    return response
  } catch (error) {
    console.error("Ошибка в uploadPhoto:", error)
    throw error
  }
}

// Загрузка скриншота (используем тот же endpoint что и для видео) - DEPRECATED, используйте uploadPhoto
export const uploadScreenshot = (imageDataUrl: string, filename: string = "screenshot.png") => {
  return uploadPhoto(imageDataUrl, filename)
}

