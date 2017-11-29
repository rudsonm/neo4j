var linq = require('../utils/linq.min.js');

module.exports = function(router, graph) {
    // GET
    router.get('/postagens', obter);

    // POST
    router.post('/pessoas/:pessoa/postagens', postar);
    router.post('/pessoas/:pessoa/reagir/:postagem', reagir);    

    // REMOVE
    router.delete('/postagens/:id', remover);

    function obter(request, response) {
        if(Boolean(request.query.pessoa))
            obterPorPessoa(request, response);            
        else
            obterTodas(request, response);
    }

    function obterTodas(request, response) {
        graph.cypher({
            query: 'MATCH (a:Postagem) RETURN a'
        }, function(error, result){
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Postagens");
        });
    }

    function obterPorPessoa(request, response) {        
        var pessoa = +request.query.pessoa;
        var query = [
            'MATCH (a:Pessoa), (b:Pessoa), (p:Postagem) WHERE ID(a) = {pessoa}',
            'AND ( (a)-[:POSTA]->(p) OR ( (a)-[:SEGUE]->(b) AND (b)-[:POSTA]->(p) ) )',
            'RETURN DISTINCT p'
        ];
        graph.cypher({
            query: query.join(' '),
            params: {
                pessoa: pessoa
            }
        }, function(error, result){
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Postagens de " + pessoa);
        });
    }

    function postar(request, response) {
        var postagem = request.body;
        
        postagem.data = new Date();
        postagem.pessoa = +request.params.pessoa;

        if(request.files && request.files['file']) {
            let file = request.files['file'];
            postagem.imagem = 'data:'.concat(file.mimetype, ';base64,', file.data.toString('base64'));
        }        

        graph.cypher({
            query: 'MATCH (a:Pessoa) WHERE ID(a) = {pessoa} CREATE (b:Postagem'+buildQueryValues(postagem)+'), (a)-[:POSTA]->(b) RETURN b',
            params: postagem
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

    function remover(request, response) {
        console.log("Entrou pra remover");
        let id = +request.params.id;
        graph.cypher({
            query: 'MATCH (a:Postagem) WHERE ID(a) = {id} DETACH DELETE a',
            params: {
                id: id
            }
        }, function(error, result) {
            console.log("DELETE: postagem ".concat(id, " removida"))
            response.json(200);
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