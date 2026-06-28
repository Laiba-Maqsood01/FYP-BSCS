import app from "./src/app.js"
import connectDB from "./src/config/db.js"
import config from "./src/config/config.js";

const PORT = config.PORT || 3000

async function start() {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Server is listening on http://localhost:${PORT}`)
    });
}

start();
