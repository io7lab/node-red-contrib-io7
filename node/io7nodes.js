/* 
 * io7 hub config node
 */
module.exports = function(RED) {
    let mqtt = require('mqtt')
    let client  = mqtt.connect('mqtt://192.168.82.77')

    function setUpNode(node, nodeCfg, inOrOut){ 
    };

    function io7hub(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        this.on('input', function(msg) {
            msg.payload = msg.payload + 'qqq';
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7-hub",io7hub);
/* 
 * io7 in node
 */
    function io7in(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        node.broker = config.broker;

        /* interim */client.subscribe('node');
node.log(config.port);

        const Actions = {
            CONNECT: 'connect',
            DISCONNECT: 'disconnect',
            SUBSCRIBE: 'subscribe',
            UNSUBSCRIBE: 'unsubscribe',
            GETSUBS: 'getSubscriptions',
        };
        const allowableActions = Object.values(Actions);

        //node.brokerConn = RED.nodes.getNode(node.broker);
client.on('message', function (topic, message) {
  node.log(message);
  node.send({payload:message});
});
node.log(JSON.stringify(node));
    }
    RED.nodes.registerType("io7 in",io7in);
/* 
 * io7 out node
 */

    function io7out(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        this.on('input', function(msg) {
            msg.payload = JSON.stringify(msg.payload) + 'out';
            client.publish('node', msg.payload);
            console.log('io7 =>' + msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7 out",io7out);
}
