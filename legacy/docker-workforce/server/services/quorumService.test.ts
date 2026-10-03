import { describe, expect, it } from "vitest";
import {
  createConfirmation,
  generateNodeIdentity,
  verifyThreeNodeQuorum,
  type CriticalOperation,
} from "./quorumService";

describe("three-node 2-of-3 quorum protocol", () => {
  const operation: CriticalOperation = {
    operationId: "op-001",
    tenantId: 7,
    operationType: "publish_schedule",
    payload: { shiftIds: [10, 11], actorId: 42 },
    createdAt: "2026-08-18T10:00:00.000Z",
    expiresAt: "2026-08-18T10:05:00.000Z",
  };

  it("accepts two independent valid confirmations from a configured three-node set", () => {
    const nodes = ["node-1", "node-2", "node-3"].map((nodeId) => {
      const pair = generateNodeIdentity(nodeId, "ed25519");
      return { identity: pair.identity, confirmation: createConfirmation(operation, pair.identity, pair.privateKeyPem) };
    });

    const result = verifyThreeNodeQuorum(operation, nodes.slice(0, 2).map((node) => node.confirmation), nodes.map((node) => node.identity));

    expect(result.accepted).toBe(true);
    expect(result.required).toBe(2);
    expect(result.validConfirmations).toEqual(["node-1", "node-2"]);
  });

  it("rejects a modified payload even when the signature belongs to a known node", () => {
    const nodes = ["node-1", "node-2", "node-3"].map((nodeId) => {
      const pair = generateNodeIdentity(nodeId, "ed25519");
      return { identity: pair.identity, confirmation: createConfirmation(operation, pair.identity, pair.privateKeyPem) };
    });
    const modified = { ...operation, payload: { shiftIds: [999], actorId: 42 } };

    const result = verifyThreeNodeQuorum(modified, nodes.slice(0, 2).map((node) => node.confirmation), nodes.map((node) => node.identity));

    expect(result.accepted).toBe(false);
    expect(result.rejectedConfirmations.filter((item) => item.reason === "payload_mismatch")).toHaveLength(2);
  });

  it("does not accept a two-node configuration even with valid confirmations", () => {
    const first = generateNodeIdentity("node-1", "ecdsa-p256");
    const second = generateNodeIdentity("node-2", "ed25519");
    const confirmations = [
      createConfirmation(operation, first.identity, first.privateKeyPem),
      createConfirmation(operation, second.identity, second.privateKeyPem),
    ];

    const result = verifyThreeNodeQuorum(operation, confirmations, [first.identity, second.identity]);

    expect(result.accepted).toBe(false);
    expect(result.rejectedConfirmations[0]?.reason).toBe("three_distinct_nodes_and_two_of_three_required");
  });

  it("does not count duplicate or unknown nodes toward quorum", () => {
    const first = generateNodeIdentity("node-1", "ecdsa-p256");
    const second = generateNodeIdentity("node-2", "ed25519");
    const third = generateNodeIdentity("node-3", "ed25519");
    const unknown = generateNodeIdentity("node-x", "ed25519");
    const confirmations = [
      createConfirmation(operation, first.identity, first.privateKeyPem),
      createConfirmation(operation, first.identity, first.privateKeyPem),
      createConfirmation(operation, unknown.identity, unknown.privateKeyPem),
      createConfirmation(operation, second.identity, second.privateKeyPem),
    ];

    const result = verifyThreeNodeQuorum(operation, confirmations, [first.identity, second.identity, third.identity]);

    expect(result.accepted).toBe(true);
    expect(result.validConfirmations).toEqual(["node-1", "node-2"]);
    expect(result.rejectedConfirmations.map((item) => item.reason)).toEqual(["duplicate_node", "unknown_node"]);
  });
});
