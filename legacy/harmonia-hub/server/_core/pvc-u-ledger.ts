/**
 * Validation Ledger inmutable para el Protocolo PVC-U
 * Almacena cada Validation Envelope con sellado criptográfico y trazabilidad.
 */

import crypto from 'crypto';
import { ValidationEnvelope } from './pvc-u-profile';

export interface LedgerRecord {
  sequenceId: number;
  workflowId: string;
  envelope: ValidationEnvelope;
  previousHash: string;
  recordHash: string;
}

export class PVCULedger {
  private records: LedgerRecord[] = [];

  public append(workflowId: string, envelope: ValidationEnvelope): LedgerRecord {
    const sequenceId = this.records.length + 1;
    const previousHash = sequenceId === 1 ? '0000000000000000000000000000000000000000000000000000000000000000' : this.records[this.records.length - 1].recordHash;
    
    const payload = `${sequenceId}:${workflowId}:${envelope.envelopeId}:${envelope.inputHash}:${previousHash}`;
    const recordHash = crypto.createHash('sha256').update(payload).digest('hex');

    const record: LedgerRecord = {
      sequenceId,
      workflowId,
      envelope,
      previousHash,
      recordHash,
    };

    this.records.push(record);
    return record;
  }

  public getRecords(): LedgerRecord[] {
    return [...this.records];
  }

  public verifyIntegrity(): boolean {
    for (let i = 0; i < this.records.length; i++) {
      const rec = this.records[i];
      const prevHash = i === 0 ? '0000000000000000000000000000000000000000000000000000000000000000' : this.records[i - 1].recordHash;
      if (rec.previousHash !== prevHash) return false;
    }
    return true;
  }
}
