// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the state translation status graph.
 */

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/graph-data.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-status.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-recorded-voiceovers.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-written-translations.service.ts');

angular.module('oppia').component('stateTranslationStatusGraph', {
  bindings: {
    isTranslationTabBusy: '='
  },
  template: require('./state-translation-status-graph.component.html'),
  controller: [
    '$scope', 'ExplorationStatesService', 'GraphDataService',
    'StateEditorService', 'StateRecordedVoiceoversService',
    'StateWrittenTranslationsService', 'TranslationStatusService',
    function(
        $scope, ExplorationStatesService, GraphDataService,
        StateEditorService, StateRecordedVoiceoversService,
        StateWrittenTranslationsService, TranslationStatusService) {
      var ctrl = this;

      $scope.getGraphData = function() {
        return GraphDataService.getGraphData();
      };
      $scope.nodeColors = function() {
        return TranslationStatusService.getAllStateStatusColors();
      };
      $scope.getActiveStateName = function() {
        return StateEditorService.getActiveStateName();
      };
      $scope.onClickStateInMap = function(newStateName) {
        if (ctrl.isTranslationTabBusy) {
          StateEditorService.onShowTranslationTabBusyModal.emit();
          return;
        }
        StateEditorService.setActiveStateName(newStateName);
        var stateName = StateEditorService.getActiveStateName();
        var stateData = ExplorationStatesService.getState(stateName);
        if (stateName && stateData) {
          StateRecordedVoiceoversService.init(
            StateEditorService.getActiveStateName(),
            stateData.recordedVoiceovers);
          StateWrittenTranslationsService.init(
            StateEditorService.getActiveStateName(),
            stateData.writtenTranslations);
          StateEditorService.onRefreshStateTranslation.emit();
        }

        $scope.$apply();
      };
    }
  ]
});
