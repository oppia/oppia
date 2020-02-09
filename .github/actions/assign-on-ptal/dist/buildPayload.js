"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const findAssignees_1 = require("./findAssignees");
function buildAssigneesPayload(event) {
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
    let assigneeNames = findAssignees_1.findAssignees(event.comment.body);
    return {
        url: `/repos/${event.repository.owner.login}/${event.repository.name}/issues/${event.issue.number}/assignees`,
        body: {
            assignees: assigneeNames
        }
    };
}
exports.buildAssigneesPayload = buildAssigneesPayload;
