const express = require('express');
const path = require('path');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const port = 3000;

const uri = process.env.MONGODB_URI;
const dbName = process.env.DATABASE_NAME;
let db, votesCollection, voteCount = 0;

async function connectToMongoDB() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log("Connected to MongoDB");
        db = client.db(dbName);
        votesCollection = db.collection('votes');
        const voteData = await votesCollection.findOne({ name: 'voteCount' });
        if (voteData) {
            voteCount = voteData.count;
        } else {
            await votesCollection.insertOne({ name: 'voteCount', count: 0 });
        }
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToMongoDB();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

function getClientInfo(socket) {
    return {
        socketId: socket.id,
        ipAddress: socket.handshake.address,
        connectTime: new Date(socket.handshake.time),
        userAgent: socket.handshake.headers['user-agent'],
        query: socket.handshake.query,
        cookies: socket.handshake.headers.cookie
    };
}

io.on('connection', (socket) => {
    console.log('A user connected');
    const clientInfo = getClientInfo(socket);
    console.log('New connection client info:', clientInfo);

    socket.emit('updateVoteCount', voteCount);

    socket.on('getInitialVoteCount', () => {
        socket.emit('updateVoteCount', voteCount);
    });

    socket.on('vote', async (clientData) => {
        voteCount++;
        await votesCollection.updateOne({ name: 'voteCount' }, { $set: { count: voteCount } });
        const clientInfo = getClientInfo(socket);
        console.log('Vote from client:', { ...clientInfo, ...clientData });
        io.emit('updateVoteCount', voteCount);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected', clientInfo);
    });
});

http.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
