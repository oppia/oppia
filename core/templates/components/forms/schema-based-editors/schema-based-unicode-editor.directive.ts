// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a schema-based editor for unicode strings.
 */

require('third-party-imports/ui-codemirror.import.ts');
import 'components/code-mirror/codemirror.component';
require(
  'components/forms/custom-forms-directives/apply-validation.directive.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-customization-args.service.ts');

require('filters/convert-unicode-with-params-to-html.filter.ts');
require('services/contextual/device-info.service.ts');
require('services/schema-form-submitted.service.ts');
require('services/stateful/focus-manager.service.ts');
import { Subscription } from 'rxjs';

angular.module('oppia').directive('schemaBasedUnicodeEditor', [
  function() {
    return {
      restrict: 'E',
      scope: {
        labelForFocusTarget: '&'
      },
      bindToController: {
        localValue: '=',
        isDisabled: '&',
        validators: '&',
        uiConfig: '&',
        labelForFocusTarget: '&',
        onInputBlur: '=',
        onInputFocus: '='
      },
      template: require('./schema-based-unicode-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$filter', '$sce', '$scope', '$timeout', '$translate',
        'DeviceInfoService', 'FocusManagerService',
        'SchemaFormSubmittedService',
        'StateCustomizationArgsService',
        function(
            $filter, $sce, $scope, $timeout, $translate,
            DeviceInfoService, FocusManagerService,
            SchemaFormSubmittedService,
            StateCustomizationArgsService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();
          var labelForFocus = $scope.labelForFocusTarget();
          ctrl.onKeypress = function(evt) {
            if (evt.keyCode === 13) {
              SchemaFormSubmittedService.onSubmittedSchemaBasedForm.emit();
            }
          };

          ctrl.getPlaceholder = function() {
            if (!ctrl.uiConfig()) {
              return '';
            } else {
              if (!ctrl.uiConfig().placeholder &&
                  DeviceInfoService.hasTouchEvents()) {
                return $translate.instant(
                  'I18N_PLAYER_DEFAULT_MOBILE_PLACEHOLDER');
              }
              return ctrl.uiConfig().placeholder;
            }
          };

          ctrl.getRows = function() {
            if (!ctrl.uiConfig()) {
              return null;
            } else {
              return ctrl.uiConfig().rows;
            }
          };

          ctrl.getCodingMode = function() {
            if (!ctrl.uiConfig()) {
              return null;
            } else {
              return ctrl.uiConfig().coding_mode;
            }
          };

          ctrl.getDisplayedValue = function() {
            return $sce.trustAsHtml(
              $filter('convertUnicodeWithParamsToHtml')(ctrl.localValue));
          };

          ctrl.updateLocalValue = function(val) {
            ctrl.localValue = val;
            $scope.$applyAsync();
          };
          ctrl.$onInit = function() {
            if (ctrl.uiConfig() && ctrl.uiConfig().coding_mode) {
              // Flag that is flipped each time the codemirror view is
              // shown. (The codemirror instance needs to be refreshed
              // every time it is unhidden.)
              ctrl.codemirrorStatus = false;
              var CODING_MODE_NONE = 'none';

              ctrl.codemirrorOptions = {
                // Convert tabs to spaces.
                extraKeys: {
                  Tab: function(cm) {
                    var spaces = Array(
                      cm.getOption('indentUnit') + 1).join(' ');
                    cm.replaceSelection(spaces);
                    // Move the cursor to the end of the selection.
                    var endSelectionPos = cm.getDoc().getCursor('head');
                    cm.getDoc().setCursor(endSelectionPos);
                  }
                },
                indentWithTabs: false,
                lineNumbers: true
              };

              if (ctrl.isDisabled()) {
                ctrl.codemirrorOptions.readOnly = 'nocursor';
              }
              // Note that only 'coffeescript', 'javascript', 'lua', 'python',
              // 'ruby' and 'scheme' have CodeMirror-supported syntax
              // highlighting. For other languages, syntax highlighting will not
              // happen.
              if (ctrl.uiConfig().coding_mode !== CODING_MODE_NONE) {
                ctrl.codemirrorOptions.mode = ctrl.uiConfig().coding_mode;
              }

              $timeout(function() {
                ctrl.codemirrorStatus = !ctrl.codemirrorStatus;
              }, 200);

              // When the form view is opened, flip the status flag. The
              // timeout seems to be needed for the line numbers etc. to display
              // properly.
              ctrl.directiveSubscriptions.add(
                StateCustomizationArgsService.onSchemaBasedFormsShown.subscribe(
                  () => {
                    $timeout(function() {
                      ctrl.codemirrorStatus = !ctrl.codemirrorStatus;
                    }, 200);
                  })
              );
            }
            // So that focus is applied after all the functions in
            // main thread have executed.
            $timeout(function() {
              FocusManagerService.setFocusWithoutScroll(labelForFocus);
            }, 5);
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }
]);
