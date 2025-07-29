import type { NextApiRequest, NextApiResponse } from 'next'
import { connectToDatabase } from './database'

export default async function handlerSignup (
    req: NextApiRequest,
    res: NextApiResponse,
) {
    try {
        const { method } = req
        if (method === "POST") {
            const { db } = await connectToDatabase() 
            
            // check whether the user already signed up or not
            const check  =  await db.collection("user").find({
                username: req.body.username,
                email: req.body.email
            }).toArray()

            if (check.length === 0) {
                const status = await db.collection("user").insertOne({
                    username: req.body.username,
                    password: req.body.password,
                    email: req.body.email
                })

        
                if (status.acknowledged === true){
                    res.status(200).json({data: "successful"})
                }
            } else {
                res.status(405).json({data: "signed up"})
            }
          
        }   else {
            res.status(405).json({data: "failed"})
        } 
    } catch (err: any) {
        res.status(500).json({statusCode: 500, message: err.message})
    }

}