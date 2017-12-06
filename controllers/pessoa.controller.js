const linq = require('../utils/linq.min.js');
const fs = require('fs');

module.exports = function(router, graph) {
    // GET
    router.get('/pessoas', obter);
    router.get('/pessoas/:id/seguidos', obterSeguidos);
    router.get('/pessoas/:id/seguidores', obterSeguidores);
    router.get('/pessoas/:id/avatar', obterImagem);

    // POST
    router.post('/pessoas', parir); // dá a luz a uma pessoa
    router.post('/pessoas/:origem/seguir/:destino', seguir);
    router.post('/pessoas/:id/avatar', uploadImage);

    // DELETE
    router.delete('/pessoas/:origem/seguir/:destino', deseguir);

    function obter(request, response) {
        var query = `MATCH (a:PESSOA) WHERE 1 = 1`;
        
        if(Boolean(request.query.email))
            query = query.concat(' AND a.email = {email}');
        if(Boolean(request.query.senha))
            query = query.concat(' AND a.senha = {senha}');
        if(Boolean(request.query.nome))
            query = query.concat(' AND toUpper(a.nome) CONTAINS toUpper({nome})');

        query = query.concat(' RETURN a');
        graph.cypher({
            query: query,
            params: request.query
        }, function(error, result) {
            response.json((Boolean(result) ? result.select(x => cypherObjectToResponse(x)) : []));
            console.log("GET: Pessoas");
        });
    }

    function obterSeguidos(request, response) {        
        graph.cypher({
            query: 'MATCH (a:PESSOA), (b:PESSOA) WHERE ID(a) = {id} AND (a)-[:SEGUE]->(b) RETURN b',
            params: {
                id: +request.params.id
            }
        }, function(error, result) {
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Seguidos de " + request.params.id);
        });
    }

    function parir(request, response) {
        var pessoa = request.body;
        graph.cypher({
            query:  'CREATE (a:PESSOA'+buildQueryValues(pessoa)+') return a',
            params: pessoa
        }, function(error, result) {
            response.json((Boolean(result) ? cypherObjectToResponse(result.first()) : {}));
            console.log('POST: Pessoas');
        });
    }

    function obterSeguidores(request, response) {
        graph.cypher({
            query: 'MATCH (a:PESSOA), (b:PESSOA) WHERE ID(a) = {id} AND (b)-[:SEGUE]->(a) RETURN b',
            params: {
                id: +request.params.id
            }
        }, function(error, result) {
            response.json(result.select(x => cypherObjectToResponse(x)));
            console.log("GET: Seguidores de " + request.params.id);
        });  
    }

    function seguir(request, response) {
        var origem = +request.params.origem;
        var destino = +request.params.destino;
        graph.cypher({
            query: 'MATCH (a:PESSOA), (b:PESSOA) WHERE ID(a) = {origem} AND ID(b) = {destino} CREATE (a)-[:SEGUE]->(b)',
            params: {
                origem: origem,
                destino: destino
            }
        }, function(error, result) {
            response.json(200);
            console.log("POST: " + origem + " seguiu " + destino);
        });
    }

    function deseguir(request, response) {
        let origem = +request.params.origem;
        let destino = +request.params.destino;
        graph.cypher({
            query: "MATCH (a:PESSOA), (b:PESSOA), (a)-[c:SEGUE]->(b) WHERE ID(a) = {origem} AND ID(b) = {destino} DELETE c",
            params: {
                origem: origem,
                destino: destino
            }
        }, (error, result) => {
            response.json(200);
        });
    }

    function uploadImage(request, response) {
        if (!request.files)
            return response.status(400).send('Nenhum arquivo foi enviado.');
        
        let id = +request.params.id;
        let file = request.files['file'];
        let buffer = 'data:'.concat(file.mimetype, ';base64,', file.data.toString('base64'));

        graph.cypher({
            query: 'MATCH (a:PESSOA) WHERE ID(a) = {id} SET a.avatar = {image}',
            params: {
                id: id,
                image: buffer
            }
        }, function(error, result) {
            if(error)
                throw error;
            else
                response.status(200).send('Avatar definido com sucesso.');
            console.log("PUT: Upload avatar de ".concat(id));
        });
    }

    function obterImagem(request, response) {        
        let id = +request.params.id;
        graph.cypher({
            query: 'MATCH (a:PESSOA) WHERE ID(a) = {id} RETURN a.avatar',
            params: {
                id: id
            }
        }, function(error, result) {
            response.send(result["0"]["a.avatar"]);
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