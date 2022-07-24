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
 * @fileoverview Directive for the state name editor section of the state
 * editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require('filters/string-utility-filters/normalize-whitespace.filter.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-name.service.ts');
require('services/editability.service.ts');
require('services/stateful/focus-manager.service.ts');
require('services/external-save.service.ts');

require('constants.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('stateNameEditor', {
  template: require('./state-name-editor.component.html'),
  controller: [
    '$filter', 'EditabilityService',
    'ExplorationStatesService',
    'ExternalSaveService', 'FocusManagerService', 'RouterService',
    'StateEditorService', 'StateNameService', 'MAX_STATE_NAME_LENGTH',
    function(
        $filter, EditabilityService,
        ExplorationStatesService,
        ExternalSaveService, FocusManagerService, RouterService,
        StateEditorService, StateNameService, MAX_STATE_NAME_LENGTH) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();

      ctrl.initStateNameEditor = function() {
        StateNameService.init();
      };

      ctrl.openStateNameEditor = function() {
        var stateName = StateEditorService.getActiveStateName();
        StateNameService.setStateNameEditorVisibility(true);
        StateNameService.setStateNameSavedMemento(stateName);
        ctrl.maxLen = MAX_STATE_NAME_LENGTH;
        ctrl.tmpStateName = stateName;
        FocusManagerService.setFocus('stateNameEditorOpened');
      };

      ctrl.saveStateName = function(newStateName) {
        var normalizedNewName =
          _getNormalizedStateName(newStateName);
        var savedMemento = StateNameService.getStateNameSavedMemento();
        if (!_isNewStateNameValid(normalizedNewName)) {
          return false;
        }
        if (savedMemento === normalizedNewName) {
          StateNameService.setStateNameEditorVisibility(false);
          return false;
        } else {
          ExplorationStatesService.renameState(
            StateEditorService.getActiveStateName(), normalizedNewName);
          StateNameService.setStateNameEditorVisibility(false);
          // Save the contents of other open fields.
          ExternalSaveService.onExternalSave.emit();
          ctrl.initStateNameEditor();
          return true;
        }
      };

      var _getNormalizedStateName = function(newStateName) {
        return $filter('normalizeWhitespace')(newStateName);
      };

      var _isNewStateNameValid = function(stateName) {
        if (stateName === StateEditorService.getActiveStateName()) {
          return true;
        }
        return ExplorationStatesService.isNewStateNameValid(
          stateName, true);
      };

      ctrl.saveStateNameAndRefresh = function(newStateName) {
        var normalizedStateName =
          _getNormalizedStateName(newStateName);
        var valid = ctrl.saveStateName(normalizedStateName);
        if (valid) {
          RouterService.navigateToMainTab(normalizedStateName);
        }
      };

      ctrl.$onInit = function() {
        ctrl.directiveSubscriptions.add(
          ExternalSaveService.onExternalSave.subscribe(
            () => {
              if (StateNameService.isStateNameEditorShown()) {
                ctrl.saveStateName(ctrl.tmpStateName);
              }
            }
          )
        );
        StateNameService.init();
        ctrl.EditabilityService = EditabilityService;
        ctrl.StateEditorService = StateEditorService;
        ctrl.StateNameService = StateNameService;
        ctrl.stateNameEditorIsShown = false;
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
