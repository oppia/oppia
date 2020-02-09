import { promises as fs } from "fs";
import { buildAssigneesPayload } from "./buildPayload";
import { RestClient } from "typed-rest-client/RestClient";
import { BasicCredentialHandler } from "typed-rest-client/Handlers";

async function run() {
  let repoToken = process.env["INPUT_REPO-TOKEN"];
  if (!repoToken) {
    throw new Error("Input `repo-token` not provided");
  }

  let eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    throw new Error("Event is not present");
  }
  let eventBuffer = await fs.readFile(eventPath, {
    encoding: "utf8"
  });
  let event = JSON.parse(eventBuffer);
  
  let payload = buildAssigneesPayload(event);

  let client = new RestClient(
    "auto-assign-using-ptal-action",
    "https://api.github.com",
    [new BasicCredentialHandler("token", repoToken)], {
      headers: {
        Accept: "application/vnd.github.v3+json"
      }
    }
  );
  await client.create(payload.url, payload.body);
}

run().catch(e => {
  process.stderr.write(`Failed to assign thread : ${e.message}`);
  process.exit(1);
});
