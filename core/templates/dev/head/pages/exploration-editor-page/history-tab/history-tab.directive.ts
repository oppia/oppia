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
 * @fileoverview Directive for the exploration history tab.
 */

require('components/profile-link-directives/profile-link-text.directive.ts');
require(
  'components/version-diff-visualization/' +
  'version-diff-visualization.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-data.service.ts');
require(
  'pages/exploration-editor-page/history-tab/services/' +
  'compare-versions.service.ts');
require(
  'pages/exploration-editor-page/history-tab/services/version-tree.service.ts');
require('services/date-time-format.service.ts');
require('services/editability.service.ts');

angular.module('oppia').directive('historyTab', [
  'UrlInterpolationService', function(
      UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/history-tab/' +
        'history-tab.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$http', '$log', '$rootScope', '$scope',
        '$uibModal', '$window', 'CompareVersionsService',
        'DateTimeFormatService', 'EditabilityService', 'ExplorationDataService',
        'UrlInterpolationService', 'VersionTreeService',
        function(
            $http, $log, $rootScope, $scope,
            $uibModal, $window, CompareVersionsService,
            DateTimeFormatService, EditabilityService, ExplorationDataService,
            UrlInterpolationService, VersionTreeService) {
          var ctrl = this;
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
          * explorationSnapshots is a list of all snapshots for the
          * exploration in ascending order.
          *
          * explorationVersionMetadata is an object whose keys are version
          * numbers and whose values are objects containing data of that
          * revision (that is to be displayed) with the keys 'committerId',
          * 'createdOn', 'commitMessage', and 'versionNumber'. It contains a
          * maximum of 30 versions.
          *
          * versionCheckboxArray is an array of the version numbers of the
          * revisions to be displayed on the page, in the order they are
          * displayed in.
          *
          * nodesData is an object whose keys are nodeIds (assigned in version
          * comparison), and whose values are an object containing
          * 'newestStateName', 'originalStateName' and 'stateProperty'.
          */
          ctrl.explorationVersionMetadata = null;
          ctrl.versionCheckboxArray = [];
          var explorationSnapshots = null;
          var versionTreeParents = null;
          var nodesData = null;
          var currentPage = 0;
          ctrl.displayedCurrentPageNumber = currentPage + 1;
          ctrl.versionNumbersToDisplay = [];
          ctrl.VERSIONS_PER_PAGE = 30;

          $scope.$on('refreshVersionHistory', function(evt, data) {
            // Uncheck all checkboxes when page is refreshed
            angular.forEach(ctrl.versionCheckboxArray, function(
                versionCheckbox) {
              versionCheckbox.selected = false;
            });
            if (data.forceRefresh ||
              ctrl.explorationVersionMetadata === null) {
              ctrl.refreshVersionHistory();
            }
          });

          // Compares the two selected versions and displays the comparison
          // results.
          ctrl.compareSelectedVersions = function() {
            if (ctrl.selectedVersionsArray.length === 2) {
              ctrl.changeCompareVersion();
              ctrl.hideHistoryGraph = false;
              ctrl.compareVersionsButtonIsHidden = true;
            }
          };
          // Changes the checkbox selection and provides an appropriate user
          // prompt.
          ctrl.changeSelectedVersions = function(evt, versionNumber) {
            var checkbox = evt.target;
            var selectedVersionsArrayPos = ctrl.selectedVersionsArray.indexOf(
              versionNumber);
            if (checkbox.checked && selectedVersionsArrayPos === -1) {
              ctrl.selectedVersionsArray.push(versionNumber);
            }
            if (!checkbox.checked && selectedVersionsArrayPos !== -1) {
              ctrl.selectedVersionsArray.splice(selectedVersionsArrayPos, 1);
            }

            if (ctrl.selectedVersionsArray.length === 2) {
              // Disable version count prompt if two checkboxes are selected.
              ctrl.versionCountPrompt = '';
            } else if (!ctrl.comparisonsAreDisabled) {
              ctrl.hideHistoryGraph = true;
              ctrl.compareVersionsButtonIsHidden = false;

              if (ctrl.selectedVersionsArray.length === 0) {
                ctrl.versionCountPrompt = 'Please select any two.';
              } else if (ctrl.selectedVersionsArray.length === 1) {
                ctrl.versionCountPrompt = 'Please select one more.';
              }
            }
          };

          // Refreshes the displayed version history log.
          ctrl.refreshVersionHistory = function() {
            $rootScope.loadingMessage = 'Loading';
            ExplorationDataService.getData().then(function(data) {
              var currentVersion = data.version;
              ctrl.currentVersion = currentVersion;
              /**
               * ctrl.compareVersionMetadata is an object with keys
               * 'earlierVersion' and 'laterVersion' whose values are the
               * metadata of the compared versions, containing 'committerId',
               * 'createdOn', 'commitMessage', and 'versionNumber'.
               */
              ctrl.compareVersions = {};
              ctrl.compareVersionMetadata = {};

              // Contains the IDs of the versions selected for comparison.
              // Should contain a maximum of two elements.
              ctrl.selectedVersionsArray = [];

              ctrl.hideHistoryGraph = true;

              // Disable all comparisons if there are less than two revisions
              // in total.
              ctrl.comparisonsAreDisabled = (currentVersion < 2);

              ctrl.compareVersionsButtonIsHidden =
              ctrl.comparisonsAreDisabled;

              ctrl.versionCountPrompt = 'Please select any 2.';

              $http.get(ctrl.explorationAllSnapshotsUrl).then(
                function(response) {
                  explorationSnapshots = response.data.snapshots;
                  VersionTreeService.init(explorationSnapshots);

                  // Re-populate versionCheckboxArray and
                  // explorationVersionMetadata when history is refreshed.
                  ctrl.versionCheckboxArray = [];
                  ctrl.explorationVersionMetadata = {};
                  var lowestVersionIndex = 0;
                  for (
                    var i = currentVersion - 1;
                    i >= lowestVersionIndex; i--) {
                    var versionNumber =
                  explorationSnapshots[i].version_number;
                    ctrl.explorationVersionMetadata[versionNumber] = {
                      committerId: explorationSnapshots[i].committer_id,
                      createdOnStr: (
                        DateTimeFormatService
                          .getLocaleAbbreviatedDatetimeString(
                            explorationSnapshots[i].created_on_ms)),
                      commitMessage: explorationSnapshots[i].commit_message,
                      versionNumber: explorationSnapshots[i].version_number
                    };
                    ctrl.versionCheckboxArray.push({
                      vnum: explorationSnapshots[i].version_number,
                      selected: false
                    });
                  }
                  $rootScope.loadingMessage = '';
                  ctrl.computeVersionsToDisplay();
                });
            });
          };

          var getVersionHeader = function(versionMetadata) {
            return (
              'Revision #' + versionMetadata.versionNumber +
              ' by ' + versionMetadata.committerId +
              ' (' + versionMetadata.createdOnStr +
              ')' + (
                versionMetadata.commitMessage ?
                  ': ' + versionMetadata.commitMessage : ''));
          };

          // Function to set compared version metadata, download YAML and
          // generate diff graph and legend when selection is changed
          ctrl.changeCompareVersion = function() {
            ctrl.diffData = null;

            var earlierComparedVersion = Math.min(
              ctrl.selectedVersionsArray[0], ctrl.selectedVersionsArray[1]);
            var laterComparedVersion = Math.max(
              ctrl.selectedVersionsArray[0], ctrl.selectedVersionsArray[1]);

            ctrl.compareVersionMetadata.earlierVersion =
              ctrl.explorationVersionMetadata[earlierComparedVersion];
            ctrl.compareVersionMetadata.laterVersion =
              ctrl.explorationVersionMetadata[laterComparedVersion];

            CompareVersionsService.getDiffGraphData(earlierComparedVersion,
              laterComparedVersion).then(
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

          // Check if valid versions were selected
          ctrl.areCompareVersionsSelected = function() {
            return (
              ctrl.compareVersions &&
              ctrl.selectedVersionsArray.length === 2);
          };

          // Check if other checkboxes should be disabled once two are
          // selected.
          ctrl.isCheckboxDisabled = function(versionNumber) {
            if (ctrl.selectedVersionsArray.length === 2) {
              return (ctrl.selectedVersionsArray.indexOf(
                versionNumber) === -1);
            }
            return false;
          };

          // Downloads the zip file for an exploration.
          ctrl.downloadExplorationWithVersion = function(versionNumber) {
            // Note that this opens (and then immediately closes) a new tab.
            // If we do this in the same tab, the beforeunload handler is
            // triggered.
            window.open(
              ctrl.explorationDownloadUrl + '?v=' + versionNumber,
              '&output_format=zip');
          };

          ctrl.showRevertExplorationModal = function(version) {
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration-editor-page/history-tab' +
                '/modal-templates/revert-exploration-modal.template.html'),
              backdrop: true,
              resolve: {
                version: function() {
                  return version;
                }
              },
              controller: [
                '$scope', '$uibModalInstance', 'version',
                'ExplorationDataService',
                function(
                    $scope, $uibModalInstance, version,
                    ExplorationDataService) {
                  $scope.version = version;

                  $scope.getExplorationUrl = function(version) {
                    return (
                      '/explore/' + ExplorationDataService.explorationId +
                      '?v=' + version);
                  };

                  $scope.revert = function() {
                    $uibModalInstance.close(version);
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(version) {
              $http.post(ctrl.revertExplorationUrl, {
                current_version: ExplorationDataService.data.version,
                revert_to_version: version
              }).then(function() {
                $window.location.reload();
              });
            });
          };

          ctrl.computeVersionsToDisplay = function() {
            currentPage = ctrl.displayedCurrentPageNumber - 1;
            var begin = (currentPage * ctrl.VERSIONS_PER_PAGE);
            var end = Math.min(
              begin + ctrl.VERSIONS_PER_PAGE,
              ctrl.versionCheckboxArray.length);
            ctrl.versionNumbersToDisplay = [];
            for (var i = begin; i < end; i++) {
              ctrl.versionNumbersToDisplay.push(
                ctrl.versionCheckboxArray[i].vnum);
            }
          };
        }]
    };
  }]);
