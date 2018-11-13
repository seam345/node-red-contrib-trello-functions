module.exports = function (RED) {

// credentials
  function TrelloNode(config) {
    RED.nodes.createNode(this, config);
    this.apikey = config.apikey;
    this.token = config.token;
    console.log(RED._("trelloCredentials.label.create"));
  }
  RED.nodes.registerType('trelloCredentials', TrelloNode);
}
;