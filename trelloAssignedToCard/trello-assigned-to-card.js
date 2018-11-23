var Trello = require('node-trello');

module.exports = function (RED) {
  function trelloAssignedToCardNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var nodeContext = this.context();

    // Retrieve the config node
    var credentialNode = RED.nodes.getNode(config.trello);
    var trello = new Trello(credentialNode.apikey, credentialNode.token);
    this.on('input', function (msg) {
      const ID_ACCESS_STRING = 'idSet';
      var trelloData = msg.trello || {};
      var listId = trelloData.idList || config.idList;
      var boardId = trelloData.idBoard || config.idBoard;

      var previousIdSet = null;
      try {
        previousIdSet = nodeContext.get(ID_ACCESS_STRING);
      } catch (e) {
        node.error(e)
      }

      // There is no timestamp to say when the user was added so I hold an id set from the previous call and reference that
      function outputNewCardsAndSetLastFetched(cardData, boardId, listId) {
        var previousIdSet = nodeContext.get(ID_ACCESS_STRING);
        var newIdSet = new Set();

        for (let i = 0; i < cardData.length; i++) {
          var id = cardData[i].id;

          if (!previousIdSet.has(id)) {
            if (boardId) {
              if (boardId === cardData[i].idBoard) {
                if (listId) {
                  if (listId === cardData[i].idList) {
                    node.send({payload: cardData[i]});
                  }
                } else { // there is no list id, send out card payload for all newly assigned cards on board
                  node.send({payload: cardData[i]});
                }
              }
            } else { // There is no board id, send out card payload for all newly assigned cards
              node.send({payload: cardData[i]});
            }
          }

          newIdSet.add(id);

        }
        nodeContext.set(ID_ACCESS_STRING, newIdSet);
        node.status({fill: "green", shape: "dot", text: new Date().toISOString().substring(0, 19)});
      }

      if (!previousIdSet) {
        // todo add ability to have a predefined set
      }


      if (previousIdSet) {
        trello.get('/1/members/me/cards', (err, data) => {
              if (err) {
                node.error(err)
              } else {
                outputNewCardsAndSetLastFetched(data, boardId, listId)
              }
            }
        );
      } else {
        trello.get('/1/members/me/cards', (err, data) => {
          if (err) {
            node.error(err)
          } else {
            var newIdSet = new Set();

            for (let i = 0; i < data.length; i++) {
              newIdSet.add(data[i].id);
            }
            nodeContext.set(ID_ACCESS_STRING, newIdSet);
          }
        });
      }
    })
  }


  RED.nodes.registerType('trelloAssignedToCard', trelloAssignedToCardNode);
};