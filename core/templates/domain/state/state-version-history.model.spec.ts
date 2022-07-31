// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StateVersionHistory domain object.
 */

import { StateVersionHistory } from './state-version-history.model';

describe('State version history model', () => {
  let stateVersionHistory: StateVersionHistory;

  beforeEach(() => {
    stateVersionHistory = new StateVersionHistory(1, 'state_1', 'user_1');
  });

  it('should get the various properties', () => {
    expect(stateVersionHistory.previouslyEditedInVersion).toEqual(1);
    expect(stateVersionHistory.stateNameInPreviousVersion).toEqual('state_1');
    expect(stateVersionHistory.committerUsername).toEqual('user_1');
  });

  it('should correctly set the value of previously edited version number',
    () => {
      expect(stateVersionHistory.previouslyEditedInVersion).toEqual(1);

      stateVersionHistory.previouslyEditedInVersion = 2;

      expect(stateVersionHistory.previouslyEditedInVersion).toEqual(2);
    });

  it('should correctly set the value of state name in previous version',
    () => {
      expect(
        stateVersionHistory.stateNameInPreviousVersion
      ).toEqual('state_1');

      stateVersionHistory.stateNameInPreviousVersion = 'state_2';

      expect(
        stateVersionHistory.stateNameInPreviousVersion
      ).toEqual('state_2');
    });

  it('should correctly set the value of committer username',
    () => {
      expect(stateVersionHistory.committerUsername).toEqual('user_1');

      stateVersionHistory.committerUsername = 'user_2';

      expect(stateVersionHistory.committerUsername).toEqual('user_2');
    });

  it('should convert into backend dict', () => {
    const stateVersionHistoryBackendDict = {
      previously_edited_in_version: 1,
      state_name_in_previous_version: 'state_1',
      committer_username: 'user_1'
    };

    expect(
      stateVersionHistory.toBackendDict()
    ).toEqual(stateVersionHistoryBackendDict);
  });

  it('should correctly be created from backend dict', () => {
    const stateVersionHistoryBackendDict = {
      previously_edited_in_version: 1,
      state_name_in_previous_version: 'state_1',
      committer_username: 'user_1'
    };
    const anotherStateVersionHistory = StateVersionHistory.fromBackendDict(
      stateVersionHistoryBackendDict);

    expect(
      anotherStateVersionHistory.previouslyEditedInVersion
    ).toEqual(stateVersionHistory.previouslyEditedInVersion);
    expect(
      anotherStateVersionHistory.stateNameInPreviousVersion
    ).toEqual(stateVersionHistory.stateNameInPreviousVersion);
    expect(
      anotherStateVersionHistory.committerUsername
    ).toEqual(stateVersionHistory.committerUsername);
  });
});
