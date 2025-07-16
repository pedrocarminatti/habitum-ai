import express from 'express'
import { PrismaClient } from '../generated/prisma' // or '@prisma/client' if using default

const app = express()
const prisma = new PrismaClient()

app.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany()
  res.json(users)
})

app.listen(3333, () => {
  console.log('🚀 Server running at http://localhost:3333')
})

app.use(express.json())

app.post('/habits', async (req, res) => {
  const { title, userId } = req.body;

  try {
    const habit = await prisma.habit.create({
      data: {
        title,
        userId,
      },
    });

    res.status(201).json(habit);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Could not create habit' });
  }
});

app.get('/habits', async (_req, res) => {
  try {
    const habits = await prisma.habit.findMany({
      include: { sessions: true }, 
    });

    res.json(habits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch habits' });
  }
});
