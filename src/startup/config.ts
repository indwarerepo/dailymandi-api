import config from 'config';

/**
 * Check JWT key defined or not
 */
module.exports = async function () {
  if (!config.get('jwt_auth_key')) {
    throw new Error('FATAL ERROR: jwt private key is not defined');
  }
};
