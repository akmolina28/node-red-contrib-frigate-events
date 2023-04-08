import nodeRed, { NodeAPI } from "node-red";

module.exports = (RED: NodeAPI) => {
  RED.nodes.registerType(
    "frigate-zone-transition",
    function (this: any, config: any) {
      const self = this;
      self.config = config;

      RED.nodes.createNode(this, config);

      self.on("input", (msg: any, send: () => any, done: () => any) => {
        try {
          var match = true;

          const eventType: string = msg.payload.type;

          const camera: string = msg.payload.before?.camera;
          const label: string = msg.payload.before?.label;

          const beforeCurrentZones: string[] =
            msg.payload.before?.current_zones;
          const beforeEnteredZones: string[] =
            msg.payload.before?.entered_zones;

          const afterCurrentZones: string[] = msg.payload.after?.current_zones;
          const afterEnteredZones: string[] = msg.payload.after?.entered_zones;

          let newlyEnteredZones: string[] = [];
          for (let i = 0; i < afterCurrentZones?.length; i++) {
            if (beforeCurrentZones.indexOf(afterCurrentZones[i]) < 0) {
              newlyEnteredZones.push(afterCurrentZones[i]);
            }
          }

          let exitedZones: string[] = [];
          for (let i = 0; i < beforeCurrentZones?.length; i++) {
            if (afterCurrentZones.indexOf(beforeCurrentZones[i]) < 0) {
              exitedZones.push(beforeCurrentZones[i]);
            }
          }

          if (match && (eventType == "new" || eventType == "update")) {
            match = true;
          } else {
            match = false;
          }

          if (
            msg.payload.before?.false_positive ||
            msg.payload.after?.false_positive
          ) {
            match = false;
          }

          if (match && config.label) {
            if (label == config.label) {
              match = true;
            } else {
              match = false;
            }
          }

          if (match && config.camera) {
            if (camera == config.camera) {
              match = true;
            } else {
              match = false;
            }
          }

          if (match && config.fromZone) {
            if (config.fromZone == "*" && beforeCurrentZones.length > 0) {
              match = true;
            } else if (
              config.direct &&
              beforeCurrentZones.indexOf(config.fromZone) >= 0
            ) {
              match = true;
            } else if (
              !config.direct &&
              beforeEnteredZones.indexOf(config.fromZone) >= 0
            ) {
              match = true;
            } else {
              match = false;
            }
          }

          // null fromZone
          if (match && !config.fromZone) {
            if (beforeCurrentZones.length == 0) {
              match = true;
            } else {
              match = false;
            }
          }

          if (match && config.toZone) {
            if (config.toZone == "*" && afterCurrentZones.length > 0) {
              match = true;
            } else if (afterCurrentZones.indexOf(config.toZone) >= 0) {
              match = true;
            } else {
              match = false;
            }
          }

          // ensure beforeCurrentZones does not contain toZone
          if (
            match &&
            config.toZone &&
            beforeCurrentZones.indexOf(config.toZone) >= 0
          ) {
            match = false;
          }

          // null toZone
          if (match && !config.toZone) {
            if (afterCurrentZones.length == 0) {
              match = true;
            } else {
              match = false;
            }
          }

          // exclusive flag guarantees that toZone has not been visited yet
          if (match && config.exclusive && config.toZone) {
            if (config.toZone == "*") {
              // check all newly entered zones to see if any have not been visited yet
              match =
                newlyEnteredZones.filter(
                  (n) => beforeEnteredZones.indexOf(n) < 0
                ).length > 0;
            } else {
              if (
                config.exclusive &&
                beforeEnteredZones.indexOf(config.toZone) < 0
              ) {
                match = true;
              } else {
                match = false;
              }
            }
          }

          if (match && config.fromZone && config.mustExit) {
            if (config.fromZone == "*") {
              // make sure any zone was exited
              match = exitedZones.length > 0;
            } else if (config.direct) {
              // make sure fromZone was exited
              match = exitedZones.indexOf(config.fromZone) >= 0;
            } else {
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
          } else {
            self.send([null, msg]);
          }
          done();
        } catch (e: any) {
          self.error(e.message);
          done();
        }
      });
    }
  );
};
