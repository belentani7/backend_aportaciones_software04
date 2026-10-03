/**
 * HARMONÍA Durable Engine & Three-Phase Workflow for Web-to-Markdown Clipper
 * Integrado con Protocolo de Validación Universal (PVC-U) y Validation Ledger inmutable.
 */

import { PVCUValidator, ValidationEnvelope } from './pvc-u-profile';
import { PVCULedger } from './pvc-u-ledger';

export type NodePhase = 'prepare' | 'confirm' | 'commit';
export type NodeStatus = 'pending' | 'preparing' | 'awaiting_confirmation' | 'executing' | 'succeeded' | 'failed' | 'cancelled';

export interface ClipperWorkflowState {
  workflowId: string;
  url: string;
  title: string;
  markdownContent: string;
  wordCount: number;
  phase: NodePhase;
  status: NodeStatus;
  inputHash: string;
  idempotencyKey: string;
  approvalRequired: boolean;
  approved: boolean;
  createdAt: string;
  updatedAt: string;
  auditTrail: { event: string; timestamp: string }[];
  validationEnvelope?: ValidationEnvelope;
}

export class HarmoniaClipperWorkflow {
  private state: ClipperWorkflowState;
  private validator = new PVCUValidator();
  private static ledger = new PVCULedger();

  constructor(url: string, title: string, htmlContent: string) {
    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Validar mediante PVC-U (Esferas y Subesferas 4-A / 2-A)
    const envelope = this.validator.validateExtraction(url, title, htmlContent);
    HarmoniaClipperWorkflow.ledger.append(workflowId, envelope);

    if (!envelope.passed) {
      throw new Error(`PVC-U Validation Failed: ${envelope.violations.map(v => v.code + ': ' + v.message).join(', ')}`);
    }

    const markdown = this.htmlToMarkdown(htmlContent, title, url);
    const inputHash = envelope.inputHash;
    const idempotencyKey = `${workflowId}:${inputHash}:commit`;

    this.state = {
      workflowId,
      url,
      title,
      markdownContent: markdown,
      wordCount: markdown.split(/\s+/).length,
      phase: 'prepare',
      status: 'pending',
      inputHash,
      idempotencyKey,
      approvalRequired: true,
      approved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      auditTrail: [{ event: 'workflow_created_and_validated_pvcu', timestamp: new Date().toISOString() }],
      validationEnvelope: envelope,
    };
  }

  private htmlToMarkdown(html: string, title: string, url: string): string {
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    return `# ${title}\n\n*Source:* [${url}](${url})\n*Captured:* ${new Date().toISOString()}\n\n## Content\n\n${cleanText}`;
  }

  public prepare(): ClipperWorkflowState {
    this.state.phase = 'prepare';
    this.state.status = 'awaiting_confirmation';
    this.state.updatedAt = new Date().toISOString();
    this.state.auditTrail.push({ event: 'phase_prepare_completed', timestamp: this.state.updatedAt });
    return { ...this.state };
  }

  public confirm(approved: boolean): ClipperWorkflowState {
    if (this.state.phase !== 'prepare' && this.state.status !== 'awaiting_confirmation') {
      throw new Error('Workflow not in awaiting_confirmation state');
    }

    this.state.phase = 'confirm';
    this.state.approved = approved;
    this.state.updatedAt = new Date().toISOString();

    if (approved) {
      this.state.status = 'executing';
      this.state.auditTrail.push({ event: 'phase_confirm_approved', timestamp: this.state.updatedAt });
    } else {
      this.state.status = 'cancelled';
      this.state.auditTrail.push({ event: 'phase_confirm_rejected', timestamp: this.state.updatedAt });
    }

    return { ...this.state };
  }

  public commit(): { success: boolean; state: ClipperWorkflowState; fileContent: string } {
    if (this.state.status !== 'executing' || !this.state.approved) {
      throw new Error('Cannot commit unapproved or non-executing workflow');
    }

    try {
      this.state.phase = 'commit';
      this.state.status = 'succeeded';
      this.state.updatedAt = new Date().toISOString();
      this.state.auditTrail.push({ event: 'phase_commit_succeeded', timestamp: this.state.updatedAt });

      return {
        success: true,
        state: { ...this.state },
        fileContent: this.state.markdownContent,
      };
    } catch {
      this.state.status = 'failed';
      this.state.updatedAt = new Date().toISOString();
      this.state.auditTrail.push({ event: 'phase_commit_failed', timestamp: this.state.updatedAt });
      return {
        success: false,
        state: { ...this.state },
        fileContent: '',
      };
    }
  }

  public getState(): ClipperWorkflowState {
    return { ...this.state };
  }

  public static getLedger() {
    return HarmoniaClipperWorkflow.ledger;
  }
}
