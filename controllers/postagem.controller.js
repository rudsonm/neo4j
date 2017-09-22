var linq = require('../utils/linq.min.js');

module.exports = function(router, graph) {
    // GET
    router.get('/postagens', obter);

    // POST
    router.post('/postagens', postar);
    router.post('/postagens/:id/curtir', curtir);

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
        postagem.pessoa = +postagem.pessoa.id;
        graph.cypher({
            query: 'MATCH (a:Pessoa) WHERE ID(a) = {pessoa} CREATE (b:Postagem{ titulo: {titulo} }), (a)-[:POSTA]->(b) RETURN b',
            params: postagem
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
            console.log("POST: " + postagem.pessoa + " postou");
        });
    }

    function curtir(request, response) {
        var pessoa = +request.body.pessoa.id;
        var postagem = +request.params.id;
        var reacao = request.body.reacao;
        graph.cypher({
            query: 'MATCH (a:Pessoa), (b:Postagem) WHERE ID(a) = {pessoa} AND ID(b) = {postagem} CREATE (a)-[c:CURTE{ reacao: {reacao} }]->(b) RETURN c',
            params: {
                postagem: postagem,
                reacao: reacao,
                pessoa: pessoa
            }
        }, function(error, result) {
            response.json(cypherObjectToResponse(result.first()));
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