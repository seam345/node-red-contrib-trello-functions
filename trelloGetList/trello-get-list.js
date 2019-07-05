const Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloGetListNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = this.context();

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);


    this.on('input', function (msg) {
      //<editor-fold desc="Initialise all variables">
      const listId = config.idList;
      const outputAllCardsAsArray = config.outputAsArray;

      //</editor-fold>


      // Main method, called after checking current Trello user ID in getTrelloCurrentUID.
      function main() {
        if (listId) {
          trello.get('/1/lists/' + listId + '/cards', {},
            (err, data) => {
              if (err) {
                node.error(err)
              } else {
                if (!outputAllCardsAsArray) { // output for each card
                  for (let i = 0; i < data.length; i++) {
                    node.send({payload: data[i]});
                  }
                } else { // output array of cards
                  node.send({payload: data});
                }
              }
            }
          );
        }
      }



      main();

    })
  }


  RED.nodes.registerType('trelloGetList', TrelloGetListNode);
};
