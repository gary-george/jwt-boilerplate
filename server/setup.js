import mongoose from 'mongoose';
mongoose.Promise = Promise;
import { env } from '../env-config';

const { MONGODB_URL } = env;

const setup = () => mongoose.connect(MONGODB_URL, {});

const teardown = () => mongoose.disconnect();

module.exports = {
  setup,
  teardown,
};
