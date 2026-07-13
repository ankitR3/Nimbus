import express from 'express';
import cors from 'cors';
import phaseRoutes from './route/phase.route';
import 'dotenv/config';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', phaseRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));