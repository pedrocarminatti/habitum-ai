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
