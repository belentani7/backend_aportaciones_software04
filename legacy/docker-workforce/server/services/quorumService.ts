import {
  createHash,
  createPrivateKey,
  createPublicKey,
  createSign,
  createVerify,
  generateKeyPairSync,
  sign,
  verify,
  type KeyObject,
} from "node:crypto";

export type QuorumAlgorithm = "ed25519" | "ecdsa-p256";

export interface QuorumNodeIdentity {
  nodeId: string;
  algorithm: QuorumAlgorithm;
  publicKeyPem: string;
}

export interface CriticalOperation {
  operationId: string;
  tenantId: number;
  operationType: string;
  payload: Record<string, unknown>;
  createdAt: string;
  expiresAt: string;
}

export interface QuorumConfirmation {
  nodeId: string;
  algorithm: QuorumAlgorithm;
  operationId: string;
  payloadDigest: string;
  confirmedAt: string;
  signatureBase64: string;
}

export interface QuorumResult {
  accepted: boolean;
  required: number;
  validConfirmations: string[];
  rejectedConfirmations: Array<{ nodeId: string; reason: string }>;
  payloadDigest: string;
}

export function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function digestOperation(operation: CriticalOperation): string {
  return createHash("sha256").update(canonicalize(operation)).digest("hex");
}

export function generateNodeIdentity(nodeId: string, algorithm: QuorumAlgorithm = "ed25519"): { identity: QuorumNodeIdentity; privateKeyPem: string } {
  const pair = algorithm === "ed25519"
    ? generateKeyPairSync("ed25519", { publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } })
    : generateKeyPairSync("ec", { namedCurve: "prime256v1", publicKeyEncoding: { type: "spki", format: "pem" }, privateKeyEncoding: { type: "pkcs8", format: "pem" } });

  return {
    identity: { nodeId, algorithm, publicKeyPem: pair.publicKey },
    privateKeyPem: pair.privateKey,
  };
}

function keyFromPem(pem: string, type: "private" | "public"): KeyObject {
  return type === "private" ? createPrivateKey(pem) : createPublicKey(pem);
}

function signDigest(digest: string, privateKeyPem: string, algorithm: QuorumAlgorithm): Buffer {
  const data = Buffer.from(digest, "hex");
  if (algorithm === "ed25519") return sign(null, data, keyFromPem(privateKeyPem, "private"));
  const signer = createSign("SHA256");
  signer.update(data);
  signer.end();
  return signer.sign(keyFromPem(privateKeyPem, "private"));
}

function verifyDigest(digest: string, signature: Buffer, publicKeyPem: string, algorithm: QuorumAlgorithm): boolean {
  const data = Buffer.from(digest, "hex");
  if (algorithm === "ed25519") return verify(null, data, keyFromPem(publicKeyPem, "public"), signature);
  const verifier = createVerify("SHA256");
  verifier.update(data);
  verifier.end();
  return verifier.verify(keyFromPem(publicKeyPem, "public"), signature);
}

export function createConfirmation(operation: CriticalOperation, identity: QuorumNodeIdentity, privateKeyPem: string): QuorumConfirmation {
  const payloadDigest = digestOperation(operation);
  return {
    nodeId: identity.nodeId,
    algorithm: identity.algorithm,
    operationId: operation.operationId,
    payloadDigest,
    confirmedAt: new Date().toISOString(),
    signatureBase64: signDigest(payloadDigest, privateKeyPem, identity.algorithm).toString("base64"),
  };
}

export function verifyConfirmation(operation: CriticalOperation, confirmation: QuorumConfirmation, identity: QuorumNodeIdentity, now = new Date()): { valid: boolean; reason?: string } {
  const expectedDigest = digestOperation(operation);
  if (confirmation.operationId !== operation.operationId) return { valid: false, reason: "operation_mismatch" };
  if (confirmation.nodeId !== identity.nodeId) return { valid: false, reason: "node_mismatch" };
  if (confirmation.algorithm !== identity.algorithm) return { valid: false, reason: "algorithm_mismatch" };
  if (confirmation.payloadDigest !== expectedDigest) return { valid: false, reason: "payload_mismatch" };
  if (new Date(confirmation.confirmedAt).getTime() > now.getTime() + 30_000) return { valid: false, reason: "confirmation_from_future" };
  try {
    const valid = verifyDigest(expectedDigest, Buffer.from(confirmation.signatureBase64, "base64"), identity.publicKeyPem, identity.algorithm);
    return valid ? { valid: true } : { valid: false, reason: "invalid_signature" };
  } catch {
    return { valid: false, reason: "malformed_signature" };
  }
}

export function verifyThreeNodeQuorum(
  operation: CriticalOperation,
  confirmations: QuorumConfirmation[],
  identities: QuorumNodeIdentity[],
  required = 2,
  now = new Date(),
): QuorumResult {
  const payloadDigest = digestOperation(operation);
  if (identities.length !== 3 || new Set(identities.map((identity) => identity.nodeId)).size !== 3 || required !== 2) {
    return {
      accepted: false,
      required: 2,
      validConfirmations: [],
      rejectedConfirmations: [{ nodeId: "system", reason: "three_distinct_nodes_and_two_of_three_required" }],
      payloadDigest,
    };
  }
  const identityById = new Map(identities.map((identity) => [identity.nodeId, identity]));
  const seen = new Set<string>();
  const validConfirmations: string[] = [];
  const rejectedConfirmations: Array<{ nodeId: string; reason: string }> = [];

  for (const confirmation of confirmations) {
    if (seen.has(confirmation.nodeId)) {
      rejectedConfirmations.push({ nodeId: confirmation.nodeId, reason: "duplicate_node" });
      continue;
    }
    seen.add(confirmation.nodeId);
    const identity = identityById.get(confirmation.nodeId);
    if (!identity) {
      rejectedConfirmations.push({ nodeId: confirmation.nodeId, reason: "unknown_node" });
      continue;
    }
    const result = verifyConfirmation(operation, confirmation, identity, now);
    if (result.valid) validConfirmations.push(confirmation.nodeId);
    else rejectedConfirmations.push({ nodeId: confirmation.nodeId, reason: result.reason ?? "invalid_confirmation" });
  }

  return {
    accepted: validConfirmations.length >= required,
    required,
    validConfirmations,
    rejectedConfirmations,
    payloadDigest,
  };
}

export function loadQuorumIdentitiesFromEnv(raw = process.env.QUORUM_NODE_PUBLIC_KEYS): QuorumNodeIdentity[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is QuorumNodeIdentity => {
      if (!item || typeof item !== "object") return false;
      const candidate = item as Record<string, unknown>;
      return typeof candidate.nodeId === "string"
        && (candidate.algorithm === "ed25519" || candidate.algorithm === "ecdsa-p256")
        && typeof candidate.publicKeyPem === "string";
    });
  } catch {
    return [];
  }
}

export function assertThreeNodeQuorum(result: QuorumResult): void {
  if (!result.accepted || result.required !== 2) {
    throw new Error(`Critical operation rejected: ${result.validConfirmations.length}/${result.required} quorum confirmations`);
  }
}
