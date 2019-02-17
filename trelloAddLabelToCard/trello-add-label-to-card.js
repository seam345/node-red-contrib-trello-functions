const Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloAddLabelToCardNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = this.context();

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);


    this.on('input', function (msg) {
      const cardID = msg.payload.id;
      let idLabel = config.idLabel;
      const ignoreAlreadyExist = config.labelExists;
      let idExist = false; // i am very unsure about doing this
      let labelIDs = [];

      for (let i = 0; i < msg.payload.labels.length; i++) {
        labelIDs.push(msg.payload.labels[i].id);
        if (msg.payload.labels[i].id === idLabel) {
          idExist = true;
        }
      }


      if (ignoreAlreadyExist && idExist) { // this is to make the success output consistent
        node.send({payload: labelIDs})
      } else {
        let sendParameters = {
          value: idLabel
        };

        trello.post('/1/cards/' + cardID + '/idLabels', sendParameters, (err, data) => {

          if (err == null) {
            node.send([{payload: data}, null]);
          } else {
            node.send([null, {payload: err}]);
          }
        });
      }


    })
  }


  RED.nodes.registerType('trelloAddLabelToCard', TrelloAddLabelToCardNode);
};
