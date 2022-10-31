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

import { OnInit } from '@angular/core';
import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmOrCancelModal } from 'components/common-layout-directives/common-elements/confirm-or-cancel-modal.component';
import { State } from 'domain/state/StateObjectFactory';
import { ContextService } from 'services/context.service';
import { HistoryTabYamlConversionService } from '../services/history-tab-yaml-conversion.service';
import { VersionHistoryBackendApiService, StateVersionHistoryResponse } from '../services/version-history-backend-api.service';
import { VersionHistoryService } from '../services/version-history.service';

interface headersAndYamlStrs {
  leftPane: string;
  rightPane: string;
}

interface mergeviewOptions {
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
  committerUsername: string | null;
  oldVersion: number | null;
  newState: State | null;
  oldState: State | null;
  newStateName: string;
  oldStateName: string;
  yamlStrs: headersAndYamlStrs = {
    leftPane: '',
    rightPane: '',
  };

  CODEMIRROR_MERGEVIEW_OPTIONS: mergeviewOptions = {
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
    return (
      this.versionHistoryService.getBackwardStateDiffData().oldVersionNumber);
  }

  getLastEditedCommitterUsername(): string {
    return (
      this.versionHistoryService.getBackwardStateDiffData().committerUsername);
  }

  // Returns the next version number at which the state was modified.
  getNextEditedVersionNumber(): number {
    return (
      this.versionHistoryService.getForwardStateDiffData().oldVersionNumber);
  }

  getNextEditedCommitterUsername(): string {
    return (
      this.versionHistoryService.getForwardStateDiffData().committerUsername);
  }

  onClickExploreForwardVersionHistory(): void {
    this.yamlStrs.leftPane = '';
    this.yamlStrs.rightPane = '';

    const diffData = this.versionHistoryService.getForwardStateDiffData();

    this.newState = diffData.newState;
    this.oldState = diffData.oldState;
    this.newStateName = diffData.newState.name;
    this.oldStateName = diffData.oldState.name;
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this
      .versionHistoryService
      .decrementCurrentPositionInStateVersionHistoryList();
  }

  onClickExploreBackwardVersionHistory(): void {
    this.yamlStrs.leftPane = '';
    this.yamlStrs.rightPane = '';

    const diffData = this.versionHistoryService.getBackwardStateDiffData();

    this.newState = diffData.newState;
    this.oldState = diffData.oldState;
    this.newStateName = diffData.newState.name;
    this.oldStateName = diffData.oldState.name;
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this.fetchPreviousVersionHistory();
  }

  fetchPreviousVersionHistory(): void {
    if (!this.versionHistoryService.shouldFetchNewStateVersionHistory()) {
      this.versionHistoryService
        .incrementCurrentPositionInStateVersionHistoryList();
      return;
    }
    const diffData = this.versionHistoryService.getBackwardStateDiffData();
    if (diffData.oldVersionNumber !== null) {
      this.versionHistoryBackendApiService.fetchStateVersionHistoryAsync(
        this.contextService.getExplorationId(),
        diffData.oldState.name, diffData.oldVersionNumber
      ).then((response: StateVersionHistoryResponse) => {
        this.versionHistoryService.insertStateVersionHistoryData(
          response.lastEditedVersionNumber,
          response.stateInPreviousVersion,
          response.lastEditedCommitterUsername
        );
        this.versionHistoryService
          .incrementCurrentPositionInStateVersionHistoryList();
      });
    }
  }

  updateLeftPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.oldState)
      .then((result) => {
        this.yamlStrs.leftPane = result;
      });
  }

  updateRightPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.newState)
      .then((result) => {
        this.yamlStrs.rightPane = result;
      });
  }

  ngOnInit(): void {
    this.updateLeftPane();
    this.updateRightPane();

    this.fetchPreviousVersionHistory();
  }
}
