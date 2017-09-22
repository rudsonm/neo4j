var http = require('http');
var neo4j = require('neo4j');
var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var router = express.Router();

app.use(bodyParser.json());

var neo4jConfig = {
  user: 'neo4j',
  password: 'cc150937',
  url: 'localhost:7474'
}
var graph = new neo4j.GraphDatabase('http://'+neo4jConfig.user+':'+neo4jConfig.password+'@'+neo4jConfig.url);

require('./controllers/pessoa.controller.js')(router, graph);
require('./controllers/postagem.controller.js')(router, graph);

app.use('/api', router);

app.listen(1234, function() {
  console.log('Server online on port: 1234');
});