const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(express.json());

app.use(bodyParser.json());


if (!fs.existsSync('upload')) {
    fs.mkdirSync('upload');
}


app.use(cors({
    origin: ['http://localhost:44332', 'https://localhost:44332', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));


const db = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'registration_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
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
        SELECT images.id, images.user_id, images.image_url, images.tags, users.first_name, users.last_name
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


    const query = `SELECT first_name, last_name, password FROM users WHERE id = ?`;

    db.query(query, [userId], (err, result) => {
        if (err) {
            return res.status(500).json({ error: 'Error fetching user data' });
        }

        if (result.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = result[0];
        res.json({
            first_name: user.first_name,
            last_name: user.last_name,
            password: user.password
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
        SELECT 
            images.id, 
            images.user_id, 
            images.image_url, 
            images.tags, 
            users.first_name,
            users.last_name
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
    SELECT images.id, images.image_url, images.tags, COUNT(likes.id) AS likes_count
    FROM images
    LEFT JOIN likes ON images.id = likes.image_id
    WHERE likes.user_id = ?
    GROUP BY images.id
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

    const query = `SELECT image_url, tags FROM images WHERE user_id = ?`;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Database error fetching uploaded images:', err);
            return res.status(500).json({ error: 'Failed to fetch uploaded images.' });
        }
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

// GET: Fetch comments for a specific image
app.get('/images/:imageId/comments', async (req, res) => {
    const { imageId } = req.params;

    try {
        const [comments] = await db.query(`
            SELECT 
                c.id,
                c.user_id,
                c.comment,
                c.created_at,
                u.first_name,
                u.last_name
            FROM comments c
            JOIN users u ON c.user_id = u.id
            WHERE c.image_id = ?
            ORDER BY c.created_at DESC
        `, [imageId]);

        console.log('Comments fetched:', comments); // Debug log
        res.status(200).json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Database error. Please try again.' });
    }
});

// POST: Add a comment to an image
app.post('/images/:imageId/comment', (req, res) => {
    const { userId, comment } = req.body;
    const { imageId } = req.params;

    if (!comment || comment.trim() === '') {
        return res.status(400).json({ error: 'Comment cannot be empty.' });
    }

    const query = `
        INSERT INTO comments (user_id, image_id, comment, created_at) 
        VALUES (?, ?, ?, NOW())
    `;

    db.query(query, [userId, imageId, comment], (err, result) => {
        if (err) {
            console.error('Error adding comment:', err);
            return res.status(500).json({ error: 'Database error. Please try again.' });
        }

        // Fetch the newly created comment with user details
        const fetchQuery = `
            SELECT 
                comments.id,
                comments.comment,
                comments.created_at,
                comments.user_id,
                users.first_name,
                users.last_name
            FROM comments
            JOIN users ON comments.user_id = users.id
            WHERE comments.id = ?
        `;

        db.query(fetchQuery, [result.insertId], (err, commentResult) => {
            if (err) {
                console.error('Error fetching new comment:', err);
                return res.status(500).json({ error: 'Comment added but failed to fetch details.' });
            }
            res.status(200).json(commentResult[0]);
        });
    });
});

// DELETE: Delete a comment by ID (with enhanced security and logging)
app.delete('/comments/:commentId', async (req, res) => {
    const { commentId } = req.params;
    const { userId } = req.body;

    console.log(`Attempting to delete comment ${commentId} by user ${userId}`);

    if (!userId) {
        return res.status(401).json({ error: 'Authentication required.' });
    }

    let connection;
    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        // Check comment ownership
        const [comments] = await connection.query(
            'SELECT user_id, image_id FROM comments WHERE id = ?',
            [commentId]
        );

        if (comments.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Comment not found.' });
        }

        const comment = comments[0];

        if (parseInt(comment.user_id) !== parseInt(userId)) {
            await connection.rollback();
            return res.status(403).json({ error: 'Unauthorized to delete this comment.' });
        }

        // Delete the comment
        await connection.query('DELETE FROM comments WHERE id = ?', [commentId]);

        // Log the deletion (if you have an activity_logs table)
        await connection.query(
            'INSERT INTO activity_logs (user_id, action, entity_type, entity_id) VALUES (?, ?, ?, ?)',
            [userId, 'delete', 'comment', commentId]
        );

        await connection.commit();
        res.status(200).json({
            message: 'Comment deleted successfully.',
            commentId: commentId,
            imageId: comment.image_id
        });

    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Error in delete transaction:', error);
        res.status(500).json({ error: 'Failed to delete comment. Please try again.' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});



/*app.get('/images/:imageId/is-favorited', (req, res) => {
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
});*/


app.use('/upload', express.static(path.join(__dirname, 'upload')));


app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

