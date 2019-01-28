const Trello = require('node-trello');

module.exports = function (RED)
{
  function trelloCreateNewCardNode(config)
  {
    RED.nodes.createNode(this, config);
    const node        = this;
    const nodeContext = this.context();

    // Retrieve the config node
    const credentialNode = RED.nodes.getNode(config.trello);
    const trello         = new Trello(credentialNode.apikey, credentialNode.token);


    this.on('input', function (msg)
    {
      //<editor-fold desc="Initialise all variables">
      const cardCount          = msg.payload.newCardsToAdd.length; // todo do check it exits
      let processedCards       = 0;
      const defaultName        = config.defaultName;
      const defaultDesc        = config.defaultDescription;
      const defaultPos         = config.defaultPosition;
      const defaultDue         = config.defaultDue;
      const defaultDueComplete = config.defaultDueComplete;
      const defaultIdList      = config.defaultIdList;
      const defaultIdMembers   = config.defaultIdMembers;
      const defaultIdLabels    = config.defaultIdLabels;
      const defaultUrlSource   = config.defaultUrlSource;


      //</editor-fold>

      // https://api.trello.com/1/cards?
      // name=test
      // &desc=testdesc
      // &pos=pos
      // &due=1995-11-15
      // &dueComplete=false
      // &idList=5
      // &idMembers=1%2C2
      // &idLabels=3%2C4
      // &urlSource=http%3A%2F%2F
      // &fileSource=data%3Atext%2Fcsv%3Bname%3DToggl_projects_2018-10-01_to_2018-10-31.csv%3Bbase64%2C77u%2FQ2xpZW50LFByb2plY3QsUmVnaXN0ZXJlZCB0aW1lLEJpbGxhYmxlIHRpbWUsQW1vdW50ICgpCixndCAxMDAgdHJhY2ssNDk6MjM6MjEsLAo%3D
      // &idCardSource=ad
      // &keepFromSource=all


      function constuctApiRequestParameters(cardToAdd)
      {
        // I scrapped the idea of having a master default object and copying the object after reading this https://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
        let requestParameters = {
          name:        defaultName,
          desc:        defaultDesc,
          pos:         defaultPos,
          due:         defaultDue,
          dueComplete: defaultDueComplete,
          idList:      defaultIdList,
          idMembers:   defaultIdMembers,
          idLabels:    defaultIdLabels,
          urlSource:   defaultUrlSource
        };

        if ( cardToAdd.name )
        {
          requestParameters.name = cardToAdd.name;
        }
        if ( cardToAdd.desc )
        {
          requestParameters.desc = cardToAdd.desc;
        }
        if ( cardToAdd.pos  )
        {
          requestParameters.pos = cardToAdd.pos;
        }
        if ( cardToAdd.due  )
        {
          requestParameters.due = cardToAdd.due;
        }
        // Truthy cannot be used because its valid for this to be set to false so I only check for null or undefined
        if ( cardToAdd.dueComplete != null )
        {
          requestParameters.dueComplete = cardToAdd.dueComplete;
        }
        if ( cardToAdd.idList  )
        {
          requestParameters.idList = cardToAdd.idList;
        }
        if ( cardToAdd.idMembers  )
        {
          requestParameters.idMembers = cardToAdd.idMembers;
        }
        if ( cardToAdd.idLabels )
        {
          requestParameters.idLabels = cardToAdd.idLabels;
        }
        if ( cardToAdd.urlSource )
        {
          requestParameters.urlSource = cardToAdd.urlSource;
        }
        if ( cardToAdd.fileSource )
        {
          requestParameters.fileSource = cardToAdd.fileSource;
        }
        if ( cardToAdd.idCardSource )
        {
          requestParameters.idCardSource = cardToAdd.idCardSource;
        }
        if ( cardToAdd.keepFromSource )
        {
          requestParameters.keepFromSource = cardToAdd.keepFromSource;
        }

        cardToAdd.sentParameters = requestParameters;
        return requestParameters
      }


      function sendRequest(cardToAdd)
      {

        // trello.post('/1/cards', cardToAdd.sentPerameters, (err, data) =>
        trello.post('/1/cards', cardToAdd.sentParameters, (err, data) =>
        {
          processResponce(err, data, cardToAdd);
          // if ( err )
          // {
          //   node.error(err)
          // } else
          // {
          //   trelloCurrentUserID = data.id;
          //   nodeContext.set(trelloCurrentUserIDSaveString, trelloCurrentUserID); // store for faster access
          //   main()
          // }
        })
      }

      function processResponce(err, data, cardToAdd)
      {
        if (err == null)
        {
          cardToAdd.error = false;
          cardToAdd.response = data;
          processedCards++;
        }else
        {
          //todo handle some errors and retry the request, but for now I'm just gonna pass the error
          cardToAdd.error = true;
          cardToAdd.response = err;
          processedCards++;
        }

        if (processedCards === cardCount)
        {
          node.send(msg);
        }
      }


      for (let i = 0; i < msg.payload.newCardsToAdd.length; i++)
      {
        constuctApiRequestParameters(msg.payload.newCardsToAdd[i]);
        sendRequest(msg.payload.newCardsToAdd[i]);

      }
      getTrelloCurrentUID();

    })
  }


  RED.nodes.registerType('trelloCreateNewCard', trelloCreateNewCardNode);
};
