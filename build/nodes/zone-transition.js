"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = (RED) => {
    RED.nodes.registerType('frigate-zone-transition', function (config) {
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.on('input', (msg, send, done) => {
            try {
                console.log('hi');
                var match = true;
                const eventType = msg.payload.type;
                const camera = msg.payload.before.camera;
                const label = msg.payload.before.label;
                const beforeCurrentZones = msg.payload.before.current_zones;
                const beforeEnteredZones = msg.payload.before.entered_zones;
                const afterCurrentZones = msg.payload.after.current_zones;
                const afterEnteredZones = msg.payload.after.entered_zones;
                msg.beforeEnteredZones = beforeEnteredZones;
                msg.afterEnteredZones = afterEnteredZones;
                if (match && (eventType == "new" || eventType == "update")) {
                    match = true;
                }
                else {
                    match = false;
                }
                if (match && config.label) {
                    if (label == config.label) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                if (match && config.camera) {
                    if (camera == config.camera) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                if (match && config.fromZone) {
                    if (config.fromZone == '*' && beforeCurrentZones.length > 0) {
                        match = true;
                    }
                    else if (beforeCurrentZones.indexOf(config.fromZone) >= 0) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                // null fromZone
                if (match && !config.fromZone) {
                    if (beforeCurrentZones.length == 0) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                if (match && config.toZone) {
                    if (config.toZone == '*' && afterCurrentZones.length > 0) {
                        match = true;
                    }
                    else if (afterCurrentZones.indexOf(config.toZone) >= 0) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                // null toZone
                if (match && !config.toZone) {
                    if (afterCurrentZones.length == 0) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                if (match && config.exclusive && config.toZone) {
                    // exclusive flag guarantees that toZone has not been visited yet
                    if (config.exclusive && beforeEnteredZones.indexOf(config.toZone) < 0) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                msg.match = match;
                if (match) {
                    self.send([msg, null]);
                }
                else {
                    self.send([null, msg]);
                }
                done();
            }
            catch (e) {
                self.error(e.message);
                done();
            }
        });
    });
};
//# sourceMappingURL=zone-transition.js.map