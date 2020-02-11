// Copyright 2012 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for music phrase editor.
 */

// This directive is always editable.

angular.module('oppia').directive('musicPhraseEditor', [
  'AlertsService', function(AlertsService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        value: '='
      },
      template: require('./music-phrase-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$scope', function($scope) {
        var ctrl = this;
        ctrl.$onInit = function() {
          // The maximum number of notes allowed in a music phrase.
          var _MAX_NOTES_IN_PHRASE = 8;
          // Reset the component each time the value changes (e.g. if this is
          // part of an editable list).
          $scope.$watch('$ctrl.value', function(newValue) {
            // TODO(sll): Check that $ctrl.value is a list.
            ctrl.localValue = [];
            if (newValue) {
              for (var i = 0; i < newValue.length; i++) {
                ctrl.localValue.push(newValue[i].readableNoteName);
              }
            }
          }, true);

          $scope.$watch('$ctrl.localValue', function(newValue, oldValue) {
            if (newValue && oldValue) {
              if (newValue.length > _MAX_NOTES_IN_PHRASE) {
                AlertsService.addWarning(
                  'There are too many notes on the staff.');
              } else {
                var parentValues = [];
                for (var i = 0; i < newValue.length; i++) {
                  parentValues.push({
                    readableNoteName: newValue[i],
                    noteDuration: {
                      num: 1,
                      den: 1
                    }
                  });
                }
                ctrl.value = parentValues;
              }
            }
          }, true);
          ctrl.schema = {
            type: 'list',
            items: {
              type: 'unicode',
              choices: [
                'C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5',
                'F5', 'G5', 'A5'
              ]
            },
            ui_config: {
              add_element_text: 'Add Note ♩'
            },
            validators: [{
              id: 'has_length_at_most',
              max_value: _MAX_NOTES_IN_PHRASE
            }]
          };
        };
      }]
    };
  }]);
