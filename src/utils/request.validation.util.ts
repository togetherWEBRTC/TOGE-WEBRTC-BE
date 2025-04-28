import { z } from "zod"
import { Request, Response } from "express"
import { ResError, ResCode } from "@type/response.types"

export function validateQuery<T extends z.ZodType>(schema: T, req: Request, res: Response): z.infer<T> {
   try {
      const data = req.method === "GET" ? req.query : req.body
      return schema.parse(data)
   } catch (error) {
      if (error instanceof z.ZodError) {
         throw new ResError({
            code: ResCode.INVALID_PARAMS.code,
            message: error.errors[0].message,
         })
      } else {
         throw new ResError({
            code: ResCode.INVALID_PARAMS.code,
            message: "Unknown validation error",
         })
      }
   }
}

export function validateSocketData<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
   try {
      return schema.parse(data)
   } catch (error) {
      if (error instanceof z.ZodError) {
         throw new ResError({
            code: ResCode.INVALID_PARAMS.code,
            message: error.errors[0].message,
         })
      } else {
         throw new ResError({
            code: ResCode.INVALID_PARAMS.code,
            message: "Unknown validation error",
         })
      }
   }
}
