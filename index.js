const { MongoClient, ServerApiVersion } = require("mongodb");
const cookieParser = require('cookie-parser');
const express = require('express');
const fs = require('fs');
const url = require('url');
const app = express();
app.use(cookieParser());
app.use(express.static('public'));
app.use(express.json());
const path = require('path');
app.set('view engine', 'ejs');

const uri = 'mongodb+srv://madscam505:eUY7fEEdBvhu28BU@treasurehunt.mfetqkj.mongodb.net/test';

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
}
);

async function run() {
    await client.connect();
    app.post('/auth/signup/', async (req, res) => {
        console.log(req.body);
        client
            .db('treasureHunt')
            .collection('users')
            .insertOne({
                token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64'), email: req.body.email, name: req.body.name,
            }, (error, dataInsert) => {
                if (error) res.send({ status: 'error', error: 'Server error please try again later' });
                else if (dataInsert) res.send({ status: 'success', data: `${Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64')}${new Date().getTime()}` });
            });
    });

    app.post('/login/', async (req, res) => {
        if (!client) await reconnect();
        client
            .db('treasureHunt')
            .collection('users')
            .findOne({ token: Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64') }, (errs, data) => {
                if (errs) res.send({ status: 'error', error: 'Server error please try again later' });
                else if (data) res.send({ status: 'success', data: `${Buffer.from(`${req.body.email}-@-${req.body.password}`).toString('base64')}${new Date().getTime()}` });
                else res.send({ status: 'error', error: 'Wrong Email or password' });
            });
    });
    app.get('/:view/', (req, res) => {
        if (fs.existsSync(`${__dirname}/views/normal/${req.params.view}.ejs`)) {
            try {
                res.render(`normal/${req.params.view}`, { url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            } catch (renderError) {
                res.render('normal/404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            }
        } else {
            res.render('normal/404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        }
    });
    app.get('/:type/:view/', (req, res) => {
        if (fs.existsSync(`${__dirname}/views/${req.params.type}/${req.params.view}.ejs`)) {
            try {
                res.render(`${req.params.type}/${req.params.view}`, { url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            } catch (renderError) {
                res.render('normal/404', { error: renderError, url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
            }
        } else {
            res.render('normal/404', { error: 'Page Does Not Exists', url: decodeURI(path.normalize(url.parse(req.url).pathname)) });
        }
    });
    app.get('/*', (req, res) => {
        if (req.cookies.userToken) {
            client
                .db('treasureHunt')
                .collection('users')
                .findOne({ token: req.cookies.userToken }, (err, data) => {
                    res.render('normal/index', { user: data });
                });
        } else { res.render('auth/signup', { user: null }); }
    });

    console.log("Pinged your deployment. You successfully connected to MongoDB!");
    app.listen(process.env.PORT || 5001, () => {
        console.log(`Listening on port ${process.env.PORT || 5001}`);
    });
}
run().catch(console.dir);
