import "reflect-metadata" //di때문에 최상단
import dotenv from "dotenv"
import sequelize from "@config/database"
import helmet from "helmet"
import morgan from "morgan"
import compression from "compression"
import express, { Express, Request, Response } from "express"
import { createServer } from "http"
import cors from "cors"
import authRouter from "@routes/auth.route"
import apiRoomRouter from "@routes/room.route"
import { socketRouter } from "@routes/socket.main.route"
import typedi from "@di/typedi"
import path from "path"
import { Server } from "socket.io"
import { initRedis } from "@config/redis"

dotenv.config()

const app: Express = express()
const httpServer = createServer(app)
const socketServer = createServer()

sequelize
   .authenticate()
   .then(() => sequelize.sync())
   .then(() => {
      console.log("Database initialized")
      console.log("Available models:", Object.keys(sequelize.models))
   })
   .catch((error) => {
      console.error("Unable to connect to the database:", error)
      process.exit(1)
   })
initRedis()
typedi()

const HTTP_PORT = process.env.SERVER_PORT || 3000
httpServer.listen(HTTP_PORT, () => {
   console.log(`Server is running on port ${HTTP_PORT}`)
})

const SOCKET_PORT = process.env.WEBSOCKET_PORT || 3001
socketServer.listen(SOCKET_PORT, () => {
   console.log(`Socket.io server is running on port ${SOCKET_PORT}`)
})

const initializeSocketIO = async () => {
   await initRedis()
   const io = new Server(socketServer, {
      cors: {
         origin: "*",
         methods: ["GET", "POST"],
      },
      path: "/",
      transports: ["websocket", "polling"],
   })
   socketRouter(io)
   return io
}

initializeSocketIO().catch(console.error)

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }))
   .use(morgan("dev"))
   .use(compression())
   .use(express.json({ limit: "10mb" }))
   .use(express.urlencoded({ extended: true, limit: "10mb" }))
   .use(
      cors({
         origin: process.env.CLIENT_URL,
         credentials: true,
      })
   )

app.use("/api/auth", authRouter)
app.use("/api/room", apiRoomRouter)
app.use(
   "/profile",
   express.static(path.join(__dirname, "public/profile"), {
      maxAge: "7d",
      setHeaders: (res, path) => {
         res.setHeader("Cache-Control", "public, max-age=604800")
      },
   })
)
