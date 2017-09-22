var linq = require('../utils/linq.min.js');
var responseHandler = require('../utils/response.handler.js');

module.exports = function(router, graph) {
    // GET
    router.get('/pessoas', obter);
    router.get('/pessoas/:id/seguidos', obterSeguidos);
    router.get('/pessoas/:id/seguidores', obterSeguidores);

    // POST
    router.post('/pessoas', parir);
    router.post('/pessoas/:origem/seguir/:destino', seguir);

    function obter(request, response) {
        graph.cypher({
            query: 'MATCH (a:Pessoa) RETURN a'
        }, function(error, result){
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Pessoas");
        });
    }

    function obterSeguidos(request, response) {
        var id = request.params.id;
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {id} AND (a)-[:SEGUE]->(b) RETURN b',
            params: {
            id: parseInt(id)
            }
        }, function(error, result) {
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Seguidos de " + id);
        });
    }

    function parir(request, response) {
        var pessoa = request.body;
        graph.cypher({
            query: 'CREATE (a:Pessoa{ nome: {nome} }) return a',
            params: pessoa
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
            console.log('POST: Pessoas');
        });
    }

    function obterSeguidores(request, response) {
        var id = request.params.id;
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {id} AND (b)-[:SEGUE]->(a) RETURN b',
            params: {
            id: parseInt(id)
            }
        }, function(error, result) {
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Seguidores de " + id);
        });  
    }

    function seguir(request, response) {
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
    }
}

function cypherObjectToResponse(response) {
    var node = response[Object.keys(response)[0]];
    return Object.assign({ 
        id: node._id,
        labels: node.labels
    }, node.properties);
}