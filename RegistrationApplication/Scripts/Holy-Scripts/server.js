const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());

app.use(bodyParser.json());

const uploadDir = path.join(__dirname, 'upload/profile');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}


if (!fs.existsSync('upload')) {
    fs.mkdirSync('upload');
}


app.use(cors({
    origin: ['http://localhost:44332', 'https://localhost:44332', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '1234',
    database: 'registration_db',
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err.stack);
        process.exit(1);
    }
    console.log('Connected to the database');
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage: storage });




app.post('/register', (req, res) => {
    const { first_name, middle_name, last_name, address, phone_number, email, password } = req.body;

    // Validate input fields
    if (!first_name || !last_name || !email || !password || phone_number.length !== 11) {
        return res.status(400).json({ error: 'Invalid input. Please fill in all required fields.' });
    }

    const query = `
        INSERT INTO users (first_name, middle_name, last_name, address, phone_number, email, password)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(query, [first_name, middle_name, last_name, address, phone_number, email, password], (err) => {
        if (err) {
            console.error('Database error during registration:', err);
            return res.status(500).json({ error: 'Failed to create account. Please try again later.' });
        }

        res.status(200).json({ message: 'Account created successfully!' });
    });
});


app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    const query = `SELECT * FROM users WHERE email = ?`;
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ error: 'Database error. Please try again later.' });
        }

        if (results.length > 0) {
            const user = results[0];

            if (password === user.password) {
                res.status(200).json({
                    message: 'Login successful',
                    userId: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email
                });
            } else {
                res.status(401).json({ error: 'Invalid email or password.' });
            }
        } else {
            res.status(401).json({ error: 'Invalid email or password.' });
        }
    });
});


app.post('/upload', upload.single('image'), (req, res) => {

    const userId = req.body.userId;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }


    if (!req.file || !req.body.tags) {
        return res.status(400).json({ error: 'Image and tags are required.' });
    }

    let tags;
    try {
        // Parse the tags from the request body
        tags = JSON.parse(req.body.tags);

        // Check if the tags are an array and if each tag is a string
        if (!Array.isArray(tags) || tags.some(tag => typeof tag !== 'string')) {
            return res.status(400).json({ error: 'Tags must be an array of strings.' });
        }

        // Check if there are at least 3 tags
        if (tags.length < 3) {
            return res.status(400).json({ error: 'At least 3 tags are required.' });
        }

    } catch (err) {
        return res.status(400).json({ error: 'Invalid tags format. Must be a JSON array.' });
    }

    const imageUrl = `/upload/${req.file.filename}`;


    const query = `INSERT INTO images (user_id, image_url, tags) VALUES (?, ?, ?)`;
    db.query(query, [userId, imageUrl, JSON.stringify(tags)], (err) => {
        if (err) {
            console.error('Database error during image upload:', err);
            return res.status(500).json({ error: 'Failed to upload image. Please try again later.' });
        }
        res.status(200).json({ message: 'Image uploaded successfully', imageUrl });
    });
});

app.get('/search-images', (req, res) => {
    const searchTags = req.query.tags;

    if (!searchTags) {
        return res.status(400).json({ error: 'Search tags are required.' });
    }

    // Split tags by commas and trim whitespace
    const tagsArray = searchTags.toLowerCase().split(',').map(tag => tag.trim());

    // We use a LIKE query for each tag
    const queries = tagsArray.map(tag => {
        return `LOWER(images.tags) LIKE LOWER(CONCAT('%', ?, '%'))`;
    }).join(' OR '); // Combine with OR for multiple tag matching

    const query = `
        SELECT images.id, images.user_id, images.image_url, images.tags, users.first_name
        FROM images
        JOIN users ON images.user_id = users.id
        WHERE ${queries}
    `;

    // Flatten the array of tags into a single array of parameters for the query
    const params = tagsArray;

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Database error during image search:', err);
            return res.status(500).json({ error: 'Failed to search images.' });
        }
        res.status(200).json(results); // Send the search results back to the front-end
    });
});

app.get('/user/profile/:userId', (req, res) => {
    const userId = req.params.userId;

    // Query to fetch user data, including password
    const query = `SELECT first_name, last_name, password, profile_image FROM users WHERE id = ?`;

    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching user data' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result[0];

        // Construct the full URL for the profile image
        const profileImageUrl = user.profile_image ? `http://localhost:3000${user.profile_image}` : null;

        // Return the profile data, including the password (only for editing purposes)
        res.json({
            first_name: user.first_name,
            last_name: user.last_name,
            password: user.password,  // Add the password here
            profile_image: profileImageUrl,
        });
    });
});





app.put('/user/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    const { first_name, last_name, password, confirm_password } = req.body;

    if (password !== confirm_password) {
        return res.status(400).json({ error: 'Passwords do not match' });
    }

    const query = `UPDATE users SET first_name = ?, last_name = ?, password = ? WHERE id = ?`;

    db.query(query, [first_name, last_name, password, userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error updating profile' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    });
});




app.get('/images', (req, res) => {
    const query = `
        SELECT images.id, images.user_id, images.image_url, images.tags, users.first_name
        FROM images
        JOIN users ON images.user_id = users.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error during fetching images:', err);
            return res.status(500).json({ error: 'Failed to fetch images. Please try again later.' });
        }


        const images = results.map((image) => ({
            ...image,
            tags: JSON.parse(image.tags),
        }));

        res.status(200).json(images);
    });
});

app.get('/user/:userId/liked-images', (req, res) => {
    const { userId } = req.params;

    console.log(`Fetching liked images for user ID: ${userId}`);

    const query = `
    SELECT images.id, images.image_url, images.tags, 
           COUNT(likes.id) AS likes_count,
           users.first_name
    FROM images
    LEFT JOIN likes ON images.id = likes.image_id
    LEFT JOIN users ON likes.user_id = users.id
    WHERE likes.user_id = ?
    GROUP BY images.id, users.first_name
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching liked images:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }

        console.log(`Found ${results.length} liked images for user ID: ${userId}`);

        const likedImages = results.map((image) => ({
            ...image,
            tags: image.tags ? JSON.parse(image.tags) : [],
            likes_count: image.likes_count || 0  // Ensure likes_count is always present, even if it's 0
        }));

        console.log('Liked images data:', likedImages);

        res.status(200).json(likedImages);
    });
});



app.get('/user/:id/uploaded-images', (req, res) => {
    const userId = req.params.id;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required.' });
    }

    // Modify the query to join with the `users` table to get `first_name`
    const query = `
        SELECT 
            images.image_url, 
            images.tags, 
            users.first_name
        FROM 
            images
        JOIN 
            users ON images.user_id = users.id
        WHERE 
            images.user_id = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error fetching uploaded images:', err);
            return res.status(500).json({ error: 'Failed to fetch uploaded images.' });
        }

        // Return the results with the first_name
        res.status(200).json({ images: results });
    });
});


app.post('/images/:imageId/like', (req, res) => {
    const { userId } = req.body;
    const { imageId } = req.params;

    if (!userId || !imageId) {
        return res.status(400).json({ error: 'User ID and Image ID are required.' });
    }

    // Check if the user already liked the image
    const checkQuery = 'SELECT * FROM likes WHERE user_id = ? AND image_id = ?';
    db.query(checkQuery, [userId, imageId], (err, results) => {
        if (err) {
            console.error('Error checking like status:', err);
            return res.status(500).json({ error: 'Failed to process like/unlike. Please try again.' });
        }

        if (results.length > 0) {
            // User already liked, so unlike (delete the like)
            const deleteQuery = 'DELETE FROM likes WHERE user_id = ? AND image_id = ?';
            db.query(deleteQuery, [userId, imageId], (deleteErr) => {
                if (deleteErr) {
                    console.error('Error unliking image:', deleteErr);
                    return res.status(500).json({ error: 'Failed to unlike image. Please try again.' });
                }
                res.status(200).json({ message: 'Image unliked successfully.' });
            });
        } else {
            // User has not liked yet, so insert a like
            const insertQuery = 'INSERT INTO likes (user_id, image_id) VALUES (?, ?)';
            db.query(insertQuery, [userId, imageId], (insertErr) => {
                if (insertErr) {
                    if (insertErr.code === 'ER_DUP_ENTRY') {
                        return res.status(400).json({ error: 'You have already liked this image.' });
                    }
                    console.error('Error liking image:', insertErr);
                    return res.status(500).json({ error: 'Failed to like image. Please try again.' });
                }
                res.status(200).json({ message: 'Image liked successfully.' });
            });
        }
    });
});

// POST: Add a comment to an image
app.post('/images/:imageId/comment', (req, res) => {
    const { userId, comment } = req.body;
    const { imageId } = req.params;

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    // Insert the comment into the database, linking it to the user and image
    const query = 'INSERT INTO comments (user_id, image_id, comment) VALUES (?, ?, ?)';
    db.query(query, [userId, imageId, comment], (err) => {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }
        // Respond with a success message after the comment is added
        res.status(200).json({ message: 'Comment added successfully.' });
    });
});

// GET: Fetch comments for a specific image
app.get('/images/:imageId/comments', (req, res) => {
    const { imageId } = req.params;

    // Query to fetch comments associated with the given image, including the user_id of the comment author
    const query = `
        SELECT comments.id, comments.comment, comments.created_at, comments.user_id, users.first_name 
        FROM comments
        JOIN users ON comments.user_id = users.id
        WHERE comments.image_id = ?
        ORDER BY comments.created_at DESC
    `;
    db.query(query, [imageId], (err, results) => {
        if (err) {
            console.error('Error fetching comments:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }

        // Respond with the fetched comments, including user_id so the frontend can check ownership
        res.status(200).json(results);
    });
});

// DELETE: Delete a comment by ID (only if the logged-in user is the owner)
app.delete('/comments/:commentId', (req, res) => {
    console.log('Request body:', req.body);

    const { commentId } = req.params;
    const { userId } = req.body;

    console.log('Received delete request for comment:', commentId);
    console.log('Logged-in user ID:', userId);

    if (!userId) {
        return res.status(400).json({ error: 'User not logged in or userId missing.' });
    }

    const checkQuery = 'SELECT user_id FROM comments WHERE id = ?';

    db.query(checkQuery, [commentId], (err, results) => {
        if (err) {
            console.error('Error checking comment:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }

        if (results.length === 0) {
            console.log('No comment found with ID:', commentId);
            return res.status(404).json({ error: 'Comment not found.' });
        }

        const commentUserId = results[0].user_id;
        console.log('Comment author ID:', commentUserId);

        if (parseInt(commentUserId, 10) !== parseInt(userId, 10)) {
            console.log('User is not the owner of the comment.');
            return res.status(403).json({ error: 'You cannot delete this comment.' });
        }

        const deleteQuery = 'DELETE FROM comments WHERE id = ?';

        db.query(deleteQuery, [commentId], (err) => {
            if (err) {
                console.error('Error deleting comment:', err);
                return res.status(500).json({ error: 'Database error. Please try again.' });
            }

            console.log('Comment deleted successfully.');
            res.status(200).json({ message: 'Comment deleted successfully.' });
        });
    });
});
app.get('/images/:imageId/is-favorited', (req, res) => {
    const { userId } = req.query; // Get userId from query parameters
    const { imageId } = req.params;

    if (!userId || !imageId) {
        return res.status(400).json({ error: 'User ID and Image ID are required.' });
    }

    const checkQuery = 'SELECT COUNT(*) AS count FROM favorites WHERE user_id = ? AND image_id = ?';
    db.query(checkQuery, [userId, imageId], (err, results) => {
        if (err) {
            console.error('Error checking favorite status:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }

        const isFavorited = results[0].count > 0;
        res.status(200).json({ isFavorited });
    });
});


app.post('/images/:imageId/favorite', (req, res) => {
    const { userId } = req.body;
    const { imageId } = req.params;

    if (!userId || !imageId) {
        return res.status(400).json({ error: 'User ID and Image ID are required.' });
    }

    const checkQuery = 'SELECT * FROM favorites WHERE user_id = ? AND image_id = ?';
    db.query(checkQuery, [userId, imageId], (err, results) => {
        if (err) {
            console.error('Error checking favorite status:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }

        if (results.length > 0) {
            const deleteQuery = 'DELETE FROM favorites WHERE user_id = ? AND image_id = ?';
            db.query(deleteQuery, [userId, imageId], (deleteErr) => {
                if (deleteErr) {
                    console.error('Error removing favorite:', deleteErr);
                    return res.status(500).json({ error: 'Failed to remove favorite. Please try again.' });
                }
                res.status(200).json({ message: 'Image removed from favorites.', isFavorited: false });
            });
        } else {
            const insertQuery = 'INSERT INTO favorites (user_id, image_id) VALUES (?, ?)';
            db.query(insertQuery, [userId, imageId], (insertErr) => {
                if (insertErr) {
                    console.error('Error adding favorite:', insertErr);
                    return res.status(500).json({ error: 'Failed to add favorite. Please try again.' });
                }
                res.status(200).json({ message: 'Image added to favorites.', isFavorited: true });
            });
        }
    });
});

const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/profile/'); // Path where the profile images will be stored
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique file name
    },
});
const profileUpload = multer({ storage: profileStorage });

// Create the profile image upload directory if it doesn't exist
if (!fs.existsSync('upload/profile')) {
    fs.mkdirSync('upload/profile', { recursive: true });
}

// PUT: Update user profile image
app.put('/user/profile/:userId/upload-image', profileUpload.single('profileImage'), (req, res) => {
    const { userId } = req.params;

    // Ensure a file is uploaded
    if (!req.file) {
        return res.status(400).json({ error: 'Profile image is required.' });
    }

    // Construct the URL of the uploaded profile image
    const profileImageUrl = `/upload/profile/${req.file.filename}`;

    // Update the user's profile image in the database
    const query = `UPDATE users SET profile_image = ? WHERE id = ?`;
    db.query(query, [profileImageUrl, userId], (err, result) => {
        if (err) {
            console.error('Error updating profile image:', err);
            return res.status(500).json({ error: 'Failed to update profile image. Please t`ry again later.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Send the URL of the uploaded profile image back to the client
        res.status(200).json({
            message: 'Profile image updated successfully.',
            profileImageUrl: profileImageUrl,  // Return the profile image URL
        });
    });
});


// Serve profile images from the upload folder
app.use('/upload/profile', express.static(path.join(__dirname, 'upload/profile')));

app.use('/upload', express.static(path.join(__dirname, 'upload')));


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

