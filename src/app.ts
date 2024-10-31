import express from 'express'
// import exampleRoutes from './routes/example.routes';

const app = express()
app.use(express.json())

// Use routes
// app.use('/api/example', exampleRoutes);

export default app
