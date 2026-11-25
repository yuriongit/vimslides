import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const endpoint = process.env.S3_ENDPOINT

export const s3 = new S3Client({
  region: process.env.S3_REGION!,
  ...(endpoint ? { endpoint, forcePathStyle: true } : {}),
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function createAssetUploadUrl(params: {
  key: string
  contentType: string
}) {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: params.key,
    ContentType: params.contentType,
  })
  const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
  const publicUrl = `${process.env.S3_PUBLIC_URL}/${params.key}`
  return { uploadUrl, publicUrl, key: params.key }
}

export async function deleteAsset(key: string) {
  await s3.send(
    new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET!, Key: key }),
  )
}
