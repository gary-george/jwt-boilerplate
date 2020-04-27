import _ from 'lodash';
import envalid from 'envalid';
const { str, num, bool } = envalid;

require('dotenv').config({ silent: true });

const env = envalid.cleanEnv(
  process.env,
  Object.assign(
    {},
    {
      APP_PORT: num({ default: 5000 }),
      MONGODB_URL: str({
        default: 'mongodb://localhost:27017/jwt-boilerplate',
      }),
      NODE_ENV: str({ default: 'production' }),
      API_KEY: str({ default: '' }),
      ENCRYPTION_KEY: str({ default: '' }),
      ACCESS_TOKEN_SECRET: str({ default: '' }),
      REFRESH_TOKEN_SECRET: str({ default: '' }),
    }
  )
);

module.exports = {
  env,
};
