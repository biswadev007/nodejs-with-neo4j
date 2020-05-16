const express = require('express');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');

var app = express();

//View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost', neo4j.auth.basic('neo4j', '123456'));
var session = driver.session();

app.get('/', (req, res) => {
    session
        .run('MATCH(n:Movie) RETURN n LIMIT 25')
        .then(result => {
            var movieArray = [];
            result.records.map(item => {
                movieArray.push({
                    id: item._fields[0].identity.low,
                    name: item._fields[0].properties.name
                })
            });
            session
                .run('MATCH(n:Actor) RETURN n LIMIT 25')
                .then(result => {
                    var actorArray = [];
                    result.records.map(item => {
                        actorArray.push({
                            id: item._fields[0].identity.low,
                            name: item._fields[0].properties.name
                        })
                    });
                    res.render('./index', {
                        movies: movieArray,
                        actors: actorArray
                    });
                })
                .catch(err => console.log("Error", err))
        })
        .catch(err => console.log(err));
});

//add movie name
app.post('/movie/add', (req, res)=> {
    var movie = req.body.movie_name;
    session
        .run('CREATE (n: Movie {name: $nameParam}) RETURN n',{nameParam: movie})
        .then(result =>{
            res.redirect('/');
        })
        .catch(err => console.log("Error", err));
});

//add actor name
app.post('/actor/add', (req, res)=> {
    var actor = req.body.actor_name;
    session
        .run('CREATE (n: Actor {name: $nameParam}) RETURN n',{nameParam: actor})
        .then(result =>{
            res.redirect('/');
        })
        .catch(err => console.log("Error", err));
});

//add relation between movie and actor
app.post('/movie/actor/add', (req, res)=> {
    var actor = req.body.actor_name;
    var movie = req.body.movie_name;

    session
        .run('MATCH(a:Actor {name: $nameParam}),(b:Movie {name: $titleParam}) MERGE(a)-[r: ACTED_IN]-(b) RETURN a,b',{nameParam: actor, titleParam: movie})
        .then(result =>{
            res.redirect('/');
        })
        .catch(err => console.log("Error", err));
});

//delete movie
app.post('/movie/delete',(req,res)=> {
    var movie = req.body.movie_name;;
    session
        .run('MATCH (n:Movie {name: $nameParam}) RETURN n', {nameParam: movie})
        .then(result => {
            var message = [];
            if(result){
                session
                    .run('MATCH (n: Movie {name: $nameParam}) DELETE n', {nameParam: movie})
                    .then(result =>{
                        message.push('Delete successful')
                        res.redirect({message: message},'/');
                    })
                    .catch(err => console.log("Error", err));
            }else{
                message.push('Movie not in list')
                res.redirect({message: message},'/');
            }
        })
        .catch(err => console.log("Error", err));
})

app.listen(4000, console.log(`Server listen at PORT 4000`));

module.exports = app;