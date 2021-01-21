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

require(
  'components/version-diff-visualization/' +
  'version-diff-visualization.directive.ts');
require(
  'pages/exploration-editor-page/history-tab/modal-templates/' +
  'revert-exploration-modal.controller.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require(
  'pages/exploration-editor-page/history-tab/services/' +
  'compare-versions.service.ts');
require(
  'pages/exploration-editor-page/history-tab/services/version-tree.service.ts');
require('services/date-time-format.service.ts');
require('services/editability.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');

import { Subscription } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';

angular.module('oppia').component('historyTab', {
  template: require('./history-tab.component.html'),
  controller: [
    '$http', '$log', '$rootScope', '$uibModal', 'CompareVersionsService',
    'DateTimeFormatService', 'EditabilityService', 'ExplorationDataService',
    'LoaderService', 'RouterService', 'UrlInterpolationService',
    'VersionTreeService', 'WindowRef',
    function(
        $http, $log, $rootScope, $uibModal, CompareVersionsService,
        DateTimeFormatService, EditabilityService, ExplorationDataService,
        LoaderService, RouterService, UrlInterpolationService,
        VersionTreeService, WindowRef) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      // Variable explorationSnapshots is a list of all snapshots for the
      // exploration in ascending order.
      var explorationSnapshots = null;
      var currentPage = 0;

      // Compares the two selected versions and displays the comparison
      // results.
      ctrl.compareSelectedVersions = function() {
        if (ctrl.selectedVersionsArray.length === 2) {
          ctrl.changeCompareVersion();
          ctrl.hideHistoryGraph = false;
        }
      };
      // Changes the checkbox selection and provides an appropriate user
      // prompt.
      ctrl.changeSelectedVersions = function(snapshot, item) {
        if (item === 1 && snapshot && !ctrl.selectedVersionsArray.includes(
          snapshot.versionNumber)) {
          ctrl.selectedVersionsArray[0] = snapshot.versionNumber;
        }
        if (item === 2 && snapshot && !ctrl.selectedVersionsArray.includes(
          snapshot.versionNumber)) {
          ctrl.selectedVersionsArray[1] = snapshot.versionNumber;
        }
        if (ctrl.selectedVersionsArray.length === 2) {
          ctrl.compareSelectedVersions();
        } else if (!ctrl.comparisonsAreDisabled) {
          ctrl.hideHistoryGraph = true;
          ctrl.compareVersionsButtonIsHidden = false;
        }
      };

      // Refreshes the displayed version history log.
      ctrl.refreshVersionHistory = function() {
        LoaderService.showLoadingScreen('Loading');
        ExplorationDataService.getData().then(function(data) {
          var currentVersion = data.version;
          ctrl.currentVersion = currentVersion;
          // The ctrl.compareVersionMetadata is an object with keys
          // 'earlierVersion' and 'laterVersion' whose values are the
          // metadata of the compared versions, containing 'committerId',
          // 'createdOnMsecs', 'commitMessage', and 'versionNumber'.
          ctrl.compareVersions = {};
          ctrl.compareVersionMetadata = {};

          // Contains the IDs of the versions selected for comparison.
          // Should contain a maximum of two elements.
          ctrl.selectedVersionsArray = [];

          ctrl.hideHistoryGraph = true;

          // Disable all comparisons if there are less than two revisions in
          // total.
          ctrl.comparisonsAreDisabled = (currentVersion < 2);

          ctrl.compareVersionsButtonIsHidden = ctrl.comparisonsAreDisabled;

          $http.get(ctrl.explorationAllSnapshotsUrl).then(
            function(response) {
              explorationSnapshots = response.data.snapshots;
              VersionTreeService.init(explorationSnapshots);

              // Re-populate versionCheckboxArray and
              // explorationVersionMetadata when history is refreshed.
              ctrl.versionCheckboxArray = [];
              ctrl.explorationVersionMetadata = [];
              var lowestVersionIndex = 0;
              for (
                var i = currentVersion - 1; i >= lowestVersionIndex; i--) {
                var versionNumber = explorationSnapshots[i].version_number;
                ctrl.explorationVersionMetadata[versionNumber - 1] = {
                  committerId: explorationSnapshots[i].committer_id,
                  createdOnMsecsStr: (
                    DateTimeFormatService
                      .getLocaleDateTimeHourString(
                        explorationSnapshots[i].created_on_ms)),
                  commitMessage: explorationSnapshots[i].commit_message,
                  versionNumber: explorationSnapshots[i].version_number
                };
                ctrl.versionCheckboxArray.push({
                  vnum: explorationSnapshots[i].version_number,
                  selected: false
                });
              }
              ctrl.totalExplorationVersionMetadata = cloneDeep(
                ctrl.explorationVersionMetadata);
              ctrl.totalExplorationVersionMetadata.reverse();
              LoaderService.hideLoadingScreen();
              ctrl.changeItemsPerPage();
              $rootScope.$applyAsync();
            });
          $rootScope.$applyAsync();
        });
      };

      var getVersionHeader = function(versionMetadata) {
        return (
          'Revision #' + versionMetadata.versionNumber +
          ' by ' + versionMetadata.committerId +
          ' (' + versionMetadata.createdOnMsecsStr +
          ')' + (
            versionMetadata.commitMessage ?
              ': ' + versionMetadata.commitMessage : ''));
      };

      ctrl.filterByUsername = function() {
        if (!ctrl.username) {
          ctrl.explorationVersionMetadata = cloneDeep(
            ctrl.totalExplorationVersionMetadata);
          ctrl.versionNumbersToDisplay = ctrl.explorationVersionMetadata.length;
          return;
        }

        ctrl.explorationVersionMetadata = (
          ctrl.totalExplorationVersionMetadata.filter((metadata) => {
            return (
              metadata && metadata.committerId.trim().toLowerCase().includes(
                ctrl.username.trim().toLowerCase()));
          }));
        ctrl.versionNumbersToDisplay = ctrl.explorationVersionMetadata.length;
      };

      // Function to set compared version metadata, download YAML and
      // generate diff graph and legend when selection is changed.
      ctrl.changeCompareVersion = function() {
        ctrl.diffData = null;

        var earlierComparedVersion = Math.min(
          ctrl.selectedVersionsArray[0], ctrl.selectedVersionsArray[1]);
        var laterComparedVersion = Math.max(
          ctrl.selectedVersionsArray[0], ctrl.selectedVersionsArray[1]);
        let earlierIndex = null, laterIndex = null;
        for (let i = 0; i < ctrl.totalExplorationVersionMetadata.length; i++) {
          if (ctrl.totalExplorationVersionMetadata[i].versionNumber ===
              earlierComparedVersion) {
            earlierIndex = i;
          } else if (ctrl.totalExplorationVersionMetadata[i].versionNumber ===
              laterComparedVersion) {
            laterIndex = i;
          }
          if (earlierIndex !== null && laterIndex !== null) {
            break;
          }
        }
        ctrl.compareVersionMetadata.earlierVersion = (
          ctrl.totalExplorationVersionMetadata[earlierIndex]);
        ctrl.compareVersionMetadata.laterVersion = (
          ctrl.totalExplorationVersionMetadata[laterIndex]);

        CompareVersionsService.getDiffGraphData(
          earlierComparedVersion, laterComparedVersion).then(
          function(response) {
            $log.info('Retrieved version comparison data');
            $log.info(response);

            ctrl.diffData = response;
            ctrl.earlierVersionHeader = getVersionHeader(
              ctrl.compareVersionMetadata.earlierVersion);
            ctrl.laterVersionHeader = getVersionHeader(
              ctrl.compareVersionMetadata.laterVersion);
          }
        );
      };

      // Downloads the zip file for an exploration.
      ctrl.downloadExplorationWithVersion = function(versionNumber) {
        // Note that this opens (and then immediately closes) a new tab. If
        // we do this in the same tab, the beforeunload handler is
        // triggered.
        WindowRef.nativeWindow.open(
          ctrl.explorationDownloadUrl + '?v=' + versionNumber,
          '&output_format=zip');
      };

      ctrl.showRevertExplorationModal = function(version) {
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/history-tab/modal-templates/' +
            'revert-exploration-modal.template.html'),
          backdrop: true,
          resolve: {
            version: () => version
          },
          controller: 'RevertExplorationModalController'
        }).result.then(function(version) {
          $http.post(ctrl.revertExplorationUrl, {
            current_version: ExplorationDataService.data.version,
            revert_to_version: version
          }).then(function() {
            WindowRef.nativeWindow.location.reload();
          });
        }, function(error) {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      ctrl.changeItemsPerPage = function() {
        ctrl.explorationVersionMetadata =
            ctrl.totalExplorationVersionMetadata.slice(
              (ctrl.displayedCurrentPageNumber - 1) * ctrl.VERSIONS_PER_PAGE,
              (ctrl.displayedCurrentPageNumber) * ctrl.VERSIONS_PER_PAGE);
        ctrl.startingIndex = (
          (ctrl.displayedCurrentPageNumber - 1) * ctrl.VERSIONS_PER_PAGE + 1);
        ctrl.endIndex = (
          (ctrl.displayedCurrentPageNumber) * ctrl.VERSIONS_PER_PAGE);

        ctrl.versionNumbersToDisplay = ctrl.explorationVersionMetadata.length;
      };

      ctrl.isEditable = function() {
        return ctrl.EditabilityService.isEditable();
      };

      ctrl.resetGraph = function() {
        ctrl.firstVersion = null;
        ctrl.secondVersion = null;
        ctrl.hideHistoryGraph = true;
        ctrl.selectedVersionsArray = [];
      };

      ctrl.reverseDateOrder = function() {
        ctrl.explorationVersionMetadata.reverse();
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          RouterService.onRefreshVersionHistory.subscribe((data) => {
            if (
              data.forceRefresh || ctrl.explorationVersionMetadata === null) {
              ctrl.refreshVersionHistory();
            }
          })
        );

        ctrl.EditabilityService = EditabilityService;
        ctrl.explorationId = ExplorationDataService.explorationId;
        ctrl.explorationAllSnapshotsUrl =
            '/createhandler/snapshots/' + ctrl.explorationId;
        ctrl.revertExplorationUrl =
          '/createhandler/revert/' + ctrl.explorationId;
        ctrl.explorationDownloadUrl =
          '/createhandler/download/' + ctrl.explorationId;

        /* Variable definitions:
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
        ctrl.explorationVersionMetadata = null;
        ctrl.versionCheckboxArray = [];
        ctrl.username = '';
        ctrl.firstVersion = '';
        ctrl.secondVersion = '';

        ctrl.displayedCurrentPageNumber = currentPage + 1;
        ctrl.versionNumbersToDisplay = [];
        ctrl.VERSIONS_PER_PAGE = 10;
        ctrl.startingIndex = 1;
        ctrl.endIndex = 10;

        ctrl.versionChoices = [10, 15, 20];
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
