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
      //################################################################################################################
      // Initialise all variables
      const trelloCurrentUserIDSaveString = 'trelloUID';
      const lastFetchedSaveString = 'lastFetched';
      const boardFetchesSaveString = 'boardFetches';
      const listId = config.idList;
      const boardId = config.idBoard;
      const excludeSelfCreated = config.excludeUser;
      let trelloCurrentUserID = '';
      try {
        trelloCurrentUserID = nodeContext.get(trelloCurrentUserIDSaveString);
      } catch (e) {
        node.error(e)
      }
      let lastFetchedISO = '';
      try {
        lastFetchedISO = nodeContext.get(lastFetchedSaveString);
      } catch (e) {
        node.error(e)
      }
      // Board fetches contains a set of timestamps each board was last fetched
      let boardFetchesDictISO = {};
      try {
        boardFetchesDictISO = nodeContext.get(boardFetchesSaveString);
      } catch (e) {
        node.error(e)
      }
      // The get call doesn't error if empty, it just sets the verible to null so reset it to an empty dict
      if (!boardFetchesDictISO) {
        boardFetchesDictISO = {};
      }

      if (!lastFetchedISO) {
        if (msg.payload.initialTimeStamp) {
          lastFetchedISO = msg.payload.initialTimeStamp;
          node.warn('Used initialTimeStamp input to set the starting point. This could cause some duplication.');
        }
      }

      //################################################################################################################

      // pre check that we have the current user ID associated with the api key, if not we shall go fetch it.
      function getTrelloCurrentUID() {
        if (trelloCurrentUserID) {
          main();
        } else {
          trello.get('/1/members/me', (err, data) => {
            if (err) {
              node.error(err)
            } else {
              trelloCurrentUserID = data.id;
              nodeContext.set(trelloCurrentUserIDSaveString, trelloCurrentUserID); // store for faster access
              main()
            }
          })
        }
      }

      // Main method, called after checking current Trello user ID in getTrelloCurrentUID.
      function main() {
        const triggeredDate = new Date();
        if (lastFetchedISO) {


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
            trello.get('/1/boards/' + boardId + '/actions', {
                  since: lastFetchedISO,
                  before: triggeredDate.toISOString()
                },
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

                      trello.get('/1/boards/' + data[i].id + '/actions', {
                            since: fetchDatetime,
                            before: triggeredDate.toISOString()
                          },
                          (err, dataBoard) => {
                            if (err) {
                              node.error('Failed to retrieve board ' + data[i].name + ': ' + data[i].id +
                                  ' shall attempt to recover any missed card movements when next triggered');
                              node.error(err)
                            } else {
                              outputNewCards(dataBoard);
                              setLastFetched(triggeredDate, data[i].id);
                              node.status({
                                fill: "green",
                                shape: "dot",
                                text: triggeredDate.toISOString().substring(0, 19)
                              });
                            }
                          }
                      );
                    }
                  }
                }
            );
          }
        } else {
          // Set the first last fetched so next time I know the window of time to check for new cards.
          setLastFetched(triggeredDate);
        }
      }

      // Filters action json data and get any cards created, to then be sent as a msg.payload. Called from main.
      function outputNewCards(actionData) {
        for (let i = 0; i < actionData.length; i++) {
          if (actionData[i].data) {
            if (actionData[i].type === 'createCard') {
              // Bellow will test if excludeSelfCreated is set, if it wasn't it will just continue, if it was it will
              // check that the user that created the card is not the user who's linked to (owns) the API key
              if (!excludeSelfCreated || !actionData[i].idMemberCreator === trelloCurrentUserID) {
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
      }

      // Sets last fetched data, Called from main.
      function setLastFetched(triggeredDate, boardID) {
        // Set to triggered time so we can be sure not to miss any
        nodeContext.set(lastFetchedSaveString, triggeredDate.toISOString());

        if (boardID) {
          boardFetchesDictISO[boardID] = triggeredDate.toISOString();
          nodeContext.set(boardFetchesSaveString, boardFetchesDictISO);

        }
      }


      getTrelloCurrentUID();

    })
  }


  RED.nodes.registerType('trelloGetNewCard', TrelloGetNewCardNode);
};
