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
  'previously_edited_on_version': number;
  'state_name_in_previous_version': string;
  'committer_username': string;
}

export class StateVersionHistory {
  _previouslyEditedOnVersion: number;
  _stateNameInPreviousVersion: string;
  _committerUsername: string;

  constructor(
      previouslyEditedOnVersion: number,
      stateNameInPreviousVersion: string,
      committerUsername: string
  ) {
    this._previouslyEditedOnVersion = previouslyEditedOnVersion;
    this._stateNameInPreviousVersion = stateNameInPreviousVersion;
    this._committerUsername = committerUsername;
  }

  getPreviouslyEditedVersionNumber(): number {
    return this._previouslyEditedOnVersion;
  }

  setPreviouslyEditedVersionNumber(previouslyEditedOnVersion: number): void {
    this._previouslyEditedOnVersion = previouslyEditedOnVersion;
  }

  getStateNameInPreviousVersion(): string {
    return this._stateNameInPreviousVersion;
  }

  setStateNameInPreviousVersion(stateNameInPreviousVersion: string): void {
    this._stateNameInPreviousVersion = stateNameInPreviousVersion;
  }

  getCommitterUsername(): string {
    return this._committerUsername;
  }

  setCommitterUsername(committerUsername: string): void {
    this._committerUsername = committerUsername;
  }

  toBackendDict(): StateVersionHistoryBackendDict {
    return {
      previously_edited_on_version: this._previouslyEditedOnVersion,
      state_name_in_previous_version: this._stateNameInPreviousVersion,
      committer_username: this._committerUsername
    };
  }

  static fromBackendDict(
      stateVersionHistoryBackendDict: StateVersionHistoryBackendDict
  ): StateVersionHistory {
    return new StateVersionHistory(
      stateVersionHistoryBackendDict.previously_edited_on_version,
      stateVersionHistoryBackendDict.state_name_in_previous_version,
      stateVersionHistoryBackendDict.committer_username);
  }
}
