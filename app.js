const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const app = express();


// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images'); //Directory to save uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Keep original filename
    }
});
const upload = multer({ storage: storage });


// Create MySQL connection
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'c237_musicapp'
});
connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});
// Set up view engine
app.set('view engine', 'ejs');
// enable static files
app.use(express.static('public'));
// enable form processing
app.use(express.urlencoded({
    extended: false
}));


// Define routes
// Example:
app.get('/', (req, res) => {
    const sql = 'SELECT *, DATE_FORMAT(date, "%M %d, %Y") as formatted_date FROM songs';
    connection.query(sql, (error, results) => {
        if (error) throw error;
        // Render HTML page with data
        res.render('index', { songs:results }); 
    });
});

app.get('/song/:id', (req, res) => {
    //Extract the song ID from the request parameters
    const songId = req.params.id;
    const sql = 'SELECT *, DATE_FORMAT(date, "%M %d, %Y") as formatted_date FROM songs WHERE songId = ?';
    //Fetch data from MySQL based on the song ID
    connection.query( sql , [songId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error Retrieving song by ID');
        }
        // Check if any song with the given ID was found
        if (results.length > 0) {
            //Render HTML page with the song data
            res.render('song', {song: results[0] });
        } else {
            //If no song with the given ID was found, render a 404 page or handle it accordingly
            res.status(404).send('Song not found');
        }
    });
});

app.get('/song', (req, res) => {
    res.render('addSong'); 
});


app.post('/addSong', upload.single('image'), (req, res) => {
    // Extract song data from the request body
    const { name, date, artist } = req.body;
    let image;
    if (req.file) {
        image = req.file.filename; // Save only the filename
    } else {
        image = null;
    }
    const sql = 'INSERT INTO songs (name, date, artist, image) VALUES (?, ?, ?, ?)';
    // Insert the new song into the database
    connection.query( sql , [name, date, artist, image], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error adding song:", error);
            res.status(500).send('Error adding song');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/editSong/:id', (req,res) => {
    const songId = req.params.id;
    const sql = 'SELECT * FROM songs WHERE songId = ?';
    // Fetch data from MySQL based on the song ID 
    connection.query( sql, [songId], (error, results) => {
        if (error) {
            console.error('Database query error:', error.message);
            return res.status(500).send('Error retrieving song by ID');
        }
        // Check if any song with the given ID was found
        if (results.length > 0) {
            //Render HTML page with the song data   
            res.render('editSong',  { song: results[0] });
        } else {
            // If no song with the given ID is found, render a 404 page or handle it accordingly
            res.status(404).send('Song not found');
        }
    });
});



app.post('/editSong/:id', upload.single('image'), (req, res) => {
    const songId = req.params.id;
    // Extract song data from the request body
    const { name, date, artist } = req.body;
    let image = req.body.currentImage;  // retrieve current image filename
    if (req.file) { // if new image is uploaded 
        image = req.file.filename; // set image to be new image filename
    }

    const sql = 'UPDATE songs SET name = ?, date = ?, artist = ?, image =? WHERE songId = ?';


    //Insert the new song into the database 
    connection.query( sql , [name, date, artist, image, songId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error updating song:", error);
            res.status(500).send('Error updating song');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});


app.get('/deleteSong/:id', (req, res) => {
    const songId = req.params.id;
    const sql = 'DELETE FROM songs WHERE songId = ?';
    connection.query( sql , [songId], (error, results) => {
        if (error) {
            // Handle any error that occurs during the database operation
            console.error("Error deleting song", error);
            res.status(500).send('Error deleting song');
        } else {
            // Send a success response
            res.redirect('/');
        }
    });
});

app.get('/login', (req, res) => {
    res.render('login.ejs'); // Assuming login.ejs is in your views directory
});

// Mock user data (replace with database integration)
const users = [
    { username: 'user1', password: 'password1' },
    { username: 'user2', password: 'password2' }
];

// Route to handle login form submission
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Mock authentication logic (replace with actual authentication)
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        // Successful login
        res.send(`Welcome, ${username}!`);
    } else {
        // Failed login
        res.send('Invalid username or password.');
    }
});

app.get('/register', (req, res) => {
    res.render('register.ejs'); // Assuming register.ejs is in your views directory
});

// Mock user data (replace with database integration)
const user = [];

// Route to handle registration form submission
app.post('/register', (req, res) => {
    const { username, password, confirm_password } = req.body;

    // Mock validation (replace with actual validation logic)
    if (!username || !password || !confirm_password) {
        return res.status(400).send('All fields are required.');
    }

    if (password !== confirm_password) {
        return res.status(400).send('Passwords do not match.');
    }

    // Mock check if username already exists
    const existingUser = users.find(u => u.username === username);
    if (existingUser) {
        return res.status(400).send('Username already exists.');
    }

    // Create new user (mock implementation)
    const newUser = { username, password }; // You should hash password before saving to database
    users.push(newUser);

    // Redirect to login page after successful registration
    res.redirect('/login');
});

// GET request to render index.ejs with data
app.get('/', (req, res) => {
    res.render('index', { songs: songs });
  });
  
  // POST request to handle file upload
  app.post('/upload', upload.single('audioFile'), (req, res, next) => {
    // Logic to handle file upload, e.g., save file details to database, etc.
    const uploadedFile = req.file;
    console.log('Uploaded:', uploadedFile);
    
    // Assuming you redirect back to the index page after upload
    res.redirect('/');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));