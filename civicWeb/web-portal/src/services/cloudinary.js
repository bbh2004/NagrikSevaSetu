// Cloudinary upload service using the same config as the mobile app
// cloudName: dqpgshpir, upload preset: civic_complaints

export async function uploadImageToCloudinary(file) {
  if (!file) throw new Error('No file provided')
  const cloudName = 'dqpgshpir'
  const uploadPreset = 'civic_complaints'
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(url, { method: 'POST', body: formData })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Cloudinary upload failed: ${res.status} ${text}`)
  }
  const data = await res.json()
  return data.secure_url
}


