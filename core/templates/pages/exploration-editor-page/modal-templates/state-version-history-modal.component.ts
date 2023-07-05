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
 * @fileoverview Component for state changes modal.
 */

import { Input, OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { State } from 'domain/state/StateObjectFactory';
import { ContextService } from 'services/context.service';
import { HistoryTabYamlConversionService } from '../services/history-tab-yaml-conversion.service';
import { VersionHistoryBackendApiService } from '../services/version-history-backend-api.service';
import { VersionHistoryService } from '../services/version-history.service';

interface HeadersAndYamlStrs {
  previousVersionStateYaml: string;
  currentVersionStateYaml: string;
}

interface MergeviewOptions {
  lineNumbers: boolean;
  readOnly: boolean;
  mode: string;
  viewportMargin: number;
}

@Component({
  selector: 'oppia-state-version-history-modal',
  templateUrl: './state-version-history-modal.component.html',
})
export class StateVersionHistoryModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  @Input() committerUsername!: string;
  @Input() oldVersion: number | null = null;
  @Input() newState!: State;
  @Input() oldState!: State;
  @Input() newStateName!: string;
  @Input() oldStateName!: string;
  validationErrorIsShown: boolean = false;
  yamlStrs: HeadersAndYamlStrs = {
    previousVersionStateYaml: '',
    currentVersionStateYaml: '',
  };

  CODEMIRROR_MERGEVIEW_OPTIONS: MergeviewOptions = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml',
    viewportMargin: 100
  };

  constructor(
      private ngbActiveModal: NgbActiveModal,
      private contextService: ContextService,
      private versionHistoryService: VersionHistoryService,
      private versionHistoryBackendApiService: VersionHistoryBackendApiService,
      private historyTabYamlConversionService: HistoryTabYamlConversionService
  ) {
    super(ngbActiveModal);
  }

  canExploreBackwardVersionHistory(): boolean {
    return this.versionHistoryService.canShowBackwardStateDiffData();
  }

  canExploreForwardVersionHistory(): boolean {
    return this.versionHistoryService.canShowForwardStateDiffData();
  }

  getLastEditedVersionNumber(): number {
    const lastEditedVersionNumber =
      this.versionHistoryService.getBackwardStateDiffData().oldVersionNumber;
    if (lastEditedVersionNumber === null) {
      // A null value for lastEditedVersionNumber marks the end of the version
      // history for a particular state. This is impossible here because this
      // function 'getLastEditedVersionNumber' is called only when
      // canExploreBackwardVersionHistory() returns true. This function will
      // not return true when we reach the end of the version history list.
      throw new Error('Last edited version number cannot be null');
    }
    return lastEditedVersionNumber;
  }

  getLastEditedVersionNumberInCaseOfError(): number {
    return (
      this.versionHistoryService.fetchedStateVersionNumbers[
        this.versionHistoryService
          .getCurrentPositionInStateVersionHistoryList()] as number);
  }

  getLastEditedCommitterUsername(): string {
    return (
      this.versionHistoryService.getBackwardStateDiffData().committerUsername);
  }

  getNextEditedVersionNumber(): number {
    const nextEditedVersionNumber =
      this.versionHistoryService.getForwardStateDiffData().oldVersionNumber;
    if (nextEditedVersionNumber === null) {
      // A null value for nextEditedVersionNumber marks the end of the version
      // history for a particular state. This is impossible here because this
      // function 'getNextEditedVersionNumber' is called only when
      // canExploreForwardVersionHistory() returns true. This function will
      // not return true when we reach the end of the version history list.
      throw new Error('Next edited version number cannot be null');
    }
    return nextEditedVersionNumber;
  }

  getNextEditedCommitterUsername(): string {
    return (
      this.versionHistoryService.getForwardStateDiffData().committerUsername);
  }

  onClickExploreForwardVersionHistory(): void {
    this.yamlStrs.previousVersionStateYaml = '';
    this.yamlStrs.currentVersionStateYaml = '';

    const diffData = this.versionHistoryService.getForwardStateDiffData();

    // The explanation for these if-conditions is added in the below function.
    if (diffData.newState) {
      this.newState = diffData.newState;
      if (diffData.newState.name === null) {
        // The state name is null before having a state
        // (please refer to the implementation of State object from
        // StateObjectFactory.ts). This cannot happen here because
        // all the states will be properly defined and will have a name during
        // version history navigation.
        throw new Error('State name cannot be null');
      }
      this.newStateName = diffData.newState.name;
    }
    if (diffData.oldState) {
      this.oldState = diffData.oldState;
      if (diffData.oldState.name === null) {
        // The state name is null before having a state
        // (please refer to the implementation of State object from
        // StateObjectFactory.ts). This cannot happen here because
        // all the states will be properly defined and will have a name during
        // version history navigation.
        throw new Error('State name cannot be null');
      }
      this.oldStateName = diffData.oldState.name;
    }
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this.validationErrorIsShown = false;

    this
      .versionHistoryService
      .decrementCurrentPositionInStateVersionHistoryList();
  }

  onClickExploreBackwardVersionHistory(): void {
    this.yamlStrs.previousVersionStateYaml = '';
    this.yamlStrs.currentVersionStateYaml = '';

    const diffData = this.versionHistoryService.getBackwardStateDiffData();

    // Explanation for why diffData.newState can be null:
    // It is explained in VersionHistoryService as to why the values of
    // newState or oldState can be null. This is because they are elements of
    // the list fetchedStateData whose last element can be null which marks
    // the end of the version history of that particular state.
    if (diffData.newState) {
      this.newState = diffData.newState;
      if (diffData.newState.name === null) {
        // The state name is null before having a state
        // (please refer to the implementation of State object from
        // StateObjectFactory.ts). This cannot happen here because
        // all the states will be properly defined and will have a name during
        // version history navigation.
        throw new Error('State name cannot be null');
      }
      this.newStateName = diffData.newState.name;
    }
    if (diffData.oldState) {
      this.oldState = diffData.oldState;
      if (diffData.oldState.name === null) {
        // The state name is null before having a state
        // (please refer to the implementation of State object from
        // StateObjectFactory.ts). This cannot happen here because
        // all the states will be properly defined and will have a name during
        // version history navigation.
        throw new Error('State name cannot be null');
      }
      this.oldStateName = diffData.oldState.name;
    }
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this.validationErrorIsShown = false;

    this.fetchPreviousVersionHistory();
  }

  fetchPreviousVersionHistory(): void {
    if (!this.versionHistoryService.shouldFetchNewStateVersionHistory()) {
      this.versionHistoryService
        .incrementCurrentPositionInStateVersionHistoryList();
      return;
    }
    const diffData = this.versionHistoryService.getBackwardStateDiffData();
    if (!diffData.oldState) {
      // The state data for the previous version should be available for
      // fetching the next element of the version history list. Here, it will
      // always be available and hence this error will never be thrown because
      // we check whether the diffData.oldVersionNumber is null or not.
      // If it is null, we do not fetch anything.
      throw new Error(
        'The state data for the previous version is not available.'
      );
    }
    if (diffData.oldState.name === null) {
      // The state name is null before having a state
      // (please refer to the implementation of State object from
      // StateObjectFactory.ts). This cannot happen here because
      // all the states will be properly defined and will have a name during
      // version history navigation.
      throw new Error(
        'The name of the state in the previous version was not specified.'
      );
    }
    if (diffData.oldVersionNumber !== null) {
      this.versionHistoryBackendApiService.fetchStateVersionHistoryAsync(
        this.contextService.getExplorationId(),
        diffData.oldState.name, diffData.oldVersionNumber
      ).then((response) => {
        if (response !== null) {
          this.versionHistoryService.insertStateVersionHistoryData(
            response.lastEditedVersionNumber,
            response.stateInPreviousVersion,
            response.lastEditedCommitterUsername
          );
          this.versionHistoryService
            .incrementCurrentPositionInStateVersionHistoryList();
        } else {
          this.validationErrorIsShown = true;
          this.versionHistoryService
            .incrementCurrentPositionInStateVersionHistoryList();
        }
      });
    }
  }

  updateLeftPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.oldState)
      .then((result) => {
        this.yamlStrs.previousVersionStateYaml = result;
      });
  }

  updateRightPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.newState)
      .then((result) => {
        this.yamlStrs.currentVersionStateYaml = result;
      });
  }

  ngOnInit(): void {
    this.updateLeftPane();
    this.updateRightPane();

    this.fetchPreviousVersionHistory();
  }
}
