import app from "./src/app.js"
import connectDB from "./src/config/db.js"
const PORT = 3000

connectDB();

app.listen(PORT, ()=>{
    console.log(`Server is listening on http://localhost:${PORT}`)
})