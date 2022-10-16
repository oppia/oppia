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
  _fetchedStateData: State[] = [];
  _fetchedMetadata: ExplorationMetadata[] = [];
  _fetchedCommitterUsernames: string[] = [];
  _fetchedStateVersionNumbers: number[] = [];
  _fetchedMetadataVersionNumbers: number[] = [];
  _currentPositionInStateVersionHistoryList: number = null;
  _currentPositionInMetadataVersionHistoryList: number = null;

  constructor() {}

  init(explorationVersion: number): void {
    this._latestVersionOfExploration = explorationVersion;
  }

  resetStateVersionHistory(): void {
    this._fetchedStateData = [];
    this._fetchedStateVersionNumbers = [];
    this._fetchedCommitterUsernames = [];
    this._currentPositionInStateVersionHistoryList = null;
  }

  resetMetadataVersionHistory(): void {
    this._fetchedMetadata = [];
    this._fetchedMetadataVersionNumbers = [];
    this._fetchedCommitterUsernames = [];
    this._currentPositionInMetadataVersionHistoryList = null;
  }

  shouldFetchNewStateVersionHistory(): boolean {
    if (
      this._currentPositionInStateVersionHistoryList <
        this._fetchedStateVersionNumbers.length - 2
    ) {
      return false;
    }
    return true;
  }

  shouldFetchNewMetadataVersionHistory(): boolean {
    if (
      this._currentPositionInMetadataVersionHistoryList <
        this._fetchedMetadataVersionNumbers.length - 2
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
    if (this._fetchedMetadataVersionNumbers.at(-1) === versionNumber) {
      return;
    }
    this._fetchedMetadataVersionNumbers.push(versionNumber);
    this._fetchedMetadata.push(metadata);
    this._fetchedCommitterUsernames.push(committerUsername);
    if (this._currentPositionInMetadataVersionHistoryList === null) {
      this._currentPositionInMetadataVersionHistoryList = 0;
    }
  }

  insertStateVersionHistoryData(
      versionNumber: number,
      stateData: State,
      committerUsername: string
  ): void {
    // If the version number already exists, then don't update the list.
    if (this._fetchedStateVersionNumbers.at(-1) === versionNumber) {
      return;
    }
    this._fetchedStateVersionNumbers.push(versionNumber);
    this._fetchedStateData.push(stateData);
    this._fetchedCommitterUsernames.push(committerUsername);
    if (this._currentPositionInStateVersionHistoryList === null) {
      this._currentPositionInStateVersionHistoryList = 0;
    }
  }

  canShowBackwardStateDiffData(): boolean {
    return (
      this._currentPositionInStateVersionHistoryList >= 0 &&
      this._currentPositionInStateVersionHistoryList <
        this._fetchedStateVersionNumbers.length - 1 &&
      this._fetchedStateVersionNumbers[
        this._currentPositionInStateVersionHistoryList + 1] !== null &&
      this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList + 1] !== null
    );
  }

  canShowForwardStateDiffData(): boolean {
    return (
      this._currentPositionInStateVersionHistoryList >= 2 &&
      this._currentPositionInStateVersionHistoryList <
        this._fetchedStateVersionNumbers.length &&
      this._fetchedStateVersionNumbers[
        this._currentPositionInStateVersionHistoryList - 1] !== null &&
      this._fetchedStateVersionNumbers[
        this._currentPositionInStateVersionHistoryList - 2] !== null &&
      this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList - 1] !== null &&
      this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList - 2] !== null
    );
  }

  getBackwardStateDiffData(): StateDiffData {
    return {
      oldState: this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList + 1],
      newState: this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList],
      oldVersionNumber: (
        this._fetchedStateVersionNumbers[
          this._currentPositionInStateVersionHistoryList + 1]),
      newVersionNumber: (
        this._fetchedStateVersionNumbers[
          this._currentPositionInStateVersionHistoryList]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInStateVersionHistoryList + 1])
    };
  }

  getForwardStateDiffData(): StateDiffData {
    return {
      oldState: this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList - 1],
      newState: this._fetchedStateData[
        this._currentPositionInStateVersionHistoryList - 2],
      oldVersionNumber: (
        this._fetchedStateVersionNumbers[
          this._currentPositionInStateVersionHistoryList - 1]),
      newVersionNumber: (
        this._fetchedStateVersionNumbers[
          this._currentPositionInStateVersionHistoryList - 2]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInStateVersionHistoryList - 1])
    };
  }

  canShowBackwardMetadataDiffData(): boolean {
    return (
      this._currentPositionInMetadataVersionHistoryList >= 0 &&
      this._currentPositionInMetadataVersionHistoryList <
        this._fetchedMetadataVersionNumbers.length - 1 &&
      this._fetchedMetadataVersionNumbers[
        this._currentPositionInMetadataVersionHistoryList + 1] !== null &&
      this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList + 1] !== null
    );
  }

  canShowForwardMetadataDiffData(): boolean {
    return (
      this._currentPositionInMetadataVersionHistoryList >= 2 &&
      this._currentPositionInMetadataVersionHistoryList <
        this._fetchedMetadataVersionNumbers.length &&
      this._fetchedMetadataVersionNumbers[
        this._currentPositionInMetadataVersionHistoryList - 1] !== null &&
      this._fetchedMetadataVersionNumbers[
        this._currentPositionInMetadataVersionHistoryList - 2] !== null &&
      this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList - 1] !== null &&
      this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList - 2] !== null
    );
  }

  getBackwardMetadataDiffData(): MetadataDiffData {
    return {
      oldMetadata: this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList + 1],
      newMetadata: this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList],
      oldVersionNumber: (
        this._fetchedMetadataVersionNumbers[
          this._currentPositionInMetadataVersionHistoryList + 1]),
      newVersionNumber: (
        this._fetchedMetadataVersionNumbers[
          this._currentPositionInMetadataVersionHistoryList]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInMetadataVersionHistoryList + 1])
    };
  }

  getForwardMetadataDiffData(): MetadataDiffData {
    return {
      oldMetadata: this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList - 1],
      newMetadata: this._fetchedMetadata[
        this._currentPositionInMetadataVersionHistoryList - 2],
      oldVersionNumber: (
        this._fetchedMetadataVersionNumbers[
          this._currentPositionInMetadataVersionHistoryList - 1]),
      newVersionNumber: (
        this._fetchedMetadataVersionNumbers[
          this._currentPositionInMetadataVersionHistoryList - 2]),
      committerUsername: (
        this._fetchedCommitterUsernames[
          this._currentPositionInMetadataVersionHistoryList - 1])
    };
  }

  getLatestVersionOfExploration(): number {
    return this._latestVersionOfExploration;
  }

  setLatestVersionOfExploration(version: number): void {
    this._latestVersionOfExploration = version;
  }

  getCurrentPositionInStateVersionHistoryList(): number {
    return this._currentPositionInStateVersionHistoryList;
  }

  setCurrentPositionInStateVersionHistoryList(
      currentPositionInVersionHistoryList: number
  ): void {
    this._currentPositionInStateVersionHistoryList = (
      currentPositionInVersionHistoryList);
  }

  decrementCurrentPositionInStateVersionHistoryList(): void {
    this._currentPositionInStateVersionHistoryList = (
      this._currentPositionInStateVersionHistoryList - 1);
  }

  incrementCurrentPositionInStateVersionHistoryList(): void {
    this._currentPositionInStateVersionHistoryList = (
      this._currentPositionInStateVersionHistoryList + 1);
  }

  getCurrentPositionInMetadataVersionHistoryList(): number {
    return this._currentPositionInMetadataVersionHistoryList;
  }

  setCurrentPositionInMetadataVersionHistoryList(
      currentPositionInVersionHistoryList: number
  ): void {
    this._currentPositionInMetadataVersionHistoryList = (
      currentPositionInVersionHistoryList);
  }

  decrementCurrentPositionInMetadataVersionHistoryList(): void {
    this._currentPositionInMetadataVersionHistoryList = (
      this._currentPositionInMetadataVersionHistoryList - 1);
  }

  incrementCurrentPositionInMetadataVersionHistoryList(): void {
    this._currentPositionInMetadataVersionHistoryList = (
      this._currentPositionInMetadataVersionHistoryList + 1);
  }
}

angular.module('oppia').factory(
  'VersionHistoryService',
  downgradeInjectable(VersionHistoryService));
