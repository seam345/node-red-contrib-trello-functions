module.exports = function (RED) {
  function TrelloIfCardInListNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;


    this.on('input', function (msg) {
      //<editor-fold desc="Initialise all variables">
      const listId = config.idList;

      if (msg.payload.idList === listId) {
        node.send([msg, null]);
      } else {
        node.send([null, msg]);
      }

    })
  }


  RED.nodes.registerType('trelloIfCardInList', TrelloIfCardInListNode);
};
