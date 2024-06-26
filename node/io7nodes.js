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
            clientId: node.clientid || 'io7_' + RED.util.generateId(),
            password: node.credentials.apiToken,
            clean: true
        };
        let tlsNode = RED.nodes.getNode(config.tls);
        if (tlsNode) {
            tlsNode.addTLSOptions(mqttOptions);
        } else {
            mqttOptions.rejectUnauthorized = false
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
 * Utility function to match a topic against a filter. This was copied from the NodeRED Core MQTT node
 * 
 */
    function matchTopic(ts,t) {
        if (ts == "#") {
            return true;
        } else if(ts.startsWith("$share")){
            ts = ts.replace(/^\$share\/[^#+/]+\/(.*)/g,"$1");
        }
        var re = new RegExp("^"+ts.replace(/([\[\]\?\(\)\\\\$\^\*\.|])/g,"\\$1").replace(/\+/g,"[^/]+").replace(/\/#$/,"(\/.*)?")+"$");
        return re.test(t);
    }
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
            let evt = config.allEvents ? '+' : config.evt;
            let format = config.allFormats ? '+' : config.fmt;
            node.topic=`iot3/${deviceId}/evt/${evt}/fmt/${format}`;
            hubConn.subscribe(
                node.topic,
                {qos: parseInt(config.qos)}
            );
            node.status({
                fill:"green",shape:"dot",text:"node-red:common.status.connected"
            });
        });

        hubConn.on('message', function (topic, message) {
            if (matchTopic(node.topic, topic)) {
                try {
                    if (config.fmt === 'buffer' || config.fmt === 'base64') {
                        node.send({ payload: message, topic: topic, qos: config.qos});
                    } else if (['json', '+'].includes(config.fmt)) {
                        try {
                            node.send({ payload: JSON.parse(message.toString('utf-8')), topic: topic, qos: config.qos });
                        } catch (e) {
                            node.send({ payload: message.toString('utf-8'), topic: topic, qos: config.qos });
                        }
                    } else if (['utf8', 'utf-8'].includes(config.fmt)) {
                        node.send({ payload: message.toString('utf-8'), topic: topic, qos: config.qos });
                    }
                } catch (e) {
                    console.log('Error parsing message: ', e.message);
                }
            }
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
