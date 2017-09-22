function cypherObjectToResponse(response) {
    var node = response[Object.keys(response)[0]];
    return Object.assign({ 
        id: node._id,
        labels: node.labels
    }, node.properties);
}