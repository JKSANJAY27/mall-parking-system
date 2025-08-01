require('dotenv').config(); // Load environment variables for PORT
const app = require('./app'); // Import your Express app
const connectDB = require('./config/db'); // Import the DB connection function

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});