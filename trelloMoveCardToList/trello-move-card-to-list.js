const Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloMoveCardToList(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = this.context();

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);


    this.on('input', function (msg) {
      const cardID = msg.payload.id;

      // msg.payload.idList = config.idList;


      let sendParameters = {
        id: cardID,
        idList: config.idList
      };

      trello.put('/1/cards/' + cardID, sendParameters, (err, data) => {

        if (err == null) {
          node.send([{payload: data}, null]);
        } else {
          node.send([null, {payload: err}]);
        }
      });


    })
  }


  RED.nodes.registerType('trelloMoveCardToList', TrelloMoveCardToList);
};
