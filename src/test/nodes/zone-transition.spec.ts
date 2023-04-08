import { TestFlows, NodeTestHelper } from "node-red-node-test-helper";
import { Done } from "mocha";
import { NodeMessageInFlow } from "node-red";
import { Assertion, assert } from "chai";
let should = require("should");
// import should from "should";
var zoneTransition = require("../../nodes/zone-transition");

var helper = new NodeTestHelper();
helper.init(require.resolve("node-red"));

// import { assert } from "chai";

describe("frigate-zone-transition Node", () => {
  beforeEach((done?: () => void) => {
    helper.startServer(done);
  });

  afterEach((done?: () => void) => {
    helper.unload();
    helper.stopServer(done);
  });

  it("should be loaded", (done: Done) => {
    let flow = [
      { id: "n1", type: "frigate-zone-transition", name: "zone-transition" }
    ];
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      try {
        n1.should.have.property("name", "zone-transition");
        done();
      } catch (err: any) {
        done(err);
      }
    });
  });
});

describe("frigate-zone-transition Event Type tests", () => {
  beforeEach((done?: () => void) => {
    helper.startServer(done);
  });

  afterEach((done?: () => void) => {
    helper.unload();
    helper.stopServer(done);
  });

  it("should not match end events", (done: Done) => {
    let flow = [
      {
        id: "n",
        type: "frigate-zone-transition",
        name: "zone-transition",
        wires: [["output1"], ["output2"]]
      },
      { id: "output1", type: "helper" },
      { id: "output2", type: "helper" }
    ];

    helper.load(zoneTransition, flow, () => {
      var n = helper.getNode("n");
      var output1 = helper.getNode("output1");
      var output2 = helper.getNode("output2");
      output1.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      output2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n.receive({
        payload: {
          type: "end"
        }
      });
    });
  });

  it("should not match false_positive events", (done: Done) => {
    let flow = [
      {
        id: "n",
        type: "frigate-zone-transition",
        name: "zone-transition",
        wires: [["output1"], ["output2"]]
      },
      { id: "output1", type: "helper" },
      { id: "output2", type: "helper" }
    ];

    helper.load(zoneTransition, flow, () => {
      var n = helper.getNode("n");
      var output1 = helper.getNode("output1");
      var output2 = helper.getNode("output2");
      output1.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      output2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n.receive({
        payload: {
          type: "update",
          before: {
            false_positive: true
          }
        }
      });
    });
  });
});

/**
 * wildcard to wildcard
 */
describe("frigate-zone-transition * -> *", () => {
  beforeEach((done?: () => void) => {
    helper.startServer(done);
  });

  afterEach((done?: () => void) => {
    helper.unload();
    helper.stopServer(done);
  });

  let flow = [
    {
      id: "n1",
      type: "frigate-zone-transition",
      name: "zone-transition",
      wires: [["n2"], ["n3"]],
      fromZone: "*",
      toZone: "*",
      mustExit: true,
      exclusive: true
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" }
  ];

  it("should match when moving from one zone to another", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when current zone does not change", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when first entering zone", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: [],
            entered_zones: []
          },
          after: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          type: "new"
        }
      });
    });
  });

  it("should not match when new zone is not entered", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1", "zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when zone is not exited", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1", "zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should match when zone is not exited but mustExit is false", (done: Done) => {
    flow[0].mustExit = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1", "zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when entering zone not for first time", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1", "zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should match when entering zone not for first time and exclusive flag is false", (done: Done) => {
    flow[0].exclusive = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1", "zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should match when entering multiple new zones", (done: Done) => {
    flow[0].mustExit = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Output sent from wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1", "zone_2", "zone_3"],
            entered_zones: ["zone_1", "zone_2", "zone_3"]
          },
          type: "update"
        }
      });
    });
  });
});

/**
 * wildcard to zone
 */
describe("frigate-zone-transition * -> zone", () => {
  beforeEach((done?: () => void) => {
    helper.startServer(done);
  });

  afterEach((done?: () => void) => {
    helper.unload();
    helper.stopServer(done);
  });

  let flow = [
    {
      id: "n1",
      type: "frigate-zone-transition",
      name: "zone-transition",
      wires: [["n2"], ["n3"]],
      fromZone: "*",
      toZone: "zone_1",
      mustExit: true,
      exclusive: true
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" }
  ];

  it("should match when moving from one zone to zone_1", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when moving from one zone to not zone_1", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_3"],
            entered_zones: ["zone_3", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when moving from one zone to zone_1 while not exiting another zone", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2", "zone_1"],
            entered_zones: ["zone_2", "zone_1"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when before-zones contains toZone", (done: Done) => {
    flow[0].mustExit = false;
    flow[0].exclusive = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_2", "zone_1"],
            entered_zones: ["zone_2", "zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          type: "update"
        }
      });
    });
  });
});

/**
 * zone to wildcard
 */
describe("frigate-zone-transition zone -> *", () => {
  beforeEach((done?: () => void) => {
    helper.startServer(done);
  });

  afterEach((done?: () => void) => {
    helper.unload();
    helper.stopServer(done);
  });

  let flow = [
    {
      id: "n1",
      type: "frigate-zone-transition",
      name: "zone-transition",
      wires: [["n2"], ["n3"]],
      fromZone: "zone_1",
      toZone: "*",
      mustExit: true,
      exclusive: true
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" }
  ];

  it("should match when moving from fromZone to another", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when moving from fromZone to no zone", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: [],
            entered_zones: ["zone_1"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when moving from fromZone not exited", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1", "zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should match when moving from fromZone not exited and mustExit is false", (done: Done) => {
    flow[0].mustExit = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_1", "zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when toZone already visited", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1", "zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should match when toZone already visited and exclusive flag is false", (done: Done) => {
    flow[0].exclusive = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1", "zone_2"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });
});

/**
 * zone to zone
 */
describe("frigate-zone-transition zone -> zone", () => {
  beforeEach((done?: () => void) => {
    helper.startServer(done);
  });

  afterEach((done?: () => void) => {
    helper.unload();
    helper.stopServer(done);
  });

  let flow = [
    {
      id: "n1",
      type: "frigate-zone-transition",
      name: "zone-transition",
      wires: [["n2"], ["n3"]],
      fromZone: "zone_1",
      toZone: "zone_2",
      mustExit: true,
      exclusive: true,
      direct: true
    },
    { id: "n2", type: "helper" },
    { id: "n3", type: "helper" }
  ];

  it("should match when moving from fromZone to toZone", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_1"],
            entered_zones: ["zone_1"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should not match when moving from fromZone to toZone indirectly", (done: Done) => {
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });
      n3.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", false);
          done();
        } catch (err: any) {
          done(err);
        }
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_3"],
            entered_zones: ["zone_1", "zone_3"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_3", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });

  it("should match when moving from fromZone to toZone indirectly and direct is false", (done: Done) => {
    flow[0].direct = false;
    helper.load(zoneTransition, flow, () => {
      var n1 = helper.getNode("n1");
      var n2 = helper.getNode("n2");
      var n3 = helper.getNode("n3");
      n2.on("input", (msg: NodeMessageInFlow) => {
        try {
          msg.should.have.property("match", true);
          done();
        } catch (err: any) {
          done(err);
        }
      });
      n3.on("input", () => {
        done(new Error("Node sent output to wrong port"));
      });

      n1.receive({
        payload: {
          before: {
            id: "1234",
            current_zones: ["zone_3"],
            entered_zones: ["zone_1", "zone_3"]
          },
          after: {
            id: "1234",
            current_zones: ["zone_2"],
            entered_zones: ["zone_1", "zone_3", "zone_2"]
          },
          type: "update"
        }
      });
    });
  });
});
