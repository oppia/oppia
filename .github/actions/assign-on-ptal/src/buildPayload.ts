import { findAssignees } from "./findAssignees";
export interface AssigneesRequestData {
  url: string;
  body: {
    assignees: string[];
  };
}

export function buildAssigneesPayload(event: any): AssigneesRequestData {
  if (!event.repository) {
    throw new Error("Repository not given in event payload.");
  }

  if (!event.issue) {
    throw new Error("Event is not an issue or a pull-request event.");
  }

  if (!event.issue.user) {
    throw new Error("Event does not contain user information.");
  }

  if (!event.issue.user.login) {
    throw new Error("User payload is malformed.");
  }

  // console.log(JSON.stringify(event, undefined, 2));
  let assigneeNames = findAssignees(event.comment.body);

  return {
    url: `/repos/${event.repository.owner.login}/${event.repository.name}/issues/${event.issue.number}/assignees`,
    body: {
      assignees: assigneeNames
    }
  };
}