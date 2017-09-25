var linq = require('../utils/linq.min.js');

module.exports = function(router, graph) {
    // GET
    router.get('/postagens', obter);

    // POST
    router.post('/pessoas/:pessoa/postagens', postar);
    router.post('/pessoas/:pessoa/reagir/:postagem', reagir);

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
        postagem.data = new Date();
        graph.cypher({
            query: 'MATCH (a:Pessoa) WHERE ID(a) = {pessoa} CREATE (b:Postagem'+buildQueryValues(postagem)+'), (a)-[:POSTA]->(b) RETURN b',
            params: {
                pessao: +request.params.pessoa
            }
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
            console.log("POST: " + postagem.pessoa + " postou");
        });
    }

    function reagir(request, response) {
        var reacao = request.body;
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Postagem) WHERE ID(a) = {pessoa} AND ID(b) = {postagem} CREATE (a)-[c:REAGE'+buildQueryValues(reacao)+']->(b) RETURN c',
            params: {
                pessoa: +request.params.pessoa,
                postagem: +request.params.postagem
            }
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
            console.log("POST: " + request.body.pessoa.id  + " reagiu a " + request.params.id);
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