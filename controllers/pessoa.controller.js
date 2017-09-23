var linq = require('../utils/linq.min.js');

module.exports = function(router, graph) {
    // GET
    router.get('/pessoas', obter);
    router.get('/pessoas/:id/seguidos', obterSeguidos);
    router.get('/pessoas/:id/seguidores', obterSeguidores);

    // POST
    router.post('/pessoas', parir); // dá a luz a uma pessoa
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
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {id} AND (a)-[:SEGUE]->(b) RETURN b',
            params: {
                id: +request.params.id
            }
        }, function(error, result) {
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Seguidos de " + id);
        });
    }

    function parir(request, response) {
        var pessoa = request.body;
        graph.cypher({
            query: 'CREATE (a:Pessoa'+buildQueryValues(pessoa)+') return a'            
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
            console.log('POST: Pessoas');
        });
    }

    function obterSeguidores(request, response) {
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {id} AND (b)-[:SEGUE]->(a) RETURN b',
            params: {
                id: +request.params.id
            }
        }, function(error, result) {
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Seguidores de " + id);
        });  
    }

    function seguir(request, response) {
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Pessoa) WHERE ID(a) = {origem} AND ID(b) = {destino} CREATE (a)-[:SEGUE]->(b)',
            params: {
                origem: +request.params.origem,
                destino: +request.params.destino
            }
        }, function(error, result) {
            response.json(200);
            console.log("POST: " + origem + " seguiu " + destino);
        });
    }
}

function buildQueryValues(params) {
    var query = '{';
    for (property in params)
        query = query.concat(property, ':{', property, '},');
    return query.slice(0, query.length-1) + '}';
}

function cypherObjectToResponse(response) {
    var node = response[Object.keys(response)[0]];
    return Object.assign({ 
        id: node._id,
        labels: node.labels
    }, node.properties);
}