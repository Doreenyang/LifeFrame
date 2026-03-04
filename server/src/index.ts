import './config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

// routes
import userRouter from './routes/users';
import { register, login } from './controllers/authController';
import photosRouter from './routes/photos';
import albumsRouter from './routes/albums';

const app = express();
const port = process.env.PORT || 4000;

app.use(helmet());
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'LifeFrame API running' });
});

// auth
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// register routers
app.use('/api/users', userRouter);
app.use('/api/photos', photosRouter);
app.use('/api/albums', albumsRouter);

// basic error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).send({ error: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
