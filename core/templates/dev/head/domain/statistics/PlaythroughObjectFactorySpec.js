// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
  var PlaythroughObjectFactory;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    PlaythroughObjectFactory = $injector.get(
      'PlaythroughObjectFactory');
    LearnerActionObjectFactory = $injector.get(
      'LearnerActionObjectFactory');
  }));

  it('should create a new playthrough', function() {
    var actions = [
      LearnerActionObjectFactory.create('AnswerSubmit', {}, 1)];
    var playthroughObject = PlaythroughObjectFactory.create(
        'playthroughId1', 'expId1', 1, 'EarlyQuit', {}, actions);

    expect(playthroughObject.playthroughId).toEqual('playthroughId1');
    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({});
    expect(playthroughObject.actions).toEqual(actions);
  });

  it('should create a new playthrough from a backend dict', function() {
    var actionDicts = [{
      actionType: 'AnswerSubmit',
      actionCustomizationArgs: {},
      schemaVersion: 1
    }];
    var playthroughBackendDict = {
      playthroughId: 'playthroughId1',
      expId: 'expId1',
      expVersion: 1,
      issueType: 'EarlyQuit',
      issueCustomizationArgs: {},
      actions: actionDicts
    };
    var playthroughObject = PlaythroughObjectFactory.createFromBackendDict(
        playthroughBackendDict);

    expect(playthroughObject.playthroughId).toEqual('playthroughId1');
    expect(playthroughObject.expId).toEqual('expId1');
    expect(playthroughObject.expVersion).toEqual(1);
    expect(playthroughObject.issueType).toEqual('EarlyQuit');
    expect(playthroughObject.issueCustomizationArgs).toEqual({});
    expect(playthroughObject.actions[0]).toEqual(
        LearnerActionObjectFactory.createFromBackendDict(actionDicts[0]));
  });
});
