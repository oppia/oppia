// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the exploration history tab.
 */

import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {Subscription} from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import {CheckRevertExplorationModalComponent} from './modal-templates/check-revert-exploration-modal.component';
import {RevertExplorationModalComponent} from './modal-templates/revert-exploration-modal.component';
import {ExplorationMetadataDiffModalComponent} from '../modal-templates/exploration-metadata-diff-modal.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {DateTimeFormatService} from 'services/date-time-format.service';
import {EditabilityService} from 'services/editability.service';
import {LoaderService} from 'services/loader.service';
import {ExplorationDataService} from '../services/exploration-data.service';
import {HistoryTabBackendApiService} from '../services/history-tab-backend-api.service';
import {RouterService} from '../services/router.service';
import {CheckRevertService} from './services/check-revert.service';
import {
  ExplorationSnapshot,
  VersionTreeService,
} from './services/version-tree.service';
import {CompareVersionsService} from './services/compare-versions.service';
import {ExplorationMetadata} from 'domain/exploration/ExplorationMetadataObjectFactory';
import {LoggerService} from 'services/contextual/logger.service';

interface VersionMetadata {
  versionNumber: number;
  committerId: string;
  createdOnMsecsStr: string;
  commitMessage: string;
}

interface Metadata {
  v1Metadata: ExplorationMetadata;
  v2Metadata: ExplorationMetadata;
}

@Component({
  selector: 'oppia-history-tab',
  templateUrl: './history-tab.component.html',
})
export class HistoryTabComponent implements OnInit, OnDestroy {
  directiveSubscriptions = new Subscription();

  firstVersion: string;
  secondVersion: string;
  hideHistoryGraph: boolean;
  selectedVersionsArray: number[];

  // Letiable explorationSnapshots is a list of all snapshots for the
  // exploration in ascending order.
  explorationSnapshots: ExplorationSnapshot[];
  currentPage: number = 0;
  explorationVersionMetadata;
  versionCheckboxArray:
    | {
        vnum: number;
        selected: boolean;
      }[]
    | null = [];

  username: string;
  displayedCurrentPageNumber: number;
  versionNumbersToDisplay;
  VERSIONS_PER_PAGE: number = 10;
  startingIndex: number;
  endIndex: number;
  versionChoices: number[];
  explorationId: string;
  explorationAllSnapshotsUrl: string;
  checkRevertExplorationValidUrl: string;
  revertExplorationUrl: string;
  explorationDownloadUrl: string;
  earlierVersionHeader: string;
  laterVersionHeader: string;
  totalExplorationVersionMetadata = [];
  compareVersionMetadata;
  currentVersion: number;
  comparisonsAreDisabled: boolean;
  compareVersionsButtonIsHidden: boolean;
  compareVersions: object;
  diffData: Metadata | object;

  constructor(
    private checkRevertService: CheckRevertService,
    private compareVersionsService: CompareVersionsService,
    private dateTimeFormatService: DateTimeFormatService,
    private editabilityService: EditabilityService,
    private explorationDataService: ExplorationDataService,
    private historyTabBackendApiService: HistoryTabBackendApiService,
    private loaderService: LoaderService,
    private ngbModal: NgbModal,
    private routerService: RouterService,
    private urlInterpolationService: UrlInterpolationService,
    private versionTreeService: VersionTreeService,
    private windowRef: WindowRef,
    private loggerService: LoggerService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  // Compares the two selected versions and displays the comparison
  // results.
  compareSelectedVersions(): void {
    // The selectedVersionsArray may contain empty elements as the
    // array items are directly manipulated based on indices on change.
    if (
      this.selectedVersionsArray &&
      this.selectedVersionsArray.length === 2 &&
      Number.isInteger(this.selectedVersionsArray[0]) &&
      Number.isInteger(this.selectedVersionsArray[1])
    ) {
      this.changeCompareVersion();
      this.hideHistoryGraph = false;
    }
  }

  // Changes the checkbox selection and provides an appropriate user
  // prompt.
  changeSelectedVersions(
    snapshot: {
      versionNumber: number;
      committerId: string;
      createdOnMsecsStr: string;
      commitMessage: string;
    },
    item: number
  ): void {
    if (
      item === 1 &&
      snapshot &&
      !this.selectedVersionsArray.includes(snapshot.versionNumber)
    ) {
      this.selectedVersionsArray[0] = snapshot.versionNumber;
    }
    if (
      item === 2 &&
      snapshot &&
      !this.selectedVersionsArray.includes(snapshot.versionNumber)
    ) {
      this.selectedVersionsArray[1] = snapshot.versionNumber;
    }
    if (this.selectedVersionsArray && this.selectedVersionsArray.length === 2) {
      this.compareSelectedVersions();
    } else if (!this.comparisonsAreDisabled) {
      this.hideHistoryGraph = true;
      this.compareVersionsButtonIsHidden = false;
    }

    this.changeDetectorRef.detectChanges();
  }

  // Refreshes the displayed version history log.
  refreshVersionHistory(): void {
    this.loaderService.showLoadingScreen('Loading');
    this.explorationDataService
      .getDataAsync(() => {})
      .then(data => {
        let currentVersion = data.version;
        this.currentVersion = currentVersion;
        // The this.compareVersionMetadata is an object with keys
        // 'earlierVersion' and 'laterVersion' whose values are the
        // metadata of the compared versions, containing 'committerId',
        // 'createdOnMsecs', 'commitMessage', and 'versionNumber'.
        this.compareVersions = {};
        this.compareVersionMetadata = {};

        // Contains the IDs of the versions selected for comparison.
        // Should contain a maximum of two elements.
        this.selectedVersionsArray = [];

        this.hideHistoryGraph = true;

        // Disable all comparisons if there are less than two revisions in
        // total.
        this.comparisonsAreDisabled = currentVersion < 2;
        this.compareVersionsButtonIsHidden = this.comparisonsAreDisabled;

        this.historyTabBackendApiService
          .getData(this.explorationAllSnapshotsUrl)
          .then(response => {
            this.explorationSnapshots = response.snapshots;
            this.versionTreeService.init(this.explorationSnapshots);
            // Re-populate versionCheckboxArray and
            // explorationVersionMetadata when history is refreshed.
            this.versionCheckboxArray = [];
            this.explorationVersionMetadata = [];
            let lowestVersionIndex = 0;
            for (let i = currentVersion - 1; i >= lowestVersionIndex; i--) {
              let versionNumber = this.explorationSnapshots[i].version_number;
              this.explorationVersionMetadata[versionNumber - 1] = {
                committerId: this.explorationSnapshots[i].committer_id,
                createdOnMsecsStr:
                  this.dateTimeFormatService.getLocaleDateTimeHourString(
                    this.explorationSnapshots[i].created_on_ms
                  ),
                tooltipText: this.dateTimeFormatService.getDateTimeInWords(
                  this.explorationSnapshots[i].created_on_ms
                ),
                commitMessage: this.explorationSnapshots[i].commit_message,
                versionNumber: this.explorationSnapshots[i].version_number,
              };
              this.versionCheckboxArray.push({
                vnum: this.explorationSnapshots[i].version_number,
                selected: false,
              });
            }
            this.totalExplorationVersionMetadata = cloneDeep(
              this.explorationVersionMetadata
            );
            this.totalExplorationVersionMetadata.reverse();
            this.loaderService.hideLoadingScreen();
            this.changeItemsPerPage();
          });
      });
  }

  getVersionHeader(versionMetadata: VersionMetadata): string {
    return (
      'Revision #' +
      versionMetadata.versionNumber +
      ' by ' +
      versionMetadata.committerId +
      ' (' +
      versionMetadata.createdOnMsecsStr +
      ')' +
      (versionMetadata.commitMessage
        ? ': ' + versionMetadata.commitMessage
        : '')
    );
  }

  filterByUsername(): void {
    if (!this.username && this.totalExplorationVersionMetadata) {
      this.explorationVersionMetadata = cloneDeep(
        this.totalExplorationVersionMetadata
      );
      this.versionNumbersToDisplay = this.explorationVersionMetadata.length;
      return;
    }

    this.explorationVersionMetadata =
      this.totalExplorationVersionMetadata.filter(metadata => {
        return (
          metadata &&
          metadata.committerId
            .trim()
            .toLowerCase()
            .includes(this.username.trim().toLowerCase())
        );
      });
    if (this.explorationVersionMetadata) {
      this.versionNumbersToDisplay = this.explorationVersionMetadata.length;
    }
  }

  // Function to set compared version metadata, download YAML and
  // generate diff graph and legend when selection is changed.
  changeCompareVersion(): void {
    this.diffData = null;

    let earlierComparedVersion = Math.min(
      this.selectedVersionsArray[0],
      this.selectedVersionsArray[1]
    );
    let laterComparedVersion = Math.max(
      this.selectedVersionsArray[0],
      this.selectedVersionsArray[1]
    );
    let earlierIndex = null,
      laterIndex = null;

    for (let i = 0; i < this.totalExplorationVersionMetadata.length; i++) {
      if (
        this.totalExplorationVersionMetadata[i].versionNumber ===
        earlierComparedVersion
      ) {
        earlierIndex = i;
      } else if (
        this.totalExplorationVersionMetadata[i].versionNumber ===
        laterComparedVersion
      ) {
        laterIndex = i;
      }
      if (earlierIndex !== null && laterIndex !== null) {
        break;
      }
    }

    this.compareVersionMetadata.earlierVersion =
      this.totalExplorationVersionMetadata[earlierIndex];
    this.compareVersionMetadata.laterVersion =
      this.totalExplorationVersionMetadata[laterIndex];

    Promise.resolve(
      this.compareVersionsService.getDiffGraphData(
        earlierComparedVersion,
        laterComparedVersion
      )
    ).then(response => {
      this.loggerService.info('Retrieved version comparison data');
      this.loggerService.info(String(response));

      this.diffData = response;
      this.earlierVersionHeader = this.getVersionHeader(
        this.compareVersionMetadata.earlierVersion
      );
      this.laterVersionHeader = this.getVersionHeader(
        this.compareVersionMetadata.laterVersion
      );
    });
  }

  // Downloads the zip file for an exploration.
  downloadExplorationWithVersion(versionNumber: number): void {
    // Note that this opens (and then immediately closes) a new tab. If
    // we do this in the same tab, the beforeunload handler is
    // triggered.
    this.windowRef.nativeWindow.open(
      this.explorationDownloadUrl + '?v=' + versionNumber,
      '&output_format=zip'
    );
  }

  showCheckRevertExplorationModal(version: number): void {
    const modalRef = this.ngbModal.open(CheckRevertExplorationModalComponent, {
      backdrop: true,
    });
    modalRef.componentInstance.version = version;
    const url = this.urlInterpolationService.interpolateUrl(
      this.checkRevertExplorationValidUrl,
      {
        exploration_id: this.explorationId,
        version: String(version),
      }
    );
    this.historyTabBackendApiService
      .getCheckRevertValidData(url)
      .then(revertData => {
        if (revertData.valid) {
          modalRef.close();
          this.showRevertExplorationModal(version);
        } else {
          this.checkRevertService.detailsEventEmitter.emit(revertData.details);
        }
      });
  }

  showRevertExplorationModal(version: number): void {
    const modalRef = this.ngbModal.open(RevertExplorationModalComponent, {
      backdrop: true,
    });
    modalRef.componentInstance.version = version;
    modalRef.result.then(
      version => {
        let data = {
          revertExplorationUrl: this.revertExplorationUrl,
          currentVersion: this.explorationDataService.data.version,
          revertToVersion: version,
        };
        this.historyTabBackendApiService.postData(data).then(
          () => {
            const currentUrl = this.windowRef.nativeWindow.location.href;
            this.windowRef.nativeWindow.location.href = `${currentUrl}#/history`;
            this.windowRef.nativeWindow.location.reload();
          },
          () => {
            // Note to developers:
            // This callback is triggered when the Post Request is failed.
          }
        );
      },
      error => {
        // Note to developers:
        // This callback is triggered when the Cancel button is clicked.
        // No further action is needed.
      }
    );
  }

  paginator(value: {
    previousPageIndex: number;
    pageIndex: number;
    pageSize: number;
    length: number;
  }): void {
    this.displayedCurrentPageNumber = value.pageIndex + 1;

    if (value.pageSize !== this.VERSIONS_PER_PAGE) {
      this.VERSIONS_PER_PAGE = value.pageSize;
    }

    this.changeItemsPerPage();

    this.changeDetectorRef.detectChanges();
  }

  changeItemsPerPage(): void {
    this.explorationVersionMetadata =
      this.totalExplorationVersionMetadata.slice(
        (this.displayedCurrentPageNumber - 1) * this.VERSIONS_PER_PAGE,
        this.displayedCurrentPageNumber * this.VERSIONS_PER_PAGE
      );
    this.startingIndex =
      (this.displayedCurrentPageNumber - 1) * this.VERSIONS_PER_PAGE + 1;
    this.endIndex = this.displayedCurrentPageNumber * this.VERSIONS_PER_PAGE;

    this.versionNumbersToDisplay = this.explorationVersionMetadata.length;
  }

  isEditable(): boolean {
    return this.editabilityService.isEditable();
  }

  resetGraph(): void {
    this.firstVersion = null;
    this.secondVersion = null;
    this.hideHistoryGraph = true;
    this.selectedVersionsArray = [];
  }

  reverseDateOrder(): void {
    this.explorationVersionMetadata.reverse();
  }

  showExplorationMetadataDiffModal(): void {
    let modalRef: NgbModalRef = this.ngbModal.open(
      ExplorationMetadataDiffModalComponent,
      {
        backdrop: true,
        windowClass: 'exploration-metadata-diff-modal',
        size: 'xl',
      }
    );

    modalRef.componentInstance.oldMetadata = (
      this.diffData as Metadata
    ).v1Metadata;
    modalRef.componentInstance.newMetadata = (
      this.diffData as Metadata
    ).v2Metadata;
    modalRef.componentInstance.headers = {
      leftPane: this.earlierVersionHeader,
      rightPane: this.laterVersionHeader,
    };

    modalRef.result.then(
      () => {},
      () => {}
    );
  }

  ngOnInit(): void {
    this.directiveSubscriptions.add(
      this.routerService.onRefreshVersionHistory.subscribe(data => {
        if (
          (data && data.forceRefresh) ||
          this.explorationVersionMetadata === null
        ) {
          this.refreshVersionHistory();
        }
      })
    );

    this.explorationId = this.explorationDataService.explorationId;
    this.explorationAllSnapshotsUrl =
      '/createhandler/snapshots/' + this.explorationId;
    this.checkRevertExplorationValidUrl =
      '/createhandler/check_revert_valid/<exploration_id>/<version>';
    this.revertExplorationUrl = '/createhandler/revert/' + this.explorationId;
    this.explorationDownloadUrl =
      '/createhandler/download/' + this.explorationId;

    /* Letiable definitions:
     *
     * explorationVersionMetadata is an object whose keys are version
     * numbers and whose values are objects containing data of that
     * revision (that is to be displayed) with the keys 'committerId',
     * 'createdOnMsecs', 'commitMessage', and 'versionNumber'. It
     * contains a maximum of 30 versions.
     *
     * versionCheckboxArray is an array of the version numbers of the
     * revisions to be displayed on the page, in the order they are
     * displayed in.
     *
     */
    this.explorationVersionMetadata = null;
    this.versionCheckboxArray = [];
    this.username = '';
    this.firstVersion = '';
    this.secondVersion = '';

    this.displayedCurrentPageNumber = this.currentPage + 1;
    this.versionNumbersToDisplay = [];
    this.VERSIONS_PER_PAGE = 10;
    this.startingIndex = 1;
    this.endIndex = 10;

    this.versionChoices = [10, 15, 20];
  }

  ngOnDestroy(): void {
    this.directiveSubscriptions.unsubscribe();
  }
}
