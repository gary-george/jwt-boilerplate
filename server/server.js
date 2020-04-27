import express from 'express';
import helmet from 'helmet';
import responseTime from 'response-time';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import bodyParser from 'body-parser';
import handlebars from 'express-handlebars';
import { env } from '../env-config';
require('./setup').setup();

const app = express();
const router = express.Router();

router.use(helmet());
router.use(responseTime());
router.use(cors());
router.use(cookieParser());

router.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
router.use(
  bodyParser.json({
    limit: '5mb',
  })
);

app.engine(
  'html',
  handlebars({
    helpers: {
      toJson: (object) => JSON.stringify(object),
    },
  })
);
app.set('view engine', 'html');

require('./routes/jwt')(router);

app.use(router);

app.shutdown = () => {
  require('./setup').teardown();
};

module.exports = {
  app,
};
