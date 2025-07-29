import type { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from './database'

export default async function handlerLoginForm (
    req: NextApiRequest,
    res: NextApiResponse
) {
    try {
        const { method } = req

        if (method === "POST") {
            // get data from mongodb
            const { db } = await connectToDatabase()
            const data = await db.collection("user").find({
                username: req.body.username,
                password: req.body.password
            }).toArray()
            
            if (data.length===0){
                res.status(200).json({data: "successful"})
            } 
            if (data.length!==0)   {
                res.status(200).json({data: "failed"})
            }
         }   else {
            res.status(405)
         }   
    }  catch (err: any) {
        res.status(500).json({statusCode: 500, message: err.message})
    }
   
}
