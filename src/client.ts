/**
 * Plane REST API client.
 *
 * Covers every documented Plane API endpoint:
 *   Workspaces — list, get
 *   Projects   — CRUD, archive, summary
 *   Work Items — CRUD, search, by-identifier, comments, links, attachments, activity
 *   Cycles     — CRUD, list-issues, transfer-issues
 *   Modules    — CRUD, list-issues, link/unlink issues
 *   States     — list
 *   Labels     — CRUD
 *   Members    — list, get, update-role
 *
 * Auth: X-API-Key header (personal access token).
 * Base URL: configurable (defaults to Plane Cloud; set PLANE_BASE_URL for self-hosted).
 *
 * https://developers.plane.so/api-reference
 */

const DEFAULT_BASE_URL = "https://api.plane.so";

export interface PlaneClientConfig {
  apiKey: string;
  baseUrl?: string;
}

export interface PaginatedResponse<T> {
  next_cursor: string;
  prev_cursor: string;
  next_page_results: boolean;
  prev_page_results: boolean;
  count: number;
  total_pages: number;
  total_results: number;
  extra_stats: Record<string, unknown>;
  results: T[];
}

class PlaneError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    const msg =
      typeof body === "object" && body !== null && "detail" in body
        ? String((body as Record<string, unknown>).detail)
        : typeof body === "object" && body !== null && "error" in body
          ? String((body as Record<string, unknown>).error)
          : `HTTP ${status}`;
    super(msg);
    this.name = "PlaneError";
    this.status = status;
    this.body = body;
  }
}

async function request<T>(
  config: PlaneClientConfig,
  method: string,
  path: string,
  body?: unknown,
  qs?: Record<string, string | undefined>,
): Promise<T> {
  const base = config.baseUrl ?? DEFAULT_BASE_URL;
  const url = new URL(`/api/v1${path}`, base);

  if (qs) {
    for (const [k, v] of Object.entries(qs)) {
      if (v !== undefined) url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    "X-API-Key": config.apiKey,
  };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!res.ok) {
    throw new PlaneError(res.status, data);
  }

  return data as T;
}

export class PlaneClient {
  private config: PlaneClientConfig;

  constructor(config: PlaneClientConfig) {
    this.config = config;
  }

  // ── Workspaces ──
  async listWorkspaces(): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", "/workspaces/");
  }
  async getWorkspace(slug: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/`);
  }

  // ── Projects ──
  async listProjects(slug: string, params?: { search?: string; ordering?: string }): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/`, undefined, {
      search: params?.search,
      ordering: params?.ordering,
    });
  }
  async getProject(slug: string, projectId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/`);
  }
  async createProject(slug: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/`, body);
  }
  async updateProject(slug: string, projectId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/`, body);
  }
  async deleteProject(slug: string, projectId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/`);
  }
  async archiveProject(slug: string, projectId: string): Promise<void> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/archive/`);
  }
  async unarchiveProject(slug: string, projectId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/archive/`);
  }
  async getProjectSummary(slug: string, projectId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/summary/`);
  }

  // ── Work Items ──
  async listWorkItems(slug: string, projectId: string, params?: { expand?: string; search?: string; state?: string; limit?: number; offset?: number }): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/`, undefined, {
      expand: params?.expand,
      search: params?.search,
      state: params?.state,
      limit: params?.limit !== undefined ? String(params.limit) : undefined,
      offset: params?.offset !== undefined ? String(params.offset) : undefined,
    });
  }
  async getWorkItem(slug: string, projectId: string, issueId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/`);
  }
  async createWorkItem(slug: string, projectId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/work-items/`, body);
  }
  async updateWorkItem(slug: string, projectId: string, issueId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/`, body);
  }
  async deleteWorkItem(slug: string, projectId: string, issueId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/`);
  }
  async searchWorkItems(slug: string, q: string, projectId?: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/work-items/search/`, undefined, { q, project_id: projectId });
  }
  async getWorkItemByIdentifier(slug: string, identifier: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/work-items/${identifier}/`);
  }

  // ── Comments ──
  async listComments(slug: string, projectId: string, issueId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/comments/`);
  }
  async createComment(slug: string, projectId: string, issueId: string, body: { comment_html: string; access?: string }): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/comments/`, body);
  }
  async getComment(slug: string, projectId: string, issueId: string, commentId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/comments/${commentId}/`);
  }
  async updateComment(slug: string, projectId: string, issueId: string, commentId: string, body: { comment_html: string }): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/comments/${commentId}/`, body);
  }
  async deleteComment(slug: string, projectId: string, issueId: string, commentId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/comments/${commentId}/`);
  }

  // ── Links ──
  async listLinks(slug: string, projectId: string, issueId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/links/`);
  }
  async createLink(slug: string, projectId: string, issueId: string, body: { title: string; url: string }): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/links/`, body);
  }
  async getLink(slug: string, projectId: string, issueId: string, linkId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/links/${linkId}/`);
  }
  async updateLink(slug: string, projectId: string, issueId: string, linkId: string, body: { title?: string; url?: string }): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/links/${linkId}/`, body);
  }
  async deleteLink(slug: string, projectId: string, issueId: string, linkId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/links/${linkId}/`);
  }

  // ── Attachments ──
  async listAttachments(slug: string, projectId: string, issueId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/attachments/`);
  }
  async createAttachment(slug: string, projectId: string, issueId: string, body: { name: string; size: number; type: string }): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/attachments/`, body);
  }
  async getAttachment(slug: string, projectId: string, issueId: string, attachmentId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/attachments/${attachmentId}/`);
  }
  async deleteAttachment(slug: string, projectId: string, issueId: string, attachmentId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/attachments/${attachmentId}/`);
  }

  // ── Activity ──
  async listActivity(slug: string, projectId: string, issueId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/work-items/${issueId}/activities/`);
  }

  // ── Cycles ──
  async listCycles(slug: string, projectId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/cycles/`);
  }
  async getCycle(slug: string, projectId: string, cycleId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/`);
  }
  async createCycle(slug: string, projectId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/cycles/`, body);
  }
  async updateCycle(slug: string, projectId: string, cycleId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/`, body);
  }
  async deleteCycle(slug: string, projectId: string, cycleId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/`);
  }
  async listCycleIssues(slug: string, projectId: string, cycleId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/cycle-issues/`);
  }
  async transferCycleIssues(slug: string, projectId: string, cycleId: string, body: { new_cycle_id: string }): Promise<void> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/cycles/${cycleId}/transfer-issues/`, body);
  }

  // ── Modules ──
  async listModules(slug: string, projectId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/modules/`);
  }
  async getModule(slug: string, projectId: string, moduleId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/`);
  }
  async createModule(slug: string, projectId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/modules/`, body);
  }
  async updateModule(slug: string, projectId: string, moduleId: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/`, body);
  }
  async deleteModule(slug: string, projectId: string, moduleId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/`);
  }
  async listModuleIssues(slug: string, projectId: string, moduleId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/module-issues/`);
  }
  async linkIssueToModule(slug: string, projectId: string, moduleId: string, body: { issues: string[] }): Promise<void> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/module-issues/`, body);
  }
  async unlinkIssueFromModule(slug: string, projectId: string, moduleId: string, issueId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/modules/${moduleId}/module-issues/${issueId}/`);
  }

  // ── States ──
  async listStates(slug: string, projectId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/states/`);
  }

  // ── Labels ──
  async listLabels(slug: string, projectId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/labels/`);
  }
  async createLabel(slug: string, projectId: string, body: { name: string; color?: string }): Promise<Record<string, unknown>> {
    return request(this.config, "POST", `/workspaces/${slug}/projects/${projectId}/labels/`, body);
  }
  async getLabel(slug: string, projectId: string, labelId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`);
  }
  async updateLabel(slug: string, projectId: string, labelId: string, body: { name?: string; color?: string }): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`, body);
  }
  async deleteLabel(slug: string, projectId: string, labelId: string): Promise<void> {
    return request(this.config, "DELETE", `/workspaces/${slug}/projects/${projectId}/labels/${labelId}/`);
  }

  // ── Members ──
  async listMembers(slug: string, projectId: string): Promise<Record<string, unknown>[]> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/members/`);
  }
  async getMember(slug: string, projectId: string, memberId: string): Promise<Record<string, unknown>> {
    return request(this.config, "GET", `/workspaces/${slug}/projects/${projectId}/members/${memberId}/`);
  }
  async updateMemberRole(slug: string, projectId: string, memberId: string, role: number): Promise<Record<string, unknown>> {
    return request(this.config, "PATCH", `/workspaces/${slug}/projects/${projectId}/members/${memberId}/`, { role });
  }
}
