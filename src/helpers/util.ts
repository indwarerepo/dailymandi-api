import { User } from '../types/user';
import { Driver } from '../types/driver';
import jwt from 'jsonwebtoken';
import config from 'config';
import { azureBlobUpload, convertBase64ToBuffer, azureUploadFile } from '../helpers/upload';

/**
 * Image upload generic function for BASE64STR.
 * parameter base64 string
 */
export function imageUpload(base64Str: string, container: string) {
  //image extension check
  let ext = base64Str.split(';')[0].split(':')[1];
  let exttype = '';
  if (ext === 'image/png') {
    exttype = 'png';
  } else if (ext === 'image/jpg') {
    exttype = 'jpg';
  } else if (ext === 'image/jpeg') {
    exttype = 'jpeg';
  } else {
    return false;
  }

  //randomizing image names and converting base64 to image buffer
  var imageFileName = Date.now();
  var imageName = imageFileName.toString();
  var optionalObj = { fileName: imageName, type: exttype };
  var image = convertBase64ToBuffer(base64Str, optionalObj);
  var fileName = image.originalname;
  var filePath = image.buffer;

  //azure storage container name and getting image url after uploading image
  let imageUrl = azureBlobUpload(fileName, filePath, container);
  return imageUrl;
}

/**
 * User token generation for jwt
 * jwt signing with user data
 */
export async function generateUserToken(user: User) {
  const tokenOptions: any = {
    expiresIn: '24h', // Example expiration time
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      userType: user.userType,
      isAdmin: user.isAdmin,
      status: user.isActive,
    },
    config.get('jwt_auth_key'),
    tokenOptions,
  );
}

/**
 * Driver token generation for jwt
 * jwt signing with driver data
 */
export async function generateDriverToken(driver: Driver) {
  const tokenOptions: any = {
    expiresIn: '24h', // Example expiration time
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(
    {
      id: driver.id,
      name: driver.name,
      status: driver.isActive,
      userType: 'Driver',
    },
    config.get('jwt_auth_key'),
    tokenOptions,
  );
}

/**
 * Customer token generation for jwt
 * jwt signing with customer data
 */
export async function generateCustomerToken(customer: User) {
  const tokenOptions: any = {
    expiresIn: '6h', // Example expiration time
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(
    {
      id: customer.id,
      name: customer.name,
      userType: customer.userType,
      isAdmin: customer.isAdmin,
      status: customer.isActive,
      referralCode: customer.referralCode,
    },
    config.get('jwt_auth_key'),
    tokenOptions,
  );
}

/**
 * User token generation for jwt
 * Generate normal token
 * jwt signing without user data
 */
export function generateToken(payload: { [key: string]: any }, expiry: string) {
  const tokenOptions: any = {
    expiresIn: expiry, // Example expiration time
    algorithm: 'HS256', // Specify the signing algorithm (e.g., HS256)
  };

  return jwt.sign(payload, config.get('jwt_auth_key'), tokenOptions);
}

/**
 * User token verify
 * jwt token verify
 */
export function verifyToken(token: string) {
  return jwt.verify(token, config.get('jwt_auth_key'));
}

/**
 * Transform Populate response
 * from query-builder helper class
 */
export function transformResponse(response: { [key: string]: any }[], prefixes: string[]) {
  return response.map((item) => {
    let res = {};
    prefixes.forEach((prefix) => {
      const relatableTable: { [key: string]: string } = {};

      Object.keys(item).forEach((key) => {
        const adjustedKey = key.split('_').slice(0, -1).join('_');
        if (adjustedKey === prefix) {
          relatableTable[key.substring(prefix.length + 1)] = item[key] as string;
          delete item[key];
        }
      });
      res = { ...res, [prefix]: relatableTable };
    });
    res = { ...item, ...res };
    return res;
  });
}

/**
 * Transform Populate response one
 * from query-builder helper class
 */
export function transformResponseOne(response: { [key: string]: any }, prefixes: string[]) {
  let res = {};
  prefixes.forEach((prefix) => {
    const relatableTable: { [key: string]: string } = {};
    Object.keys(response).forEach((key) => {
      const adjustedKey = key.split('_').slice(0, -1).join('_');
      if (adjustedKey === prefix) {
        relatableTable[key.substring(prefix.length + 1)] = response[key] as string;
        delete response[key];
      }
    });
    res = { ...res, [prefix]: relatableTable };
  });
  return { ...response, ...res };
}

/**
 * Generate invitation link
 */
export function generateInviteLink(token: string, isNewUser: boolean) {
  const NODE_ENV = config.get('node_env') as string;
  const devUrl = `http://localhost:7000/auth${isNewUser ? '' : '/signin'}?token=${token}`;
  const prodUrl = `https://worksync.indwaredigital.com/auth${isNewUser ? '' : '/signin'}?token=${token}`;
  return ['development', 'dev'].includes(NODE_ENV) ? devUrl : prodUrl;
}

/**
 * Generate email verification link
 * for registration
 */
export function generateEmailVerificationLink(token: string) {
  const NODE_ENV = config.get('node_env') as string;
  const devUrl = `http://localhost:7000/auth?token=${token}`;
  const prodUrl = `https://worksync.indwaredigital.com/auth?token=${token}`;
  return ['development', 'dev'].includes(NODE_ENV) ? devUrl : prodUrl;
}

// Find fields whose values are changed in two objects
export const findChangedFields = (reqObject: any, dbObject: any) => {
  const previous: any = {};
  const current: any = {};

  // Iterate over keys in the request object only
  Object.keys(reqObject).forEach((key) => {
    if (dbObject[key] && reqObject[key] !== dbObject[key]) {
      previous[key] = dbObject[key];
      current[key] = reqObject[key];
    }
  });

  return { previous, current };
};

export const deepEqual = (obj1: any, obj2: any) => {
  if (obj1 === obj2) return true;

  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
    return false;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
      return false;
    }
  }

  return true;
};

/**
 * Check whether the input is base64 string or image url for edit apis mostly
 */
export function checkImageInput(input: string): 'Base64' | 'URL' | 'Unknown' {
  const base64Pattern = /^data:image\/(png|jpeg|jpg|gif);base64,/;
  const urlPattern = /\.(jpeg|jpg|gif|png)$/;

  if (base64Pattern.test(input)) {
    return 'Base64';
  } else if (urlPattern.test(input)) {
    return 'URL';
  } else {
    return 'Unknown';
  }
}

/**
 *
 * @param filters
 *
 * @returns filterObject
 */
export function getFilterObject(filters: { id: string; value: any }[]) {
  const result = filters.reduce((acc: { [key: string]: any }, filter) => {
    acc[filter.id] = `%${filter.value}%`;
    return acc;
  }, {});
  return result;
}
