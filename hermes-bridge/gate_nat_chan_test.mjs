// GATE-NAT-CHAN deterministic test (t_6814f849). Run from hermes-bridge dir.
// Env expected: BRIDGE_GATE_HOLD_DIR + BRIDGE_GATE_CHANNELS set by launcher.
import fs from "node:fs";
import { gateForDelivery, CFG, INFO_ONLY_CHANNELS } from "./gate_transport.mjs";

const holdDir = process.env.GATE_TEST_HOLD || CFG.holdDir;
const fixture = fs.readFileSync(process.env.GATE_TEST_FIXTURE, "utf8");
const req = { id: "gatetest-" + process.env.GATE_TEST_TAG, title: "GATE-NAT-CHAN uji", profile: "gsp-test-expert", kind: "oneshot" };

console.log("TAG=" + process.env.GATE_TEST_TAG, "| CFG.channels=" + JSON.stringify(CFG.channels),
  "| INFO_ONLY=" + JSON.stringify([...INFO_ONLY_CHANNELS]), "| holdDir=" + holdDir);
const before = fs.existsSync(holdDir) ? fs.readdirSync(holdDir).filter((f) => f.endsWith(".md") && !f.startsWith("gate-")).length : 0;
const g = await gateForDelivery(req, fixture, (...a) => console.log("LOG:", ...a));
const after = fs.existsSync(holdDir) ? fs.readdirSync(holdDir).filter((f) => f.endsWith(".md") && !f.startsWith("gate-")).length : 0;
console.log("RESULT verdict=" + g.verdict, "held=" + g.held,
  "delivery_identical=" + (g.delivery === fixture),
  "hold_md_before=" + before, "hold_md_after=" + after);
if (g.event) console.log("EVENT:", JSON.stringify(g.event));
