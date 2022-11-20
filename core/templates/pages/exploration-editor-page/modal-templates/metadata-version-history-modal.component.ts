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
import { ExplorationMetadata } from 'domain/exploration/ExplorationMetadataObjectFactory';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { HistoryTabYamlConversionService } from '../services/history-tab-yaml-conversion.service';
import { VersionHistoryBackendApiService } from '../services/version-history-backend-api.service';
import { VersionHistoryService } from '../services/version-history.service';

interface headersAndYamlStrs {
  previousVersionMetadataYaml: string;
  currentVersionMetadataYaml: string;
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
  @Input() committerUsername!: string;
  @Input() oldVersion: number | null = null;
  @Input() newMetadata!: ExplorationMetadata;
  @Input() oldMetadata!: ExplorationMetadata;
  yamlStrs: headersAndYamlStrs = {
    previousVersionMetadataYaml: '',
    currentVersionMetadataYaml: '',
  };

  CODEMIRROR_MERGEVIEW_OPTIONS: mergeviewOptions = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml',
    viewportMargin: 100
  };

  constructor(
      private ngbActiveModal: NgbActiveModal,
      private alertsService: AlertsService,
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

  // In practice, the return value of the below function can never be null
  // because it is called only when canExploreBackwardVersionHistory()
  // returns true. If the previously edited version number is null,
  // canExploreBackwardVersionHistory() would have returned false. Here,
  // the return value is written as (number | null) in order to fix the
  // typescript errors since the list called fetchedMetadataVersionNumbers in
  // VersionHistoryService has type (number | null) []. Also, the return
  // value null represents the end of version history for the exploration
  // metadata i.e. we have reached the end of the version history and the
  // exploration metadata was not edited in any earlier versions.
  getLastEditedVersionNumber(): number {
    const lastEditedVersionNumber = this
      .versionHistoryService
      .getBackwardMetadataDiffData()
      .oldVersionNumber;
    if (lastEditedVersionNumber === null) {
      throw new Error('Last edited version number cannot be null');
    }
    return lastEditedVersionNumber;
  }

  getLastEditedCommitterUsername(): string {
    return (
      this
        .versionHistoryService
        .getBackwardMetadataDiffData()
        .committerUsername
    );
  }

  // Returns the next version number at which the metadata was modified.
  // The explanation for return type being (number | null) is same as explained
  // above the function getLastEditedVersionNumber().
  getNextEditedVersionNumber(): number {
    const nextEditedVersionNumber = this
      .versionHistoryService
      .getForwardMetadataDiffData()
      .oldVersionNumber;
    if (nextEditedVersionNumber === null) {
      throw new Error('Next edited version number cannot be null');
    }
    return nextEditedVersionNumber;
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
    this.yamlStrs.previousVersionMetadataYaml = '';
    this.yamlStrs.currentVersionMetadataYaml = '';

    const diffData = this.versionHistoryService.getForwardMetadataDiffData();

    // The explanation for these if-conditions is added in the below function.
    if (diffData.newMetadata !== null) {
      this.newMetadata = diffData.newMetadata;
    }
    if (diffData.oldMetadata !== null) {
      this.oldMetadata = diffData.oldMetadata;
    }
    this.committerUsername = diffData.committerUsername;
    this.oldVersion = diffData.oldVersionNumber;

    this.updateLeftPane();
    this.updateRightPane();

    this.versionHistoryService
      .decrementCurrentPositionInMetadataVersionHistoryList();
  }

  onClickExploreBackwardVersionHistory(): void {
    this.yamlStrs.previousVersionMetadataYaml = '';
    this.yamlStrs.currentVersionMetadataYaml = '';

    const diffData = this.versionHistoryService.getBackwardMetadataDiffData();

    // Explanation for why diffData.newMetadata can be null:
    // It is explained in VersionHistoryService as to why the values of
    // newMetadata or oldMetadata can be null. This is because they are elements
    // of the list fetchedMetadata whose last element can be null which marks
    // the end of the version history of the exploration metadata.
    if (diffData.newMetadata !== null) {
      this.newMetadata = diffData.newMetadata;
    }
    if (diffData.oldMetadata !== null) {
      this.oldMetadata = diffData.oldMetadata;
    }
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
        } else {
          this.alertsService.addWarning(
            'Could not fetch the version history data due to some reasons. ' +
            'Please reload the page and try again.');
        }
      });
    }
  }

  updateLeftPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.oldMetadata)
      .then((result) => {
        this.yamlStrs.previousVersionMetadataYaml = result;
      });
  }

  updateRightPane(): void {
    this.historyTabYamlConversionService
      .getYamlStringFromStateOrMetadata(this.newMetadata)
      .then((result) => {
        this.yamlStrs.currentVersionMetadataYaml = result;
      });
  }

  ngOnInit(): void {
    this.updateLeftPane();
    this.updateRightPane();

    this.fetchPreviousVersionHistory();
  }
}
