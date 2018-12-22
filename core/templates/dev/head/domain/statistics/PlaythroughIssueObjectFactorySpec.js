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

describe('Playthrough Issue Object Factory', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.piof = $injector.get('PlaythroughIssueObjectFactory');
  }));

  it('should create a new exploration issue', function() {
    var explorationIssueObject = new this.piof('EarlyQuit', {}, [], 1, true);

    expect(explorationIssueObject.issueType).toEqual('EarlyQuit');
    expect(explorationIssueObject.issueCustomizationArgs).toEqual({});
    expect(explorationIssueObject.playthroughIds).toEqual([]);
    expect(explorationIssueObject.schemaVersion).toEqual(1);
    expect(explorationIssueObject.isValid).toEqual(true);
  });

  it('should create a new exploration issue from a backend dict', function() {
    var explorationIssueObject = this.piof.createFromBackendDict({
      issue_type: 'EarlyQuit',
      issue_customization_args: {},
      playthrough_ids: [],
      schema_version: 1,
      is_valid: true
    });

    expect(explorationIssueObject.issueType).toEqual('EarlyQuit');
    expect(explorationIssueObject.issueCustomizationArgs).toEqual({});
    expect(explorationIssueObject.playthroughIds).toEqual([]);
    expect(explorationIssueObject.schemaVersion).toEqual(1);
    expect(explorationIssueObject.isValid).toEqual(true);
  });
});
