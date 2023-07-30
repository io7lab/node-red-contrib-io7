/* 
 * io7 hub config node
 */
module.exports = function(RED) {
    let mqtt = require('mqtt')

    function io7hub(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        const protocol = config.useTLS ? 'mqtts' : 'mqtt';
        const port = config.knownPort ? config.useTLS ? 8883 : 1883 : config.port;
        const mqtt_url = `${protocol}://${config.host}:${port}`;

        let mqttOptions = {
            username: node.credentials.apiKey,
            clientId: node.credentials.apiKey,
            password: node.credentials.apiToken,
            clean: true,
            rejectUnauthorized: true
        };
        let tlsNode = RED.nodes.getNode(config.tls);
        if (tlsNode) {
            tlsNode.addTLSOptions(mqttOptions);
        }  
        node.hubConn = mqtt.connect(mqtt_url, mqttOptions);
        node.hubConn.on('connect', function (topic, message) {
            node.log(`Connected to io7 hub: ${mqtt_url} with ${config.apiKey}`);
        });
        node._closeCallbacks.push(function() {
            node.hubConn.end();
        })
    }
    RED.nodes.registerType("io7-hub",io7hub,{
        credentials: {
            apiKey: {type:"text"},
            apiToken: {type: "password"}
        }
    });
/* 
 *
 * io7 in node
 */
    function io7in(config) {
        RED.nodes.createNode(this,config);
        const node = this;
        node.status({fill:"yellow",shape:"ring",text:"node-red:common.status.connecting"});
        let hubConn = RED.nodes.getNode(config.authentication).hubConn;

        hubConn.on('connect', function (topic, message) {
            let deviceId = config.allDevices ? '+' : config.deviceId;
            let event = config.allEvents ? '+' : config.evt;
            let format = config.allFormats ? '+' : config.fmt;
            hubConn.subscribe(
                `iot3/${deviceId}/evt/${event}/fmt/${format}`,
                {qos: parseInt(config.qos)}
            );
            node.status({
                fill:"green",shape:"dot",text:"node-red:common.status.connected"
            });
        });

        hubConn.on('message', function (topic, message) {
            node.send({payload:JSON.parse(message.toString('utf-8')),topic:topic});
        });

        hubConn.on('error', function (topic, message) {
            node.status({ fill: "red", shape: "ring", text: "node-red:common.status.disconnected" });
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

        this.on('input', function(msg) {
            msg.payload = typeof msg.payload === 'string' ? msg.payload : JSON.stringify(msg.payload);
            hubConn.publish(
                `iot3/${config.deviceId}/cmd/${config.cmd}/fmt/${config.fmt}`,
                msg.payload,
                {
                    qos: parseInt(config.qos), retain: config.retain === "true"
                }
            );
            node.send(msg);
        });

        let hub = RED.nodes.getNode(config.authentication);
        if (hub == null || hub.hubConn == null) {
            return;
        }
        let hubConn = hub.hubConn;

        hubConn.on('connect', function (topic, message) {
            node.status({fill:"green",shape:"dot",text:"node-red:common.status.connected"});
        });
        hubConn.on('error', function (topic, message) {
            node.status({ fill: "red", shape: "ring", text: "node-red:common.status.disconnected" });
        });
    }
    RED.nodes.registerType("io7 out",io7out);
}
