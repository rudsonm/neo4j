var linq = require('../utils/linq.min.js');
var responseHandler = require('../utils/response.handler.js');

module.exports = function(router, graph) {
    // GET
    router.get('/postagens', obter);

    // POST
    router.post('/postagens', postar);

    function obter(request, response) {
        graph.cypher({
            query: 'MATCH (a:Postagem) RETURN a'
        }, function(error, result){
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Postagens");
        });  
    }

    function postar(request, response) {
        var postagem = request.body;
        postagem.pessoa = parseInt(postagem.pessoa.id);
        graph.cypher({
            query: 'MATCH (a:Pessoa) WHERE ID(a) = {pessoa} CREATE (b:Postagem{ titulo: {titulo} }), (a)-[:POSTOU]->(b) RETURN b',
            params: postagem
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
            console.log("POST: " + postagem.pessoa + " postou");
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