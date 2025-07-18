import 'dotenv/config';
import express from 'express';
import authRoutes from './routes/auth.routes';

const app = express();
app.use(express.json());

app.use('/auth', authRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
