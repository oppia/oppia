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
import { ExplorationMetadata } from 'domain/exploration/ExplorationMetadataObjectFactory';
import { ContextService } from 'services/context.service';
import { HistoryTabYamlConversionService } from '../services/history-tab-yaml-conversion.service';
import { VersionHistoryBackendApiService } from '../services/version-history-backend-api.service';
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
  selector: 'oppia-metadata-version-history',
  templateUrl: './metadata-version-history-modal.component.html',
})
export class MetadataVersionHistoryModalComponent
  extends ConfirmOrCancelModal implements OnInit {
  committerUsername: string | null = null;
  oldVersion: number | null = null;
  newMetadata: ExplorationMetadata | null = null;
  oldMetadata: ExplorationMetadata | null = null;
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
    return this.versionHistoryService.canShowBackwardMetadataDiffData();
  }

  canExploreForwardVersionHistory(): boolean {
    return this.versionHistoryService.canShowForwardMetadataDiffData();
  }

  // The return value of the below function can never be null because it is
  // called only when canExploreBackwardVersionHistory() returns true.
  // If the previously edited version number is null,
  // canExploreBackwardVersionHistory() would have returned false. Here,
  // the return value is written as (number | null) in order to fix the
  // typescript errors. Also, the return value null represents the end of
  // version history for that particular state i.e. we have reached the end
  // of the version history and the state was not edited in any
  // earlier versions.
  getLastEditedVersionNumber(): number | null {
    return (
      this
        .versionHistoryService
        .getBackwardMetadataDiffData()
        .oldVersionNumber
    );
  }

  getLastEditedCommitterUsername(): string {
    return (
      this
        .versionHistoryService
        .getBackwardMetadataDiffData()
        .committerUsername
    );
  }

  // Returns the next version number at which the state was modified.
  getNextEditedVersionNumber(): number | null {
    return (
      this
        .versionHistoryService
        .getForwardMetadataDiffData()
        .oldVersionNumber
    );
  }

  getNextEditedCommitterUsername(): string {
    return (
      this
        .versionHistoryService
        .getForwardMetadataDiffData()
        .committerUsername
    );
  }

  onClickExploreForwardVersionHistory(): void {
    this.yamlStrs.leftPane = '';
    this.yamlStrs.rightPane = '';

    const diffData = this.versionHistoryService.getForwardMetadataDiffData();

    this.newMetadata = diffData.newMetadata;
    this.oldMetadata = diffData.oldMetadata;
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this.versionHistoryService
      .decrementCurrentPositionInMetadataVersionHistoryList();
  }

  onClickExploreBackwardVersionHistory(): void {
    this.yamlStrs.leftPane = '';
    this.yamlStrs.rightPane = '';

    const diffData = this.versionHistoryService.getBackwardMetadataDiffData();

    this.oldMetadata = diffData.oldMetadata;
    this.newMetadata = diffData.newMetadata;
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this.fetchPreviousVersionHistory();
  }

  fetchPreviousVersionHistory(): void {
    if (!this.versionHistoryService.shouldFetchNewMetadataVersionHistory()) {
      this.versionHistoryService
        .incrementCurrentPositionInMetadataVersionHistoryList();
      return;
    }
    const diffData = this.versionHistoryService.getBackwardMetadataDiffData();
    if (diffData.oldVersionNumber !== null) {
      this.versionHistoryBackendApiService.fetchMetadataVersionHistoryAsync(
        this.contextService.getExplorationId(), diffData.oldVersionNumber
      ).then((response) => {
        if (response !== null) {
          this.versionHistoryService.insertMetadataVersionHistoryData(
            response.lastEditedVersionNumber,
            response.metadataInPreviousVersion,
            response.lastEditedCommitterUsername
          );
          this.versionHistoryService
            .incrementCurrentPositionInMetadataVersionHistoryList();
        }
      });
    }
  }

  updateLeftPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.oldMetadata)
      .then((result) => {
        this.yamlStrs.leftPane = result;
      });
  }

  updateRightPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.newMetadata)
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
