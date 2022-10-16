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

import { Injectable } from '@angular/core';
import { downgradeInjectable } from '@angular/upgrade/static';
import { ExplorationMetadata } from 'domain/exploration/ExplorationMetadataObjectFactory';
import { State } from 'domain/state/StateObjectFactory';

export interface StateDiffData {
  oldState: State;
  newState: State;
  oldVersionNumber: number;
  newVersionNumber: number;
  committerUsername: string;
}

export interface MetadataDiffData {
  oldMetadata: ExplorationMetadata;
  newMetadata: ExplorationMetadata;
  oldVersionNumber: number;
  newVersionNumber: number;
  committerUsername: string;
}

@Injectable({
  providedIn: 'root'
})
export class VersionHistoryService {
  _latestVersionOfExploration: number = null;
  _currentPositionInVersionHistoryList: number = null;
  _fetchedVersionNumbers: number[] = [];
  _fetchedStateData: State[] = [];
  _fetchedMetadata: ExplorationMetadata[] = [];
  _fetchedCommitterUsernames: string[] = [];

  constructor() {}

  init(explorationVersion: number): void {
    this._latestVersionOfExploration = explorationVersion;
  }

  reset(): void {
    this._fetchedStateData = [];
    this._fetchedVersionNumbers = [];
    this._fetchedMetadata = [];
    this._fetchedCommitterUsernames = [];
    this._currentPositionInVersionHistoryList = null;
  }

  shouldFetchNewData(): boolean {
    if (
      this._currentPositionInVersionHistoryList <
        this._fetchedVersionNumbers.length - 2
    ) {
      return false;
    }
    return true;
  }

  insertMetadataVersionHistoryData(
      versionNumber: number,
      metadata: ExplorationMetadata,
      committerUsername: string
  ): void {
    // If the version number already exists, then don't update the list.
    if (this._fetchedVersionNumbers.at(-1) === versionNumber) {
      return;
    }
    this._fetchedVersionNumbers.push(versionNumber);
    this._fetchedMetadata.push(metadata);
    this._fetchedCommitterUsernames.push(committerUsername);
    if (this._currentPositionInVersionHistoryList === null) {
      this._currentPositionInVersionHistoryList = 0;
    }
  }

  insertStateVersionHistoryData(
      versionNumber: number,
      stateData: State,
      committerUsername: string
  ): void {
    // If the version number already exists, then don't update the list.
    if (this._fetchedVersionNumbers.at(-1) === versionNumber) {
      return;
    }
    this._fetchedVersionNumbers.push(versionNumber);
    this._fetchedStateData.push(stateData);
    this._fetchedCommitterUsernames.push(committerUsername);
    if (this._currentPositionInVersionHistoryList === null) {
      this._currentPositionInVersionHistoryList = 0;
    }
  }

  canShowBackwardStateDiffData(): boolean {
    return (
      this._currentPositionInVersionHistoryList >= 0 &&
      this._currentPositionInVersionHistoryList <
        this._fetchedVersionNumbers.length - 1 &&
      this._fetchedVersionNumbers[
        this._currentPositionInVersionHistoryList + 1] !== null &&
      this._fetchedStateData[
        this._currentPositionInVersionHistoryList + 1] !== null
    );
  }

  canShowForwardStateDiffData(): boolean {
    return (
      this._currentPositionInVersionHistoryList >= 2 &&
      this._currentPositionInVersionHistoryList <
        this._fetchedVersionNumbers.length &&
      this._fetchedVersionNumbers[
        this._currentPositionInVersionHistoryList - 1] !== null &&
      this._fetchedVersionNumbers[
        this._currentPositionInVersionHistoryList - 2] !== null &&
      this._fetchedStateData[
        this._currentPositionInVersionHistoryList - 1] !== null &&
      this._fetchedStateData[
        this._currentPositionInVersionHistoryList - 2] !== null
    );
  }

  getBackwardStateDiffData(): StateDiffData {
    return {
      oldState: this._fetchedStateData[
        this._currentPositionInVersionHistoryList + 1],
      newState: this._fetchedStateData[
        this._currentPositionInVersionHistoryList],
      oldVersionNumber: (
        this._fetchedVersionNumbers[
          this._currentPositionInVersionHistoryList + 1]),
      newVersionNumber: (
        this._fetchedVersionNumbers[this._currentPositionInVersionHistoryList]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInVersionHistoryList + 1])
    };
  }

  getForwardStateDiffData(): StateDiffData {
    return {
      oldState: this._fetchedStateData[
        this._currentPositionInVersionHistoryList - 1],
      newState: this._fetchedStateData[
        this._currentPositionInVersionHistoryList - 2],
      oldVersionNumber: (
        this._fetchedVersionNumbers[
          this._currentPositionInVersionHistoryList - 1]),
      newVersionNumber: (
        this._fetchedVersionNumbers[
          this._currentPositionInVersionHistoryList - 2]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInVersionHistoryList - 1])
    };
  }

  canShowBackwardMetadataDiffData(): boolean {
    return (
      this._currentPositionInVersionHistoryList >= 0 &&
      this._currentPositionInVersionHistoryList <
        this._fetchedVersionNumbers.length - 1 &&
      this._fetchedVersionNumbers[
        this._currentPositionInVersionHistoryList + 1] !== null &&
      this._fetchedMetadata[
        this._currentPositionInVersionHistoryList + 1] !== null
    );
  }

  canShowForwardMetadataDiffData(): boolean {
    return (
      this._currentPositionInVersionHistoryList >= 2 &&
      this._currentPositionInVersionHistoryList <
        this._fetchedVersionNumbers.length &&
      this._fetchedVersionNumbers[
        this._currentPositionInVersionHistoryList - 1] !== null &&
      this._fetchedVersionNumbers[
        this._currentPositionInVersionHistoryList - 2] !== null &&
      this._fetchedMetadata[
        this._currentPositionInVersionHistoryList - 1] !== null &&
      this._fetchedMetadata[
        this._currentPositionInVersionHistoryList - 2] !== null
    );
  }

  getBackwardMetadataDiffData(): MetadataDiffData {
    return {
      oldMetadata: this._fetchedMetadata[
        this._currentPositionInVersionHistoryList + 1],
      newMetadata: this._fetchedMetadata[
        this._currentPositionInVersionHistoryList],
      oldVersionNumber: (
        this._fetchedVersionNumbers[
          this._currentPositionInVersionHistoryList + 1]),
      newVersionNumber: (
        this._fetchedVersionNumbers[this._currentPositionInVersionHistoryList]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInVersionHistoryList + 1])
    };
  }

  getForwardMetadataDiffData(): MetadataDiffData {
    return {
      oldMetadata: this._fetchedMetadata[
        this._currentPositionInVersionHistoryList - 1],
      newMetadata: this._fetchedMetadata[
        this._currentPositionInVersionHistoryList - 2],
      oldVersionNumber: (
        this._fetchedVersionNumbers[
          this._currentPositionInVersionHistoryList - 1]),
      newVersionNumber: (
        this._fetchedVersionNumbers[
          this._currentPositionInVersionHistoryList - 2]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInVersionHistoryList - 1])
    };
  }

  getLatestVersionOfExploration(): number {
    return this._latestVersionOfExploration;
  }

  setLatestVersionOfExploration(version: number): void {
    this._latestVersionOfExploration = version;
  }

  getCurrentPositionInVersionHistoryList(): number {
    return this._currentPositionInVersionHistoryList;
  }

  setCurrentPositionInVersionHistoryList(
      currentPositionInVersionHistoryList: number
  ): void {
    this._currentPositionInVersionHistoryList = (
      currentPositionInVersionHistoryList);
  }

  decrementCurrentPositionInVersionHistoryList(): void {
    this._currentPositionInVersionHistoryList = (
      this._currentPositionInVersionHistoryList - 1);
  }

  incrementCurrentPositionInVersionHistoryList(): void {
    this._currentPositionInVersionHistoryList = (
      this._currentPositionInVersionHistoryList + 1);
  }
}

angular.module('oppia').factory(
  'VersionHistoryService',
  downgradeInjectable(VersionHistoryService));
