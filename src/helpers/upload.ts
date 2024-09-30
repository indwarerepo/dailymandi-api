import config from 'config';
import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  BlockBlobClient,
} from '@azure/storage-blob';

/**
 * Azure storage account setup
 * for blob file upload
 */
export const azureBlobUpload = async (fileName: string, filePath: any, container: string) => {
  const account = config.get('azure_storage_access_key') as string;
  const accountKey = config.get('azure_storage_secret_access_key') as string;
  const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential,
  );
  const containerName = container;
  const containerClient = blobServiceClient.getContainerClient(containerName);
  // const createContainerResponse = await containerClient.create();
  const blockBlobClient = containerClient.getBlockBlobClient(fileName);
  const uploadBlobResponse = await blockBlobClient.uploadData(filePath);
  // console.log(`Upload block blob ${fileName} successfully`, uploadBlobResponse);
  // console.log("Blob URL: ", blockBlobClient.url);
  return blockBlobClient.url;
};

/**
 * Azure storage account setup
 * for file upload
 */
export const azureUploadFile = (file: any, actualName: string, container: string) => {
  return new Promise(async (resolve, reject) => {
    let fileName = actualName;
    const account = config.get('azure_storage_access_key') as string;
    const accountKey = config.get('azure_storage_secret_access_key') as string;
    const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
    const blobServiceClient = new BlobServiceClient(
      `https://${account}.blob.core.windows.net`,
      sharedKeyCredential,
    );
    const containerName = container;
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);
    const uploadBlobResponse = await blockBlobClient.uploadFile(file.path);
    resolve(blockBlobClient.url);
  });
};

/**
 * Convert Base64 image to file buffer
 */
export const convertBase64ToBuffer = (file: any, fileTypeObj: any) => {
  var base64Str: any = file;
  let image: Buffer;

  const parts = base64Str.split(';base64,');
  // Decode the base64 data
  const decodedData = Buffer.from(parts[1], 'base64');
  // Create a Buffer object from the decoded data
  image = decodedData;
  // console.log(imageFile);
  return {
    originalname: `${fileTypeObj.fileName}.${fileTypeObj.type}`,
    buffer: image,
  };
};
