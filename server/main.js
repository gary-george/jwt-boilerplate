const { app } = require('./server');
const { env } = require('../env-config');
const { APP_PORT } = env;

module.exports = {
  serve: () => {
    app.listen(APP_PORT, (err) => {
      if (err) {
        console.error(err);
      }
      console.info(`Listening on port ${APP_PORT} 🚀`);
    });
  },
};
