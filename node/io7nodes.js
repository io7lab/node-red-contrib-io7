/* 
 * io7 hub config node
 */
module.exports = function(RED) {
    let mqtt = require('mqtt')
    let client;


    function io7hub(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        const mqtt_url = `mqtts://${config.host}:${config.port}`;
        client  = mqtt.connect(mqtt_url, {
            username: config.appid,
            clientId: config.appid,
            password: config.token,
            clean: true,
            rejectUnauthorized: false
        });
        client.on('connect', function (topic, message) {
            node.log(`Connected to io7 hub: ${mqtt_url}`);
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
            client.subscribe(`iot3/${config.devid}/evt/${config.evt}/fmt/${config.fmt}`);
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
            client.publish(`iot3/${config.devid}/cmd/${config.evt}/fmt/${config.fmt}`, msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7 out",io7out);
}
