const jwt = require('jsonwebtoken');
const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;



app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3aom8f0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


async function run() {
    try {
        await client.connect();

        const userCollection = client.db('eduDB').collection('users');
        const bookmarkCollection = client.db('eduDB').collection('bookmarks');
        const commentsCollection = client.db('eduDB').collection('comments');
        const idCollection = client.db('eduDB').collection('studentsId');
        const likesCollection = client.db('eduDB').collection('like');
        const newsfeedCollection = client.db('eduDB').collection('newsFeed');
        const messageCollection = client.db('eduDB').collection('messages');
        const notificationCollection = client.db('eduDB').collection('notifications');
        const studentsIdCollection = client.db('eduDB').collection('studentsId');




        // Generate JWT Token
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '24h'
            });
            res.send({ token });
        });

        // Middleware to Verify JWT Token
        const verifyToken = (req, res, next) => {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).send({ message: 'Unauthorized Access' });
            }
            const token = authHeader.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(403).send({ message: 'Forbidden Access' });
                }
                req.user = decoded;
                next();
            });
        };


        // Add a new user
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'User Already Created', insertedId: null });
            }
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // Get all users
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        });

        app.get('/studentId', async (req, res) => {
            const result = await idCollection.find().toArray();
            res.send(result);
        });

        // get user by id
        app.get('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.findOne(query);
            res.send(result);
        })

        //set user role to "admin"
        app.patch('/users/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await userCollection.updateOne(filter, updatedDoc);
            res.send(result);
        });

        app.patch('/updateusers/:id', async (req, res) => {
            const id = req.params.id;  
            const { jobStatus, company } = req.body;  
        
            const filter = { _id: new ObjectId(id) }; 
            const updatedDoc = {
                $set: {
                    jobStatus: jobStatus, 
                    company: company       
                }
            };
        
            try {
                
                const result = await userCollection.updateOne(filter, updatedDoc);
                
                if (result.modifiedCount === 1) {
                    res.status(200).send({ message: 'User updated successfully', result });
                } else {
                    res.status(404).send({ message: 'User not found or no update made' });
                }
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        });

        app.patch('/userDataDesignation/:id', async (req, res) => {
            const id = req.params.id;  
            const { designation } = req.body; 
            
            const filter = { _id: new ObjectId(id) };  
            const updatedDoc = {
                $set: {
                    designation: designation,  
                }
            };
        
            try {
                
                const result = await userCollection.updateOne(filter, updatedDoc);
                
                if (result.modifiedCount === 1) {
                    res.status(200).send({ message: 'User updated successfully', result });
                } else {
                    res.status(404).send({ message: 'User not found or no update made' });
                }
            } catch (error) {
                console.error('Error updating user:', error);
                res.status(500).send({ message: 'Internal server error' });
            }
        });
        
        

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await userCollection.deleteOne(query);
            res.send(result);
        })

        // get newsfeed
        app.get('/newsfeed', async (req, res) => {
            const result = await newsfeedCollection.find().toArray();
            res.send(result)
        })

        // post newsfeed
        app.post('/newsfeed', async (req, res) => {
            const feedData = req.body;
            const result = await newsfeedCollection.insertOne(feedData);
            res.send(result);
        });

        app.delete('/newsfeed/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await newsfeedCollection.deleteOne(query);
            res.send(result);
        });


        // Get all likes
        app.get('/likes', async (req, res) => {
            try {
                const result = await likesCollection.find().toArray();
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Get likes for a specific post
        app.get('/likes/:postId', async (req, res) => {
            try {
                const postId = req.params.postId;
                const likeCount = await likesCollection.countDocuments({ postId });
                res.send({ count: likeCount });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Toggle like for a post
        app.post('/likes', async (req, res) => {
            try {
                const { postId, userId } = req.body;

                // Check if the user has already liked the post
                const existingLike = await likesCollection.findOne({ postId, userId });

                if (existingLike) {
                    // If like exists, remove it (unlike)
                    const result = await likesCollection.deleteOne({ postId, userId });
                    res.send({ action: 'unliked', result });
                } else {
                    // If like doesn't exist, add it
                    const like = {
                        postId,
                        userId,
                        timestamp: new Date()
                    };
                    const result = await likesCollection.insertOne(like);
                    res.send({ action: 'liked', result });
                }
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Check if a user has liked a specific post
        app.get('/likes/:postId/:userId', async (req, res) => {
            try {
                const { postId, userId } = req.params;
                const like = await likesCollection.findOne({ postId, userId });
                res.send({ isLiked: !!like });
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        // Get like counts for multiple posts
        app.post('/likes/counts', async (req, res) => {
            try {
                const { postIds } = req.body;
                const likeCounts = await Promise.all(
                    postIds.map(async (postId) => ({
                        postId,
                        count: await likesCollection.countDocuments({ postId })
                    }))
                );
                res.send(likeCounts);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });



        // Get all comments for a specific post
        app.get('/comments/:postId', async (req, res) => {
            try {
                const postId = req.params.postId;
                const comments = await commentsCollection
                    .find({ postId: postId })
                    .sort({ time: -1 })
                    .toArray();

                res.send(comments);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });

        app.get('/comments', async(req, res)=>{
            const result = await commentsCollection.find().toArray();
            res.send(result);
        })


        app.post('/comments', async (req, res) => {
            try {
                const comment = req.body;


                if (!comment.postId || !comment.userEmail || !comment.userComment) {
                    return res.status(400).send({ error: 'Missing required fields' });
                }


                if (!comment.time) {
                    comment.time = new Date().toISOString();
                }

                const result = await commentsCollection.insertOne(comment);
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });


        app.delete('/comments/:commentId', async (req, res) => {
            try {
                const commentId = req.params.commentId;
                const result = await commentsCollection.deleteOne({ _id: new ObjectId(commentId) });
                res.send(result);
            } catch (error) {
                res.status(500).send({ error: error.message });
            }
        });






        // Get all bookmark items for a specific user
        app.get('/bookmark', async (req, res) => {
            const result = await bookmarkCollection.find().toArray();
            res.send(result);
        });


        // Add a new bookmark item
        app.post('/bookmark', async (req, res) => {
            const bookmark = req.body;
            const result = await bookmarkCollection.insertOne(bookmark);
            res.send(result);
        });

        // Delete a bookmark item by ID
        app.delete('/bookmark/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await bookmarkCollection.deleteOne(query);
            res.send(result);
        });

        // post message
        app.post('/messages', async (req, res) => {
            const messagePayload = req.body;
            const result = await messageCollection.insertOne(messagePayload);
            res.send(result);
        });
        // get message
        app.get('/messages', async (req, res) => {
            const result = await messageCollection.find().toArray();
            res.send(result);
        });

        app.post('/notifications', async (req, res) => {
            const notificationPayload = req.body;
            const result = await notificationCollection.insertOne(notificationPayload);
            res.send(result);
        });

        app.get('/notifications', async (req, res) => {
            const result = await notificationCollection.find().toArray();
            res.send(result);
        });

        app.delete('/notification/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await notificationCollection.deleteOne(query);
            res.send(result);
        });


        app.get('/studentId', async (req, res) => {
            const result = await studentsIdCollection.find().toArray();
            res.send(result);
        })

        app.delete('/studentId/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await studentsIdCollection.deleteOne(query)
            res.send(result);
        })

        app.post('/studentId', async (req, res) => {
            const newStudentId = req.body;
            const result = await studentsIdCollection.insertOne(newStudentId);
            res.send(result);
        })




        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Optionally close the client connection
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('EduSphere is Running');
});

app.listen(port, () => {
    console.log(`EduSphere is Running on Port: ${port}`);
});
// server.listen(port, () => {
//     console.log(`EduSphere is Running on Port: ${port}`);
// });

