const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const redis = require("redis");
const searchRoute = require('./routes/searchRoute');
const mediaInfoRoute = require('./routes/mediaInfoRoute');
const mediasByParamsRoute = require('./routes/mediasByParamsRoute');
const newsRoute = require('./routes/newsRoute');
const mediaEpisodesRoute = require('./routes/mediaEpisodesRoute');
const imdbRoute = require('./routes/imdbRoute');
const mediaChaptersRoute = require('./routes/mediaChaptersRoute');

dotenv.config();

const redisClient = redis.createClient({
    url: `rediss://${process.env.REDIS_USERNAME}:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
});

(async () => {

    console.log("#### -> Connecting to Redis...");

    redisClient.on("error", (err) => {
        console.error("#### -> Redis Client Error! ", err);
    })

    redisClient.on("ready", () => {
        console.log("#### -> Redis Client is ready!");
    })

    await redisClient.connect();
    await redisClient.ping()

})()

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CORS_ORIGIN || '*'
}));
app.use(express.json());

app.use((req, res, next) => {
    req.redisClient = redisClient;
    next();
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the AniProject API Server!' });
});

app.use("/search", searchRoute)
app.use("/media-info", mediaInfoRoute)
app.use("/medias", mediasByParamsRoute)
app.use("/episodes", mediaEpisodesRoute)
app.use("/chapters", mediaChaptersRoute)
app.use("/news", newsRoute)
app.use("/imdb", imdbRoute)

app.listen(port, () => {
    console.log(`#### -> Starting AniProject API Server...`);
    console.log(`#### -> Environment: Production`);
    console.log(`#### -> Server is live!`);
    console.log(`#### -> Listening on port: ${port}`);
});
