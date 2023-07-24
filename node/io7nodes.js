module.exports = function(RED) {
    function setUpNode(node, nodeCfg, inOrOut){ 
    };

    function io7function(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();
            msg.payload = msg.payload + 'qqq';
console.log('io7node =>' + msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7node",io7function);

    function io7in(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();
            msg.payload = msg.payload + 'in';
console.log('io7node =>' + msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7node in",io7in);

    function io7out(config) {
        RED.nodes.createNode(this,config);
        var node = this;
        this.on('input', function(msg) {
            msg.payload = msg.payload.toLowerCase();
            msg.payload = msg.payload + 'out';
console.log('io7node =>' + msg.payload);
            node.send(msg);
        });
    }
    RED.nodes.registerType("io7node out",io7out);

}
