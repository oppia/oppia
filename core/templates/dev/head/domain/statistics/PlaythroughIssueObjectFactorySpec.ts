// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for the PlaythroughIssueObjectFactory.
 */

import { PlaythroughIssueObjectFactory, PlaythroughIssue } from
  'domain/statistics/PlaythroughIssueObjectFactory';

describe('Playthrough Issue Object Factory', () => {
  let piof: PlaythroughIssueObjectFactory;
  let playthroughIssueObject: PlaythroughIssue;
  beforeEach(() => {
    piof = new PlaythroughIssueObjectFactory();
  });

  it('should create a new exploration issue', () => {
    playthroughIssueObject = new PlaythroughIssue('EarlyQuit', {}, [], 1, true);

    expect(playthroughIssueObject.issueType).toEqual('EarlyQuit');
    expect(playthroughIssueObject.issueCustomizationArgs).toEqual({});
    expect(playthroughIssueObject.playthroughIds).toEqual([]);
    expect(playthroughIssueObject.schemaVersion).toEqual(1);
    expect(playthroughIssueObject.isValid).toEqual(true);
  });

  it('should create a new exploration issue from a backend dict', () => {
    var playthroughIssueObject = piof.createFromBackendDict({
      issue_type: 'EarlyQuit',
      issue_customization_args: {},
      playthrough_ids: [],
      schema_version: 1,
      is_valid: true
    });

    expect(playthroughIssueObject.issueType).toEqual('EarlyQuit');
    expect(playthroughIssueObject.issueCustomizationArgs).toEqual({});
    expect(playthroughIssueObject.playthroughIds).toEqual([]);
    expect(playthroughIssueObject.schemaVersion).toEqual(1);
    expect(playthroughIssueObject.isValid).toEqual(true);
  });
});
