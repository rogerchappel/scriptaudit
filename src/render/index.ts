import { renderJson } from "./json.js";
import { renderMarkdown } from "./markdown.js";
import type { AuditReport } from "../types.js";

export type OutputFormat = "markdown" | "json";

export function renderReport(report: AuditReport, format: OutputFormat): string {
  return format === "json" ? renderJson(report) : renderMarkdown(report);
}
