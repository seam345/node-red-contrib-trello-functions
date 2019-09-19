const Trello = require('node-trello');

module.exports = function (RED) {
  function trelloGetCardMovedListsNode(config) {
    RED.nodes.createNode(this, config);
    const node = this;
    const nodeContext = this.context();

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello = new Trello(credentialNode.apikey, credentialNode.token);
    this.on('input', function (msg) {
      //<editor-fold desc="Initialise all variables">
      const trelloCurrentUserIDSaveString = 'trelloUID';
      const lastFetchedSaveString = 'lastFetched';
      const boardFetchesSaveString = 'boardFetches';
      const safeListBlockListUsers = config.safeListBlockListUsers;
      const filterUserList = config.filterUserList;
      const trelloData = msg.trello || {};
      const boardId = trelloData.idBoard || config.idBoard;
      const excludeSelfCreated = config.excludeUser;
      let trelloCurrentUserID = '';
      try {
        trelloCurrentUserID = nodeContext.get(trelloCurrentUserIDSaveString);
      } catch (e) {
        node.error(e)
      }
      let lastFetched = '';
      try {
        lastFetched = nodeContext.get(lastFetchedSaveString);
      } catch (e) {
        node.error(e)
      }

      let boardFetches = {};
      try {
        boardFetches = nodeContext.get(boardFetchesSaveString);
      } catch (e) {
        node.error(e)
      }
      if (!boardFetches) {
        boardFetches = {};
      }
      if (!lastFetched) {
        if (msg.payload.initialTimeStamp) {
          lastFetched = msg.payload.initialTimeStamp;
          node.warn('Used initialTimeStamp input to set the starting point. This could cause some duplication.');
        }
      }
      //</editor-fold>

      // pre check that we have the current user ID associated with the api key, if not we shall go fetch it.
      // TODO I may want to set a flag if the credentials have changed as that would change the user
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

      function main() {


        if (lastFetched) {
          const triggeredDate = new Date();

          if (boardId) {
            trello.get('/1/boards/' + boardId + '/actions', {since: lastFetched}, (err, data) => {
                  if (err) {
                    node.error(err)
                  } else {
                    outputNewCards(data, lastFetched, triggeredDate);
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
                      let fetchDatetime = lastFetched;
                      if (boardFetches && boardFetches[data[i].id]) {
                        fetchDatetime = boardFetches[data[i].id];
                        if (fetchDatetime !== lastFetched) {
                          node.log('Attempting to recover any missed card movements from ' + data[i].name + ': ' + data[i].id + ' since ' + fetchDatetime)
                        }
                      }


                      trello.get('/1/boards/' + data[i].id + '/actions', {since: fetchDatetime}, (err, data2) => {
                            if (err) {
                              node.error('Failed to retrieve board ' + data[i].name + ': ' + data[i].id + ' shall attempt to recover any missed card movements when next triggered')
                            } else {
                              outputNewCards(data2, lastFetched, triggeredDate);
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
          setLastFetched(new Date(), null);
        }
      }

      function outputNewCards(actionData) {
        for (let i = 0; i < actionData.length; i++) {
          if (actionData[i].data) {
            if (actionData[i].type === 'updateCard') {
              if (checkSafeBlockList(actionData[i])) {
                // Bellow will test if excludeSelfCreated is set, if it wasn't it will just continue, if it was it will
                // check that the user that created the card is not the user who's linked to (owns) the API key
                if (!excludeSelfCreated || !(actionData[i].idMemberCreator === trelloCurrentUserID)) {
                  // Bellow looks for any action data that contains a listAfter and list before key signifying a card has been moved
                  if (actionData[i].data.listAfter && actionData[i].data.listBefore) {  // Is it best to just check for undefined?
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
        }
      }

      function checkSafeBlockList(action) {
        if (safeListBlockListUsers === 'safe') {
          for (let j = 0; j < filterUserList.length; j++) {
            if (action.idMemberCreator === filterUserList[j]) {
              return true;
            }
          }
          return false;
        } else {
          let sendMessage = true;
          for (let j = 0; j < filterUserList.length; j++) {
            if (action.idMemberCreator === filterUserList[j]) {
              sendMessage = false;
              break;
            }
          }
          return sendMessage;
        }
      }

      function setLastFetched(triggeredDate, boardID) {
        nodeContext.set(lastFetchedSaveString, triggeredDate.toISOString()); // Set to triggered time so we can be sure not to miss any

        if (boardID) {
          boardFetches[boardID] = triggeredDate.toISOString();
          nodeContext.set(boardFetchesSaveString, boardFetches);

        }
      }



      getTrelloCurrentUID();




    })
  }


  RED.nodes.registerType('trelloGetCardMovedLists', trelloGetCardMovedListsNode);
};
