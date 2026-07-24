# MCP Plane

MCP server for [Plane](https://plane.so). 56 tools covering the complete Plane REST API.

## Quick Start

```bash
npm install
npm run build
PLANE_API_KEY=plane_api_your_token npm start
```

## Configuration

| Variable | Required | Default |
|----------|----------|--------|
| `PLANE_API_KEY` | ✅ | — |
| `PLANE_BASE_URL` | ❌ | `https://api.plane.so` |

## Pi Integration

```json
{
  "mcpServers": {
    "mcp-plane": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {
        "PLANE_API_KEY": "plane_api_...",
        "PLANE_BASE_URL": "http://localhost:8085"
      }
    }
  }
}
```

## Tools (56)

| Category | Tools |
|----------|-------|
| Workspaces (2) | `plane_list_workspaces`, `plane_get_workspace` |
| Projects (8) | `plane_list_projects`, `plane_get_project`, `plane_create_project`, `plane_update_project`, `plane_delete_project`, `plane_archive_project`, `plane_unarchive_project`, `plane_get_project_summary` |
| Issues (7) | `plane_list_issues`, `plane_get_issue`, `plane_create_issue`, `plane_update_issue`, `plane_delete_issue`, `plane_search_issues`, `plane_get_issue_by_identifier` |
| Comments (5) | `plane_list_comments`, `plane_create_comment`, `plane_get_comment`, `plane_update_comment`, `plane_delete_comment` |
| Links (5) | `plane_list_links`, `plane_create_link`, `plane_get_link`, `plane_update_link`, `plane_delete_link` |
| Attachments (4) | `plane_list_attachments`, `plane_create_attachment`, `plane_get_attachment`, `plane_delete_attachment` |
| Activity (1) | `plane_list_issue_activity` |
| Cycles (7) | `plane_list_cycles`, `plane_get_cycle`, `plane_create_cycle`, `plane_update_cycle`, `plane_delete_cycle`, `plane_list_cycle_issues`, `plane_transfer_cycle_issues` |
| Modules (8) | `plane_list_modules`, `plane_get_module`, `plane_create_module`, `plane_update_module`, `plane_delete_module`, `plane_list_module_issues`, `plane_link_issues_to_module`, `plane_unlink_issue_from_module` |
| States (1) | `plane_list_states` |
| Labels (5) | `plane_list_labels`, `plane_create_label`, `plane_get_label`, `plane_update_label`, `plane_delete_label` |
| Members (3) | `plane_list_members`, `plane_get_member`, `plane_update_member_role` |

## License

MIT © Ruben-Alvarez-Dev
