const Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloUpdateCard(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);

    this.on('input', function (msg) {
      const cardID = msg.payload.id;

      trello.put('/1/cards/' + cardID, msg.payload, (err, data) => {

        if (err == null) {
          node.send([{ payload: data }, null]);
        } else {
          node.send([null, { payload: err }]);
        }
      });
    })
  }


  RED.nodes.registerType('trelloUpdateCard', TrelloUpdateCard);
};
