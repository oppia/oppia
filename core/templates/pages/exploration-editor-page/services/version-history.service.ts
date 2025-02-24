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
 * @fileoverview Service for the exploration states version history.
 */

import {Injectable} from '@angular/core';
import {ExplorationMetadata} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {State} from 'domain/state/StateObjectFactory';

export interface StateDiffData {
  oldState: State | null;
  newState: State | null;
  oldVersionNumber: number | null;
  newVersionNumber: number | null;
  committerUsername: string;
}

export interface MetadataDiffData {
  oldMetadata: ExplorationMetadata | null;
  newMetadata: ExplorationMetadata | null;
  oldVersionNumber: number | null;
  newVersionNumber: number | null;
  committerUsername: string;
}

@Injectable({
  providedIn: 'root',
})
export class VersionHistoryService {
  // The following value is null when the service is not initialized i.e.
  // the user hasn't opened any exploration editor page yet.
  latestVersionOfExploration: number | null = null;

  // The following four arrays namely fetchedStateVersionNumbers,
  // fetchedMetadataVersionNumbers, fetchedStateData, fetchedMetadata can
  // contain only their last element as null and no other element of these
  // arrays will be none. The element null marks the end of the version
  // history of a particular state or exploration metadata. When we keep
  // fetching the 'previously edited versions' of a state or exploration
  // metadata, the backend returns the version number as 'None' when we
  // reach the end of the version history.
  fetchedStateVersionNumbers: (number | null)[] = [];
  fetchedMetadataVersionNumbers: (number | null)[] = [];
  fetchedStateData: (State | null)[] = [];
  fetchedMetadata: (ExplorationMetadata | null)[] = [];

  fetchedCommitterUsernames: string[] = [];

  // The two below variables represent the current index of the version history
  // list which the user is navigating i.e. index value for the lists
  // fetchedStateVersionNumbers, fetchedMetadataVersionNumbers etc. These
  // variables are initialized as zero inside the resetStateVersionHistory and
  // resetMetadataVersionHistory functions when a state editor or the
  // exploration settings tab is opened by a user. This is because the item
  // that is shown to a user by default is the first item in each of these
  // lists.
  currentPositionInStateVersionHistoryList: number = 0;
  currentPositionInMetadataVersionHistoryList: number = 0;

  constructor() {}

  init(explorationVersion: number): void {
    this.latestVersionOfExploration = explorationVersion;
  }

  resetStateVersionHistory(): void {
    this.fetchedStateData = [];
    this.fetchedStateVersionNumbers = [];
    this.fetchedCommitterUsernames = [];
    this.currentPositionInStateVersionHistoryList = 0;
  }

  resetMetadataVersionHistory(): void {
    this.fetchedMetadata = [];
    this.fetchedMetadataVersionNumbers = [];
    this.fetchedCommitterUsernames = [];
    this.currentPositionInMetadataVersionHistoryList = 0;
  }

  shouldFetchNewStateVersionHistory(): boolean {
    if (
      this.currentPositionInStateVersionHistoryList <
      this.fetchedStateVersionNumbers.length - 2
    ) {
      return false;
    }
    return true;
  }

  shouldFetchNewMetadataVersionHistory(): boolean {
    if (
      this.currentPositionInMetadataVersionHistoryList <
      this.fetchedMetadataVersionNumbers.length - 2
    ) {
      return false;
    }
    return true;
  }

  insertMetadataVersionHistoryData(
    versionNumber: number | null,
    metadata: ExplorationMetadata | null,
    committerUsername: string
  ): void {
    // If the version number already exists, then don't update the list.
    if (this.fetchedMetadataVersionNumbers.at(-1) === versionNumber) {
      return;
    }
    this.fetchedMetadataVersionNumbers.push(versionNumber);
    this.fetchedMetadata.push(metadata);
    this.fetchedCommitterUsernames.push(committerUsername);
  }

  insertStateVersionHistoryData(
    versionNumber: number | null,
    stateData: State | null,
    committerUsername: string
  ): void {
    // If the version number already exists, then don't update the list.
    if (this.fetchedStateVersionNumbers.at(-1) === versionNumber) {
      return;
    }
    this.fetchedStateVersionNumbers.push(versionNumber);
    this.fetchedStateData.push(stateData);
    this.fetchedCommitterUsernames.push(committerUsername);
  }

  canShowBackwardStateDiffData(): boolean {
    return (
      this.currentPositionInStateVersionHistoryList >= 0 &&
      this.currentPositionInStateVersionHistoryList <
        this.fetchedStateVersionNumbers.length - 1 &&
      this.fetchedStateVersionNumbers[
        this.currentPositionInStateVersionHistoryList + 1
      ] !== null &&
      this.fetchedStateData[
        this.currentPositionInStateVersionHistoryList + 1
      ] !== null
    );
  }

  canShowForwardStateDiffData(): boolean {
    return (
      this.currentPositionInStateVersionHistoryList >= 2 &&
      this.currentPositionInStateVersionHistoryList <
        this.fetchedStateVersionNumbers.length &&
      this.fetchedStateVersionNumbers[
        this.currentPositionInStateVersionHistoryList - 1
      ] !== null &&
      this.fetchedStateVersionNumbers[
        this.currentPositionInStateVersionHistoryList - 2
      ] !== null &&
      this.fetchedStateData[
        this.currentPositionInStateVersionHistoryList - 1
      ] !== null &&
      this.fetchedStateData[
        this.currentPositionInStateVersionHistoryList - 2
      ] !== null
    );
  }

  getBackwardStateDiffData(): StateDiffData {
    return {
      oldState:
        this.fetchedStateData[
          this.currentPositionInStateVersionHistoryList + 1
        ],
      newState:
        this.fetchedStateData[this.currentPositionInStateVersionHistoryList],
      oldVersionNumber:
        this.fetchedStateVersionNumbers[
          this.currentPositionInStateVersionHistoryList + 1
        ],
      newVersionNumber:
        this.fetchedStateVersionNumbers[
          this.currentPositionInStateVersionHistoryList
        ],
      committerUsername:
        this.fetchedCommitterUsernames[
          this.currentPositionInStateVersionHistoryList + 1
        ],
    };
  }

  getForwardStateDiffData(): StateDiffData {
    return {
      oldState:
        this.fetchedStateData[
          this.currentPositionInStateVersionHistoryList - 1
        ],
      newState:
        this.fetchedStateData[
          this.currentPositionInStateVersionHistoryList - 2
        ],
      oldVersionNumber:
        this.fetchedStateVersionNumbers[
          this.currentPositionInStateVersionHistoryList - 1
        ],
      newVersionNumber:
        this.fetchedStateVersionNumbers[
          this.currentPositionInStateVersionHistoryList - 2
        ],
      committerUsername:
        this.fetchedCommitterUsernames[
          this.currentPositionInStateVersionHistoryList - 1
        ],
    };
  }

  canShowBackwardMetadataDiffData(): boolean {
    return (
      this.currentPositionInMetadataVersionHistoryList >= 0 &&
      this.currentPositionInMetadataVersionHistoryList <
        this.fetchedMetadataVersionNumbers.length - 1 &&
      this.fetchedMetadataVersionNumbers[
        this.currentPositionInMetadataVersionHistoryList + 1
      ] !== null &&
      this.fetchedMetadata[
        this.currentPositionInMetadataVersionHistoryList + 1
      ] !== null
    );
  }

  canShowForwardMetadataDiffData(): boolean {
    return (
      this.currentPositionInMetadataVersionHistoryList >= 2 &&
      this.currentPositionInMetadataVersionHistoryList <
        this.fetchedMetadataVersionNumbers.length &&
      this.fetchedMetadataVersionNumbers[
        this.currentPositionInMetadataVersionHistoryList - 1
      ] !== null &&
      this.fetchedMetadataVersionNumbers[
        this.currentPositionInMetadataVersionHistoryList - 2
      ] !== null &&
      this.fetchedMetadata[
        this.currentPositionInMetadataVersionHistoryList - 1
      ] !== null &&
      this.fetchedMetadata[
        this.currentPositionInMetadataVersionHistoryList - 2
      ] !== null
    );
  }

  getBackwardMetadataDiffData(): MetadataDiffData {
    return {
      oldMetadata:
        this.fetchedMetadata[
          this.currentPositionInMetadataVersionHistoryList + 1
        ],
      newMetadata:
        this.fetchedMetadata[this.currentPositionInMetadataVersionHistoryList],
      oldVersionNumber:
        this.fetchedMetadataVersionNumbers[
          this.currentPositionInMetadataVersionHistoryList + 1
        ],
      newVersionNumber:
        this.fetchedMetadataVersionNumbers[
          this.currentPositionInMetadataVersionHistoryList
        ],
      committerUsername:
        this.fetchedCommitterUsernames[
          this.currentPositionInMetadataVersionHistoryList + 1
        ],
    };
  }

  getForwardMetadataDiffData(): MetadataDiffData {
    return {
      oldMetadata:
        this.fetchedMetadata[
          this.currentPositionInMetadataVersionHistoryList - 1
        ],
      newMetadata:
        this.fetchedMetadata[
          this.currentPositionInMetadataVersionHistoryList - 2
        ],
      oldVersionNumber:
        this.fetchedMetadataVersionNumbers[
          this.currentPositionInMetadataVersionHistoryList - 1
        ],
      newVersionNumber:
        this.fetchedMetadataVersionNumbers[
          this.currentPositionInMetadataVersionHistoryList - 2
        ],
      committerUsername:
        this.fetchedCommitterUsernames[
          this.currentPositionInMetadataVersionHistoryList - 1
        ],
    };
  }

  getLatestVersionOfExploration(): number | null {
    return this.latestVersionOfExploration;
  }

  setLatestVersionOfExploration(version: number): void {
    this.latestVersionOfExploration = version;
  }

  getCurrentPositionInStateVersionHistoryList(): number {
    return this.currentPositionInStateVersionHistoryList;
  }

  setCurrentPositionInStateVersionHistoryList(
    currentPositionInVersionHistoryList: number
  ): void {
    this.currentPositionInStateVersionHistoryList =
      currentPositionInVersionHistoryList;
  }

  decrementCurrentPositionInStateVersionHistoryList(): void {
    this.currentPositionInStateVersionHistoryList =
      this.currentPositionInStateVersionHistoryList - 1;
  }

  incrementCurrentPositionInStateVersionHistoryList(): void {
    this.currentPositionInStateVersionHistoryList =
      this.currentPositionInStateVersionHistoryList + 1;
  }

  getCurrentPositionInMetadataVersionHistoryList(): number {
    return this.currentPositionInMetadataVersionHistoryList;
  }

  setCurrentPositionInMetadataVersionHistoryList(
    currentPositionInVersionHistoryList: number
  ): void {
    this.currentPositionInMetadataVersionHistoryList =
      currentPositionInVersionHistoryList;
  }

  decrementCurrentPositionInMetadataVersionHistoryList(): void {
    this.currentPositionInMetadataVersionHistoryList =
      this.currentPositionInMetadataVersionHistoryList - 1;
  }

  incrementCurrentPositionInMetadataVersionHistoryList(): void {
    this.currentPositionInMetadataVersionHistoryList =
      this.currentPositionInMetadataVersionHistoryList + 1;
  }
}
