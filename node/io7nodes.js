/* 
 * io7 hub config node
 */
module.exports = function(RED) {
    let mqtt = require('mqtt')
    let client;


    function io7hub(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        client  = mqtt.connect('mqtt://' + config.host);
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
        node.status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});
        //node.broker = config.broker;

        client.on('connect', function (topic, message) {
            node.log('hub connected');
            client.subscribe('iot3/abc/evt/+/fmt/+');
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
        });

        const Actions = {
            CONNECT: 'connect',
            DISCONNECT: 'disconnect',
            SUBSCRIBE: 'subscribe',
            UNSUBSCRIBE: 'unsubscribe',
            GETSUBS: 'getSubscriptions',
        };
        const allowableActions = Object.values(Actions);

        node.brokerConn = RED.nodes.getNode(config.hub);
        client.on('message', function (topic, message) {
            node.send({payload:JSON.parse(message.toString('utf-8')),topic:topic});
        });
    }
    RED.nodes.registerType("io7 in",io7in);
/* 
 * io7 out node
 */

    function io7out(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        node.status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});
        client.on('connect', function (topic, message) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
        });
        this.on('input', function(msg) {
            msg.payload = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
            client.publish('iot3/abc/evt/status/fmt/json', msg.payload);
            console.log('io7 =>' + msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7 out",io7out);
}
