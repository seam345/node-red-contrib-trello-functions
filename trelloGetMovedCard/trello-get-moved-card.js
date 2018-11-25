var Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloGetMovedCardNode(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    var nodeContext = this.context();

    // Retrieve the config node
    var credentialNode = RED.nodes.getNode(config.trello);
    var trello = new Trello(credentialNode.apikey, credentialNode.token);
    this.on('input', function (msg) {
      var trelloData = msg.trello || {};
      var listId = trelloData.idList || config.idList;
      var boardId = trelloData.idBoard || config.idBoard;

      var lastFetched = '';
      try {
        lastFetched = nodeContext.get('lastFetched');
      } catch (e) {
        node.error(e)
      }

      function outputNewCardsAndSetLastFetched(actionData, lastFetchedString, triggeredString) {
        node.warn(actionData);
        // var lastFetchedDate = new Date(lastFetchedString);
        var triggeredDate = new Date(triggeredString);
        for (let i = 0; i < actionData.length; i++) {


          if (actionData[i].data)
          {
            if (actionData[i].data.listAfter && actionData[i].data.listBefore){
              node.send({payload: actionData[i]}); // todo get card
            }

          }

        }
        nodeContext.set('lastFetched', triggeredDate.toISOString()); // Set to triggered time so we can be sure not to miss any
        node.status({fill: "green", shape: "dot", text: triggeredDate.toISOString().substring(0, 19)});
      }

      if (!lastFetched) {
        if (msg.payload.initialTimeStamp) {
          lastFetched = msg.payload.initialTimeStamp; // todo output message that it used the initial time stamp
        }
      }


      if (lastFetched) {
        var triggeredString = new Date().toISOString();
        if (boardId) {
          node.warn(lastFetched);
          trello.get('/1/boards/' + boardId + '/actions', { since: lastFetched }, (err, data) => {  //todo add
                if (err) {
                  node.error(err)
                } else {
                  outputNewCardsAndSetLastFetched(data, lastFetched, triggeredString)
                }
              }
          );
        } else {
          trello.get('/1/members/me/boards', (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  for (let i = 0; i < data.length; i++) {
                    trello.get('/1/boards/' + data[i].id + '/actions', { since: lastFetched }, (err, data2) => {
                          if (err) {
                            // todo should ouptu to user possible missed cards between lastFetched and triggeredString
                            node.error(err)
                          } else {
                            outputNewCardsAndSetLastFetched(data2, lastFetched, triggeredString)
                          }
                        }
                    );
                  }
                }
              }
          );
        }
      } else {
        nodeContext.set('lastFetched', new Date().toISOString());
      }
    })
  }


  RED.nodes.registerType('trelloGetMovedCard', TrelloGetMovedCardNode);
};
