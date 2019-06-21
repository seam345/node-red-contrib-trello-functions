const Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloMeaningfulCardPosition(config) {
    RED.nodes.createNode(this, config);
    const node = this;

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);


    this.on('input', function (msg) {
      function main() {
        const listId = msg.payload.idList;
        const cardPosition = msg.payload.pos;
        trello.get('/1/lists/' + listId + '/cards',
          (err, data) => {
            if (err) {
              node.error(err)
            } else {
              let i;
              for (i = 0; i < data.length; i++) {
                if (data[i].pos > cardPosition) {
                  msg.payload.meaningfulPos = i;
                  if (i === 1) {
                    node.send([msg, msg, null]);

                  } else {
                    node.send([null, msg, null]);

                  }
                  return i;
                }
              }
              msg.payload.meaningfulPos = i;
              node.send([null, msg, msg]);
            }
          }
        );
      }

      main();
    })
  }


  RED.nodes.registerType('trelloMeaningfulCardPosition', TrelloMeaningfulCardPosition);
};
