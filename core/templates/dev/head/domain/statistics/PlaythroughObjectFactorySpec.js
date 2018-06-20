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
 * @fileoverview Unit tests for the PlaythroughObjectFactory.
 */

describe('Playthrough Object Factory', function() {
  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    this.pof = $injector.get('PlaythroughObjectFactory');
    this.laof = $injector.get('LearnerActionObjectFactory');
  }));

  it('should create a new playthrough', function() {
    var actions = [this.laof.createNew('AnswerSubmit', {}, 1)];
    var playthroughObject = this.pof.createNew(
      'playthroughId1', 'expId1', 1, 'EarlyQuit', {}, actions);

    expect(playthroughObject.playthroughId).toEqual('playthroughId1');
    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({});
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new playthrough from a backend dict', function() {
    var playthroughObject = this.pof.createFromBackendDict(
      {
        playthrough_id: 'playthroughId1',
        exp_id: 'expId1',
        exp_version: 1,
        issue_type: 'EarlyQuit',
        issue_customization_args: {},
        actions: [{
          action_type: 'AnswerSubmit',
          action_customization_args: {},
          schema_version: 1
        }]
      }
    );

    expect(playthroughObject.playthroughId).toEqual('playthroughId1');
    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({});
    expect(playthroughObject.actions).toEqual([this.laof.createNew(
      'AnswerSubmit', {}, 1)]);
  });

  it('should convert a playthrough to a backend dict', function() {
    var actions = [this.laof.createNew('AnswerSubmit', {}, 1)];
    var playthroughObject = this.pof.createNew(
      'playthroughId1', 'expId1', 1, 'EarlyQuit', {}, actions);

    var playthroughDict = playthroughObject.toBackendDict();
    expect(playthroughDict).toEqual({
      id: 'playthroughId1',
      exp_id: 'expId1',
      exp_version: 1,
      issue_type: 'EarlyQuit',
      issue_customization_args: {},
      actions: [{
        action_type: 'AnswerSubmit',
        action_customization_args: {},
        schema_version: 1
      }]
    });
  });
});
