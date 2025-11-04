import mongoose from "mongoose"
import dotenv from "dotenv"
dotenv.config()
function dbConnect(){
    mongoose.connect(process.env.DATABASE_URL,{

    })
    .then(()=>console.log("DB connected"))
    .catch((error)=>{
        console.log("DB Failed")
        process.exit(1);
    })
}

export default dbConnect;