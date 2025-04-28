import { createClient } from "@redis/client"
import dotenv from "dotenv"

export const redisConfig = {
   host: process.env.REDIS_HOST || "localhost",
   port: parseInt(process.env.REDIS_PORT || "6379"),
   password: process.env.REDIS_PASSWORD,
}

export const createRedisClient = () => {
   const client = createClient({
      socket: {
         host: process.env.REDIS_HOST,
         port: parseInt(process.env.REDIS_PORT || "6379"),
      },
      password: process.env.REDIS_PASSWORD,
   })
   client.on("error", (err) => console.error("Redis Error:", err))
   return client
}

let redisClient: ReturnType<typeof createClient> | null = null

export const getRedisClient = () => {
   if (!redisClient) {
      throw new Error("Redis client not initialized")
   }
   return redisClient
}

export const initRedis = async () => {
   dotenv.config()
   redisClient = createRedisClient()
   await redisClient.connect()
   console.log("Redis connected successfully")
   return redisClient
}
