import path from "node:path";
import { WorkspaceConfig } from "../config/workspace-config-loader.js";
import { ContextLoader } from "../context/context-loader.js";
import { SherlockDocumentWriter } from "./sherlock-document-writer.js";
import { SherlockRegistry } from "./sherlock-registry.js";

export interface AnalysisResult {
  content: string;
  final_confidence: number;
  open_questions_present: boolean;
  lesson_candidates_present: boolean;
}

export interface SherlockBundle extends Record<string, unknown> {
  project: string;
  ticket: string;
  sherlock_version: string;
  output_file: string;
  documents_read: string[];
  documents: Array<{ label: string; content: string }>;
  flow_status: "ready_for_analysis";
}

export interface SherlockPersistResult extends Record<string, unknown> {
  project: string;
  ticket: string;
  sherlock_version_used: string;
  output_file: string;
  final_confidence: number;
  open_questions_present: boolean;
  lesson_candidates_present: boolean;
  flow_status: "analysis_persisted";
  warnings: string[];
}

export class SherlockEngine {
  private readonly contextLoader = new ContextLoader();
  private readonly registry = new SherlockRegistry();
  private readonly writer = new SherlockDocumentWriter();

  // Phase 1: loads heavy context and returns the bundle the model needs to perform analysis.
  public async prepareBundle(
    config: WorkspaceConfig,
    project: string,
    ticket: string,
    requestedVersion?: string
  ): Promise<SherlockBundle> {
    const version = this.registry.resolveVersion(config, requestedVersion);

    const loaded = await this.contextLoader.load(
      config,
      "heavy_analysis",
      project,
      ticket
    );

    const outputFile = path.join(
      config.workspace.tasks_root,
      ticket,
      this.registry.resolveOutputFileName(config)
    );

    return {
      project,
      ticket,
      sherlock_version: version,
      output_file: outputFile,
      documents_read: loaded.documentsRead,
      documents: loaded.documents.map((d) => ({ label: d.label, content: d.content })),
      flow_status: "ready_for_analysis"
    };
  }

  // Phase 2: validates and persists the analysis produced by the model.
  public async persistAnalysis(
    config: WorkspaceConfig,
    project: string,
    ticket: string,
    analysisResult: AnalysisResult,
    requestedVersion?: string
  ): Promise<SherlockPersistResult> {
    const version = this.registry.resolveVersion(config, requestedVersion);
    const threshold = this.registry.resolveReflectionThreshold(config);
    const warnings: string[] = [];

    if (analysisResult.final_confidence < threshold) {
      warnings.push(
        `final_confidence (${analysisResult.final_confidence}) is below the reflection threshold (${threshold}). ` +
        `Consider gathering more evidence or challenging the reasoning from another angle.`
      );
    }

    const writeResult = await this.writer.write(config, ticket, analysisResult.content);

    return {
      project,
      ticket,
      sherlock_version_used: version,
      output_file: writeResult.output_file,
      final_confidence: analysisResult.final_confidence,
      open_questions_present: analysisResult.open_questions_present,
      lesson_candidates_present: analysisResult.lesson_candidates_present,
      flow_status: "analysis_persisted",
      warnings
    };
  }
}
