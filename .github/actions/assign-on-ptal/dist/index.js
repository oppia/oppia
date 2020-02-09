"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const buildPayload_1 = require("./buildPayload");
const RestClient_1 = require("typed-rest-client/RestClient");
const Handlers_1 = require("typed-rest-client/Handlers");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let repoToken = process.env["INPUT_REPO-TOKEN"];
        if (!repoToken) {
            throw new Error("Input `repo-token` not provided");
        }
        let eventPath = process.env.GITHUB_EVENT_PATH;
        if (!eventPath) {
            throw new Error("Event is not present");
        }
        let eventBuffer = yield fs_1.promises.readFile(eventPath, {
            encoding: "utf8"
        });
        let event = JSON.parse(eventBuffer);
        let payload = buildPayload_1.buildAssigneesPayload(event);
        let client = new RestClient_1.RestClient("auto-assign-using-ptal-action", "https://api.github.com", [new Handlers_1.BasicCredentialHandler("token", repoToken)], {
            headers: {
                Accept: "application/vnd.github.v3+json"
            }
        });
        yield client.create(payload.url, payload.body);
    });
}
run().catch(e => {
    process.stderr.write(`Failed to assign thread : ${e.message}`);
    process.exit(1);
});
