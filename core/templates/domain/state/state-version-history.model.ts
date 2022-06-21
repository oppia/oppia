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
 * @fileoverview Model class for creating domain object for exploration state
 * version history.
 */

export interface StateVersionHistoryBackendDict {
  'previously_edited_in_version': number;
  'state_name_in_previous_version': string;
  'committer_username': string;
}

export class StateVersionHistory {
  _previouslyEditedInVersion: number;
  _stateNameInPreviousVersion: string;
  _committerUsername: string;

  constructor(
      previouslyEditedInVersion: number,
      stateNameInPreviousVersion: string,
      committerUsername: string
  ) {
    this._previouslyEditedInVersion = previouslyEditedInVersion;
    this._stateNameInPreviousVersion = stateNameInPreviousVersion;
    this._committerUsername = committerUsername;
  }

  get previouslyEditedInVersion(): number {
    return this._previouslyEditedInVersion;
  }

  set previouslyEditedInVersion(previouslyEditedInVersion: number) {
    this._previouslyEditedInVersion = previouslyEditedInVersion;
  }

  get stateNameInPreviousVersion(): string {
    return this._stateNameInPreviousVersion;
  }

  set stateNameInPreviousVersion(stateNameInPreviousVersion: string) {
    this._stateNameInPreviousVersion = stateNameInPreviousVersion;
  }

  get committerUsername(): string {
    return this._committerUsername;
  }

  set committerUsername(committerUsername: string) {
    this._committerUsername = committerUsername;
  }

  toBackendDict(): StateVersionHistoryBackendDict {
    return {
      previously_edited_in_version: this._previouslyEditedInVersion,
      state_name_in_previous_version: this._stateNameInPreviousVersion,
      committer_username: this._committerUsername
    };
  }

  static fromBackendDict(
      stateVersionHistoryBackendDict: StateVersionHistoryBackendDict
  ): StateVersionHistory {
    return new StateVersionHistory(
      stateVersionHistoryBackendDict.previously_edited_in_version,
      stateVersionHistoryBackendDict.state_name_in_previous_version,
      stateVersionHistoryBackendDict.committer_username);
  }
}
