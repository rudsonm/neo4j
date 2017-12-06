const fs = require('fs');

module.exports = function(graph) {

  fs.readFile('facebookSan.net', 'utf-8', (error, text) => {
    let splited = text.split("*edges");
    let vertices = splited[0]
                    .match(/"(.*?)"/g)
                    .map(v => decodeURIComponent(escape(eval('"'+v
                        .replace('\"', '')
                        .replace('"', '')
                        .replace('\\\\', '\\')+'"'))));
    let arestas = splited[1]
                    .match(/(\d+)\s(\d+)\s[\d\.]+/g)
                    .map(a => ({
                      origem: a.split(/\s/)[0],
                      destino: a.split(/\s/)[1],
                      peso: a.split(/\s/)[2]
                    }));

    graph.cypher({
      query: 'MATCH (n) DETACH DELETE n'
    }, (error, result) => {
      salvarEmLote(
        vertices.map((v, id) => {
          let email = (v.split(" ")[0] + "_" + v.split(" ")[1] + "_" + id + "@gmail.com").toLowerCase();
          return '(:PESSOA{node_id: '+id+', nome: "'+v+'", email: "'+email+'"})';
        }),
        arestas
      );
    });    
  });

  function salvarEmLote(lote, arestas) {    
    graph.cypher({
      query: "CREATE " + lote.slice(0, 10).join(",")
    }, (error, result) => {
      console.log(lote.length);
      if(lote.length >= 10)
        salvarEmLote(lote.slice(10), arestas);
      else
        salvarArestas(arestas);
    });
  }

  function salvarArestas(arestas) {
    let a = arestas.pop();
    graph.cypher({
      query: "MATCH (a:PESSOA{node_id:"+a.origem+"}), (b:PESSOA{node_id:"+a.destino+"}) CREATE (a)-[:SEGUE]->(b)"
    }, (error, result) => {
      console.log(arestas.length);
      if(arestas.length)
        salvarArestas(arestas);
    });
  }
}