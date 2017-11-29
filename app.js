const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const express = require('express');
const neo4j = require('neo4j');

var app = express();
app.use(bodyParser.json());
app.use(fileUpload());

const neo4jConfig = {
  user: 'neo4j',
  password: 'cc150937',
  url: 'localhost:7474'
}

var graph = new neo4j.GraphDatabase('http://'.concat(
  neo4jConfig.user, ':', neo4jConfig.password, '@', neo4jConfig.url)
);

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, User-Agent");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
});

var router = express.Router();

require('./controllers/pessoa.controller.js')(router, graph);
require('./controllers/postagem.controller.js')(router, graph);

app.use('/api', router);

app.listen(1234, function() {
  console.log('Server online on port: 1234');
});