import { compareSync, hashSync } from 'bcrypt';
const saltRounds = 10;

/**
 * Encryption password with bcrypt
 */
export const encrypt = (password: string) => {
  return hashSync(password, saltRounds);
};

/**
 * Password compare
 */
export const comparePassword = (password: string, userPassword: string) => {
  // console.log(password);
  // console.log('=======');
  // console.log(userPassword);
  return compareSync(password, userPassword);
};
