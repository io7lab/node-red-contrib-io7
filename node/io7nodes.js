/* 
 * io7 hub config node
 */
module.exports = function(RED) {
    let mqtt = require('mqtt')

    function io7hub(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        const mqtt_url = `mqtts://${config.host}:${config.port}`;

        node.hubConn = mqtt.connect(mqtt_url, {
            username: config.apiKey,
            clientId: config.apiKey,
            password: config.apiToken,
            clean: true,
            rejectUnauthorized: false
        });
        node.hubConn.on('connect', function (topic, message) {
            node.log(`Connected to io7 hub: ${mqtt_url} with ${config.apiKey}`);
        });
        node._closeCallbacks.push(function() {
            node.hubConn.end();
        })
    }
    RED.nodes.registerType("io7-hub",io7hub);
/* 
 *
 * io7 in node
 */
    function io7in(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        node.status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});
        let hubConn = RED.nodes.getNode(config.authentication).hubConn;
        node.fmt = ( node.allFormats ) ? '+' : config.fmt;

        hubConn.on('connect', function (topic, message) { hubConn.subscribe(`iot3/${config.devid}/evt/${config.evt}/fmt/${config.fmt}`);
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
        });

        hubConn.on('message', function (topic, message) {
            node.send({payload:JSON.parse(message.toString('utf-8')),topic:topic});
        });
    }
    RED.nodes.registerType("io7 in",io7in);
/* 
 *
 * io7 out node
 */
    function io7out(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        node.status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});

        let hub = RED.nodes.getNode(config.authentication);
        if (hub == null || hub.hubConn == null) {
            return;
        }
        let hubConn = hub.hubConn;

        hubConn.on('connect', function (topic, message) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
        });
        this.on('input', function(msg) {
            msg.payload = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
            hubConn.publish(`iot3/${config.devid}/cmd/${config.cmd}/fmt/${config.fmt}`, msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7 out",io7out);
}
