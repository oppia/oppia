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
  providedIn: 'root'
})
export class VersionHistoryService {
  latestVersionOfExploration: number | null = null;
  fetchedStateData: (State | null) [] = [];
  fetchedMetadata: (ExplorationMetadata | null) [] = [];
  fetchedCommitterUsernames: string[] = [];
  fetchedStateVersionNumbers: (number | null) [] = [];
  fetchedMetadataVersionNumbers: (number | null) [] = [];
  currentPositionInStateVersionHistoryList: number| null = null;
  currentPositionInMetadataVersionHistoryList: number | null = null;

  constructor() {}

  init(explorationVersion: number): void {
    this.latestVersionOfExploration = explorationVersion;
  }

  resetStateVersionHistory(): void {
    this.fetchedStateData = [];
    this.fetchedStateVersionNumbers = [];
    this.fetchedCommitterUsernames = [];
    this.currentPositionInStateVersionHistoryList = null;
  }

  resetMetadataVersionHistory(): void {
    this.fetchedMetadata = [];
    this.fetchedMetadataVersionNumbers = [];
    this.fetchedCommitterUsernames = [];
    this.currentPositionInMetadataVersionHistoryList = null;
  }

  shouldFetchNewStateVersionHistory(): boolean {
    if (
      this.currentPositionInStateVersionHistoryList &&
      this.currentPositionInStateVersionHistoryList <
        this.fetchedStateVersionNumbers.length - 2
    ) {
      return false;
    }
    return true;
  }

  shouldFetchNewMetadataVersionHistory(): boolean {
    if (
      this.currentPositionInMetadataVersionHistoryList &&
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
    if (this.currentPositionInMetadataVersionHistoryList === null) {
      this.currentPositionInMetadataVersionHistoryList = 0;
    }
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
    if (this.currentPositionInStateVersionHistoryList === null) {
      this.currentPositionInStateVersionHistoryList = 0;
    }
  }

  canShowBackwardStateDiffData(): boolean {
    return (
      this.currentPositionInStateVersionHistoryList !== null &&
      this.currentPositionInStateVersionHistoryList >= 0 &&
      this.currentPositionInStateVersionHistoryList <
        this.fetchedStateVersionNumbers.length - 1 &&
      this.fetchedStateVersionNumbers[
        this.currentPositionInStateVersionHistoryList + 1] !== null &&
      this.fetchedStateData[
        this.currentPositionInStateVersionHistoryList + 1] !== null
    );
  }

  canShowForwardStateDiffData(): boolean {
    return (
      this.currentPositionInStateVersionHistoryList !== null &&
      this.currentPositionInStateVersionHistoryList >= 2 &&
      this.currentPositionInStateVersionHistoryList <
        this.fetchedStateVersionNumbers.length &&
      this.fetchedStateVersionNumbers[
        this.currentPositionInStateVersionHistoryList - 1] !== null &&
      this.fetchedStateVersionNumbers[
        this.currentPositionInStateVersionHistoryList - 2] !== null &&
      this.fetchedStateData[
        this.currentPositionInStateVersionHistoryList - 1] !== null &&
      this.fetchedStateData[
        this.currentPositionInStateVersionHistoryList - 2] !== null
    );
  }

  getBackwardStateDiffData(): StateDiffData {
    // The following (this.currentPositionInStateVersionHistoryList || 0) is
    // done to fix the typescript errors. Otherwise, when this function will
    // be called, currentPositionInStateVersionHistoryList will always
    // be defined.
    return {
      oldState: this.fetchedStateData[
        (this.currentPositionInStateVersionHistoryList || 0) + 1],
      newState: this.fetchedStateData[
        (this.currentPositionInStateVersionHistoryList || 0)],
      oldVersionNumber: (
        this.fetchedStateVersionNumbers[
          (this.currentPositionInStateVersionHistoryList || 0) + 1]),
      newVersionNumber: (
        this.fetchedStateVersionNumbers[
          (this.currentPositionInStateVersionHistoryList || 0)]),
      committerUsername: (
        this.fetchedCommitterUsernames[
          (this.currentPositionInStateVersionHistoryList || 0) + 1])
    };
  }

  getForwardStateDiffData(): StateDiffData {
    // The following (this.currentPositionInStateVersionHistoryList || 0) is
    // done to fix the typescript errors. Otherwise, when this function will
    // be called, currentPositionInStateVersionHistoryList will always
    // be defined.
    return {
      oldState: this.fetchedStateData[
        (this.currentPositionInStateVersionHistoryList || 0) - 1],
      newState: this.fetchedStateData[
        (this.currentPositionInStateVersionHistoryList || 0) - 2],
      oldVersionNumber: (
        this.fetchedStateVersionNumbers[
          (this.currentPositionInStateVersionHistoryList || 0) - 1]),
      newVersionNumber: (
        this.fetchedStateVersionNumbers[
          (this.currentPositionInStateVersionHistoryList || 0) - 2]),
      committerUsername: (
        this.fetchedCommitterUsernames[
          (this.currentPositionInStateVersionHistoryList || 0) - 1])
    };
  }

  canShowBackwardMetadataDiffData(): boolean {
    return (
      this.currentPositionInMetadataVersionHistoryList !== null &&
      this.currentPositionInMetadataVersionHistoryList >= 0 &&
      this.currentPositionInMetadataVersionHistoryList <
        this.fetchedMetadataVersionNumbers.length - 1 &&
      this.fetchedMetadataVersionNumbers[
        this.currentPositionInMetadataVersionHistoryList + 1] !== null &&
      this.fetchedMetadata[
        this.currentPositionInMetadataVersionHistoryList + 1] !== null
    );
  }

  canShowForwardMetadataDiffData(): boolean {
    return (
      this.currentPositionInMetadataVersionHistoryList !== null &&
      this.currentPositionInMetadataVersionHistoryList >= 2 &&
      this.currentPositionInMetadataVersionHistoryList <
        this.fetchedMetadataVersionNumbers.length &&
      this.fetchedMetadataVersionNumbers[
        this.currentPositionInMetadataVersionHistoryList - 1] !== null &&
      this.fetchedMetadataVersionNumbers[
        this.currentPositionInMetadataVersionHistoryList - 2] !== null &&
      this.fetchedMetadata[
        this.currentPositionInMetadataVersionHistoryList - 1] !== null &&
      this.fetchedMetadata[
        this.currentPositionInMetadataVersionHistoryList - 2] !== null
    );
  }

  getBackwardMetadataDiffData(): MetadataDiffData {
    // The following (this.currentPositionInMetadataVersionHistoryList || 0) is
    // done to fix the typescript errors. Otherwise, when this function will
    // be called, currentPositionInMetadataVersionHistoryList will always
    // be defined.
    return {
      oldMetadata: this.fetchedMetadata[
        (this.currentPositionInMetadataVersionHistoryList || 0) + 1],
      newMetadata: this.fetchedMetadata[
        (this.currentPositionInMetadataVersionHistoryList || 0)],
      oldVersionNumber: (
        this.fetchedMetadataVersionNumbers[
          (this.currentPositionInMetadataVersionHistoryList || 0) + 1]),
      newVersionNumber: (
        this.fetchedMetadataVersionNumbers[
          (this.currentPositionInMetadataVersionHistoryList || 0)]),
      committerUsername: (
        this.fetchedCommitterUsernames[
          (this.currentPositionInMetadataVersionHistoryList || 0) + 1])
    };
  }

  getForwardMetadataDiffData(): MetadataDiffData {
    // The following (this.currentPositionInMetadataVersionHistoryList || 0) is
    // done to fix the typescript errors. Otherwise, when this function will
    // be called, currentPositionInMetadataVersionHistoryList will always
    // be defined.
    return {
      oldMetadata: this.fetchedMetadata[
        (this.currentPositionInMetadataVersionHistoryList || 0) - 1],
      newMetadata: this.fetchedMetadata[
        (this.currentPositionInMetadataVersionHistoryList || 0) - 2],
      oldVersionNumber: (
        this.fetchedMetadataVersionNumbers[
          (this.currentPositionInMetadataVersionHistoryList || 0) - 1]),
      newVersionNumber: (
        this.fetchedMetadataVersionNumbers[
          (this.currentPositionInMetadataVersionHistoryList || 0) - 2]),
      committerUsername: (
        this.fetchedCommitterUsernames[
          (this.currentPositionInMetadataVersionHistoryList || 0) - 1])
    };
  }

  getLatestVersionOfExploration(): number | null {
    return this.latestVersionOfExploration;
  }

  setLatestVersionOfExploration(version: number): void {
    this.latestVersionOfExploration = version;
  }

  getCurrentPositionInStateVersionHistoryList(): number | null {
    return this.currentPositionInStateVersionHistoryList;
  }

  setCurrentPositionInStateVersionHistoryList(
      currentPositionInVersionHistoryList: number
  ): void {
    this.currentPositionInStateVersionHistoryList = (
      currentPositionInVersionHistoryList);
  }

  decrementCurrentPositionInStateVersionHistoryList(): void {
    if (this.currentPositionInStateVersionHistoryList) {
      this.currentPositionInStateVersionHistoryList = (
        this.currentPositionInStateVersionHistoryList - 1);
    }
  }

  incrementCurrentPositionInStateVersionHistoryList(): void {
    if (this.currentPositionInStateVersionHistoryList) {
      this.currentPositionInStateVersionHistoryList = (
        this.currentPositionInStateVersionHistoryList + 1);
    }
  }

  getCurrentPositionInMetadataVersionHistoryList(): number | null {
    return this.currentPositionInMetadataVersionHistoryList;
  }

  setCurrentPositionInMetadataVersionHistoryList(
      currentPositionInVersionHistoryList: number
  ): void {
    this.currentPositionInMetadataVersionHistoryList = (
      currentPositionInVersionHistoryList);
  }

  decrementCurrentPositionInMetadataVersionHistoryList(): void {
    if (this.currentPositionInMetadataVersionHistoryList) {
      this.currentPositionInMetadataVersionHistoryList = (
        this.currentPositionInMetadataVersionHistoryList - 1);
    }
  }

  incrementCurrentPositionInMetadataVersionHistoryList(): void {
    if (this.currentPositionInMetadataVersionHistoryList) {
      this.currentPositionInMetadataVersionHistoryList = (
        this.currentPositionInMetadataVersionHistoryList + 1);
    }
  }
}

angular.module('oppia').factory(
  'VersionHistoryService',
  downgradeInjectable(VersionHistoryService));
