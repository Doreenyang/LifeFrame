import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// routes
import userRouter from './routes/users';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send({ message: 'LifeFrame API running' });
});

// register routers
app.use('/api/users', userRouter);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
