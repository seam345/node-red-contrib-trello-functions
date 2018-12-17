const Trello = require('node-trello');

module.exports = function (RED) {
  function TrelloGetNewCardNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = this.context();

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);
    this.on('input', function (msg) {
      const lastFetchedSaveString = 'lastFetched';
      const boardFetchesSaveString = 'boardFetches';
      const trelloData = msg.trello || {};
      const listId = trelloData.idList || config.idList;
      const boardId = trelloData.idBoard || config.idBoard;

      let lastFetchedISO = '';
      try {
        lastFetchedISO = nodeContext.get('lastFetched');
      } catch (e) {
        node.error(e)
      }

      // Board fetches contains a set of last
      let boardFetchesDictISO = {};
      try {
        boardFetchesDictISO = nodeContext.get(boardFetchesSaveString);
      } catch (e) {
        node.error(e)
      }
      if (!boardFetchesDictISO) {  // possibly wasnt saved but returend
        boardFetchesDictISO = {};
      }


      function outputNewCards(actionData) {
        for (let i = 0; i < actionData.length; i++) {
          if (actionData[i].data) {
            if (actionData[i].type === 'createCard') {
              trello.get('/1/cards/' + actionData[i].data.card.id, (err, data) => {
                    if (err) {
                      node.error(err)
                    } else {
                      node.send({payload: data});
                    }
                  }
              );
            }
          }
        }
      }


      function outputNewCardsAndSetLastFetched(cardData, lastFetchedString, triggeredString) {
        const lastFetchedDate = new Date(lastFetchedString);
        const triggeredDate = new Date(triggeredString);
        for (let i = 0; i < cardData.length; i++) {
          const id = cardData[i].id;
          const cardDate = new Date(1000 * parseInt(id.substring(0, 8), 16));
          if (cardDate > lastFetchedDate && cardDate <= triggeredDate) {
            node.send({payload: cardData[i]});
          }
        }
        nodeContext.set('lastFetched', triggeredDate.toString()); // Set to triggered time so we can be sure not to miss any
        node.status({fill: "green", shape: "dot", text: triggeredDate.toISOString().substring(0, 19)});
      }

      function setLastFetched(triggeredDate, boardID) {
        nodeContext.set(lastFetchedSaveString, triggeredDate.toISOString()); // Set to triggered time so we can be sure not to miss any

        if (boardID) {
          boardFetchesDictISO[boardID] = triggeredDate.toISOString();
          nodeContext.set(boardFetchesSaveString, boardFetchesDictISO);

        }
      }

      if (!lastFetchedISO) {
        if (msg.payload.initialTimeStamp) {
          lastFetchedISO = msg.payload.initialTimeStamp;
          node.warn('Used initialTimeStamp input to set the starting point. This could cause some duplication.');
        }
      }


      if (!lastFetchedISO) {
        if (msg.payload.initialTimeStamp) {
          lastFetchedISO = msg.payload.initialTimeStamp;
          node.warn('Used initialTimeStamp input to set the starting point. This could cause some duplication.');
        }
      }

      if (lastFetchedISO) {
        const triggeredString = new Date().toString();
        const triggeredDate = new Date();


        if (listId) {
          trello.get('/1/lists/' + listId + '/actions', {since: lastFetchedISO, before: triggeredDate.toISOString()},
              (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  outputNewCards(data);
                  setLastFetched(triggeredDate, boardId);
                  node.status({fill: "green", shape: "dot", text: triggeredDate.toISOString().substring(0, 19)});
                }
              }
          );
        } else if (boardId) {
          trello.get('/1/boards/' + boardId + '/actions', {since: lastFetchedISO, before: triggeredDate.toISOString()},
              (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  outputNewCards(data);
                  setLastFetched(triggeredDate, boardId);
                  node.status({fill: "green", shape: "dot", text: triggeredDate.toISOString().substring(0, 19)});
                }
              }
          );
        } else {
          trello.get('/1/members/me/boards', (err, data) => {
                if (err) {
                  node.error(err)
                } else {
                  for (let i = 0; i < data.length; i++) {
                    // Here I check to see if any previous boards have been previously missed for any reason, if so I
                    // output a log message to notify the user; of the board missed, when it was last fetched and that
                    // the program shall try again from the last failed attempt.
                    let fetchDatetime = lastFetchedISO;
                    if (boardFetchesDictISO && boardFetchesDictISO[data[i].id]) {
                      fetchDatetime = boardFetchesDictISO[data[i].id];
                      if (fetchDatetime !== lastFetchedISO) {
                        node.log('Attempting to recover any missed card movements from ' + data[i].name + ': ' +
                            data[i].id + ' since ' + fetchDatetime)
                      }
                    }

                    trello.get('/1/boards/' + data[i].id + '/actions', {since: fetchDatetime, before: triggeredDate.toISOString()},
                        (err, dataBoard) => {
                          if (err) {
                            node.error('Failed to retrieve board ' + data[i].name + ': ' + data[i].id +
                                ' shall attempt to recover any missed card movements when next triggered');
                            node.error(err)
                          } else {
                            outputNewCards(dataBoard);
                            setLastFetched(triggeredDate, data[i].id);
                            node.status({fill: "green", shape: "dot", text: triggeredDate.toISOString().substring(0, 19)});
                          }
                        }
                    );
                  }
                }
              }
          );
        }
      } else {
        nodeContext.set('lastFetched', new Date().toString());
      }
    })
  }


  RED.nodes.registerType('trelloGetNewCard', TrelloGetNewCardNode);
};
