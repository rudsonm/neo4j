var http = require('http');
var neo4j = require('neo4j');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = express.Router();
var linq = require('./linq.min.js');

app.use(bodyParser.json());

var neo4jConfig = {
  user: 'neo4j',
  password: 'cc150937',
  url: 'localhost:7474'
}
var graph = new neo4j.GraphDatabase('http://'+neo4jConfig.user+':'+neo4jConfig.cc150937+'@'+neo4jConfig.url);

function responseBuilder(response) {
  var node = response[Object.keys(response)[0]];
  return Object.assign({ 
    id: node._id,
    labels: node.labels
  }, node.properties);
}

router.get('/pessoas', function(request, response) {
  graph.cypher({
    query: 'MATCH (a:Pessoa) RETURN a'
  }, function(error, result){
    response.json(result.select(x => responseBuilder(x)));
    console.log("GET: Pessoas");
  });  
});

router.get('/pessoas/:id/seguidos', function(request, response) {
  var id = request.params.id;
  graph.cypher({
    query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {id} AND (a)-[:SEGUE]->(b) RETURN b',
    params: {
      id: parseInt(id)
    }
  }, function(error, result) {
    response.json(result.select(x => responseBuilder(x)));
    console.log("GET: Seguidos de " + id);
  });  
});

router.get('/pessoas/:id/seguidores', function(request, response) {
  var id = request.params.id;
  graph.cypher({
    query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {id} AND (b)-[:SEGUE]->(a) RETURN b',
    params: {
      id: parseInt(id)
    }
  }, function(error, result) {
    response.json(result.select(x => responseBuilder(x)));
    console.log("GET: Seguidores de " + id);
  });  
});

router.post('/pessoas', function(request, response) {
  var pessoa = request.body;
  graph.cypher({
    query: 'CREATE (a:Pessoa{ nome: {nome} }) return a',
    params: pessoa
  }, function(error, result) {
    response.json(responseBuilder(result.first()));
    console.log('POST: Pessoas');
  });  
});

router.post('/pessoas/:origem/seguir/:destino', function(request, response) {
  var origem = request.params.origem;
  var destino = request.params.destino;
  graph.cypher({
    query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {origem} AND ID(b) = {destino} CREATE (a)-[:SEGUE]->(b)',
    params: {
      origem: parseInt(origem),
      destino: parseInt(destino)
    }
  }, function(error, result) {
    response.json(200);
    console.log("POST: " + origem + " seguiu " + destino);
  });  
});

router.get('/postagens', function(request, response) {
  graph.cypher({
    query: 'MATCH (a:Postagem) RETURN a'
  }, function(error, result){
    response.json(result.select(x => responseBuilder(x)));
    console.log("GET: Postagens");
  });  
});

router.post('/postagens', function(request, response) {
  var postagem = request.body;
  postagem.pessoa = parseInt(postagem.pessoa.id);
  graph.cypher({
    query: 'MATCH (a:Pessoa) WHERE ID(a) = {pessoa} CREATE (b:Postagem{ titulo: {titulo} }), (a)-[:POSTOU]->(b) RETURN b',
    params: postagem
  }, function(error, result) {
    response.json(responseBuilder(result.first()));
    console.log("POST: " + postagem.pessoa + " postou");
  });  
});

app.use('/api', router);

app.listen(1234, function() {
  console.log('Server online on port: 1234');
});