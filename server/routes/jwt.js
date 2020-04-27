import jwt from 'jsonwebtoken';
import nocache from 'nocache';
import { env } from '../../env-config';
import * as R from 'ramda';
import userCreator from '../db/users-creator';
import { usersModel } from '../db/users-model';
import refreshTokenCreator from '../db/refresh-token-creator';
import { refreshModel } from '../db/refresh-token-model';
import Joi from '@hapi/joi';
import Cryptr from 'cryptr';

const {
  ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET,
  API_KEY,
  ENCRYPTION_KEY,
} = env;
const cryptr = new Cryptr(ENCRYPTION_KEY);

const mockPosts = [
  {
    username: 'exampleUser',
    title: 'post 1',
  },
];

const generateAccessToken = (user) =>
  jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: '10m' });

const generateRefreshToken = (user) => jwt.sign(user, REFRESH_TOKEN_SECRET);

const getTokenFromHeader = (req) => {
  const getToken = (authHeader) => authHeader.split(' ')[1];
  return R.compose(
    getToken,
    R.pathOr(false, ['headers', 'authorization'])
  )(req);
};

const getAPIKeyFromHeader = (req) =>
  R.pathOr(null, ['headers', 'authorization'])(req);

const authenticateToken = (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (token === null) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    return next();
  });
};

const AuthenticateAPIKey = (req, res, next) => {
  const apiKey = getAPIKeyFromHeader(req);
  if (apiKey === null) return res.sendStatus(401);
  if (apiKey === API_KEY) return next();
  return res.sendStatus(403);
};

const usernameSchema = Joi.object({
  username: Joi.string().required(),
});

const addUserSchema = Joi.object({
  username: Joi.string().required(),
  email: Joi.string().required(),
  pass: Joi.string().required(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  pass: Joi.string().required(),
});

module.exports = (app) => {
  // Example route using the autheticateToken middleware
  app.get('/v1/posts', nocache(), authenticateToken, (req, res) =>
    res.send(mockPosts)
  );

  app.post(
    '/v1/delete-user',
    nocache(),
    AuthenticateAPIKey,
    async (req, res) => {
      try {
        await usernameSchema.validateAsync(req.body);

        const username = req.body.username;
        const result = await usersModel.findOneAndRemove({
          username,
        });
        result
          ? res.json({ msg: `User ${username} has been deleted` })
          : res.json({ msg: `User ${username} was not found` });
      } catch (e) {
        console.log(e);
        res.send({ error: e });
      }
    }
  );

  app.post('/v1/get-user', nocache(), AuthenticateAPIKey, async (req, res) => {
    try {
      await usernameSchema.validateAsync(req.body);

      const username = req.body.username;
      const result = await usersModel
        .findOne({
          username,
        })
        .lean()
        .exec();
      result
        ? res.json({
            ...result,
          })
        : res.json({
            msg: `User ${username} was not found`,
          });
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  });

  app.post(
    '/v1/create-user',
    nocache(),
    AuthenticateAPIKey,
    async (req, res) => {
      try {
        await addUserSchema.validateAsync(req.body);

        const user = req.body.username;
        const result = await usersModel
          .findOne({
            username: user,
          })
          .lean()
          .exec();
        if (result) {
          res.json({
            msg: 'user already exists',
          });
        }

        const encryptedPass = cryptr.encrypt(req.body.pass);

        const newUser = {
          email: req.body.email,
          username: req.body.username,
          password: encryptedPass,
        };
        await userCreator(newUser);

        res.json({
          msg: 'user successfully created',
        });
      } catch (e) {
        console.log(e);
        res.send({ error: e });
      }
    }
  );

  app.post('/v1/login', nocache(), async (req, res) => {
    try {
      await loginSchema.validateAsync(req.body);

      const username = req.body.username;
      const result = await usersModel
        .findOne({
          username,
        })
        .lean()
        .exec();

      if (result && cryptr.decrypt(result.password) === req.body.pass) {
        const user = {
          _id: result._id,
          email: result.email,
          username: result.username,
        };

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await refreshTokenCreator({
          userIdentifier: user._id,
          refreshToken,
        });

        res.json({
          accessToken,
          refreshToken,
          user,
        });
      } else {
        res.json({
          error: true,
          msg: 'user not found',
        });
      }
    } catch (e) {
      console.log(e);
      res.send({ error: e });
    }
  });

  app.post('/v1/verify-token', nocache(), (req, res) => {
    const accessToken = getTokenFromHeader(req);
    if (accessToken === null) return res.sendStatus(401);
    jwt.verify(accessToken, ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      res.json({ user });
    });
  });

  app.post('/v1/refresh-token', nocache(), async (req, res) => {
    const refreshToken = req.body.refreshToken;
    if (refreshToken === null) return res.sendStatus(401); // check a token was sent

    const result = await refreshModel
      .findOne({
        refreshToken,
      })
      .lean()
      .exec();
    if (!result) {
      return res.sendStatus(403);
    }

    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      const accessToken = generateAccessToken({ name: user.name });
      res.json({ accessToken }); // returns a new access token
    });
  });

  app.delete('/v1/logout', async (req, res) => {
    const result = await refreshModel.findOneAndRemove({
      refreshToken: req.body.refreshToken,
    });
    res.sendStatus(204);
  });
};
