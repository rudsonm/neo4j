var bodyParser = require('body-parser');
var express = require('express');
var neo4j = require('neo4j');

var app = express();
app.use(bodyParser.json());

var neo4jConfig = {
  user: 'neo4j',
  password: 'cc150937',
  url: 'localhost:7474'
}

var graph = new neo4j.GraphDatabase('http://'.concat(
  neo4jConfig.user, ':', neo4jConfig.password, '@', neo4jConfig.url)
);

var router = express.Router();

require('./controllers/pessoa.controller.js')(router, graph);
require('./controllers/postagem.controller.js')(router, graph);

app.use('/api', router);

app.listen(1234, function() {
  console.log('Server online on port: 1234');
});