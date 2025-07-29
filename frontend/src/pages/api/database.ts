import { MongoClient, Db } from 'mongodb'

const { MONGODB_URL: url, MONGODB_DB: dbName} = process.env

let cachedClient: MongoClient;
let cachedDb: Db;


if (!url) {
    throw new Error(
      'Please define the MONGODB_URL environment variable inside .env.local'
    );
  }
  
if (!dbName) {
    throw new Error(
        'Please define the MONGODB_DB environment variable inside .env.local'
    );
}

export async function connectToDatabase () {
    
    if (cachedClient && cachedDb) {
        return {client: cachedClient, db: cachedDb}
    }

    
    const client = await MongoClient.connect(url!,  {
    })

    const db = await client.db(dbName)

    cachedClient = client
    cachedDb = db 
    
    return {client, db}

}


