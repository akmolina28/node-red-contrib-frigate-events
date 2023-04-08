"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = (RED) => {
    RED.nodes.registerType("frigate-zone-transition", function (config) {
        const self = this;
        self.config = config;
        RED.nodes.createNode(this, config);
        self.on("input", (msg, send, done) => {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            try {
                var match = true;
                const eventType = msg.payload.type;
                const camera = (_a = msg.payload.before) === null || _a === void 0 ? void 0 : _a.camera;
                const label = (_b = msg.payload.before) === null || _b === void 0 ? void 0 : _b.label;
                const beforeCurrentZones = (_c = msg.payload.before) === null || _c === void 0 ? void 0 : _c.current_zones;
                const beforeEnteredZones = (_d = msg.payload.before) === null || _d === void 0 ? void 0 : _d.entered_zones;
                const afterCurrentZones = (_e = msg.payload.after) === null || _e === void 0 ? void 0 : _e.current_zones;
                const afterEnteredZones = (_f = msg.payload.after) === null || _f === void 0 ? void 0 : _f.entered_zones;
                let newlyEnteredZones = [];
                for (let i = 0; i < (afterCurrentZones === null || afterCurrentZones === void 0 ? void 0 : afterCurrentZones.length); i++) {
                    if (beforeCurrentZones.indexOf(afterCurrentZones[i]) < 0) {
                        newlyEnteredZones.push(afterCurrentZones[i]);
                    }
                }
                let exitedZones = [];
                for (let i = 0; i < (beforeCurrentZones === null || beforeCurrentZones === void 0 ? void 0 : beforeCurrentZones.length); i++) {
                    if (afterCurrentZones.indexOf(beforeCurrentZones[i]) < 0) {
                        exitedZones.push(beforeCurrentZones[i]);
                    }
                }
                if (match && (eventType == "new" || eventType == "update")) {
                    match = true;
                }
                else {
                    match = false;
                }
                if (((_g = msg.payload.before) === null || _g === void 0 ? void 0 : _g.false_positive) ||
                    ((_h = msg.payload.after) === null || _h === void 0 ? void 0 : _h.false_positive)) {
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
                    if (config.fromZone == "*" && beforeCurrentZones.length > 0) {
                        match = true;
                    }
                    else if (config.direct &&
                        beforeCurrentZones.indexOf(config.fromZone) >= 0) {
                        match = true;
                    }
                    else if (!config.direct &&
                        beforeEnteredZones.indexOf(config.fromZone) >= 0) {
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
                    if (config.toZone == "*" && afterCurrentZones.length > 0) {
                        match = true;
                    }
                    else if (afterCurrentZones.indexOf(config.toZone) >= 0) {
                        match = true;
                    }
                    else {
                        match = false;
                    }
                }
                // ensure beforeCurrentZones does not contain toZone
                if (match &&
                    config.toZone &&
                    beforeCurrentZones.indexOf(config.toZone) >= 0) {
                    match = false;
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
                // exclusive flag guarantees that toZone has not been visited yet
                if (match && config.exclusive && config.toZone) {
                    if (config.toZone == "*") {
                        // check all newly entered zones to see if any have not been visited yet
                        match =
                            newlyEnteredZones.filter((n) => beforeEnteredZones.indexOf(n) < 0).length > 0;
                    }
                    else {
                        if (config.exclusive &&
                            beforeEnteredZones.indexOf(config.toZone) < 0) {
                            match = true;
                        }
                        else {
                            match = false;
                        }
                    }
                }
                if (match && config.fromZone && config.mustExit) {
                    if (config.fromZone == "*") {
                        // make sure any zone was exited
                        match = exitedZones.length > 0;
                    }
                    else if (config.direct) {
                        // make sure fromZone was exited
                        match = exitedZones.indexOf(config.fromZone) >= 0;
                    }
                    else {
                        match = afterCurrentZones.indexOf(config.fromZone) < 0;
                    }
                }
                if (match && config.fromZone == "*" && config.toZone == "*") {
                    // ensure an after-zone was actually entered
                    // check all the after-zones for one that is not listed as a before-zone
                    match = false;
                    for (let i = 0; i < afterCurrentZones.length; i++) {
                        if (beforeCurrentZones.indexOf(afterCurrentZones[i]) < 0) {
                            match = true;
                            break;
                        }
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