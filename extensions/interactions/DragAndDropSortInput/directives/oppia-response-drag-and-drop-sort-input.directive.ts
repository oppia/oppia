// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the DragAndDropSortInput response.
 */

require('services/html-escaper.service.ts');
import cloneDeep from 'lodash/cloneDeep';

angular.module('oppia').directive('oppiaResponseDragAndDropSortInput', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./drag-and-drop-sort-input-response.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.chooseItemType = function(index) {
          if (index === 0) {
            ctrl.itemtype = 'drag-and-drop-response-item';
          } else {
            ctrl.itemtype = 'drag-and-drop-response-subitem';
          }
          return true;
        };
        ctrl.$onInit = function() {
          const answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
          const choices = HtmlEscaperService.escapedJsonToObj(
            $attrs.choices).map(choice => choice);
          var answerArray = cloneDeep(answer);
          var mappingOfContentIds = {};
          // Creating a mapping of contentIds which shall be used to
          // get the html content.
          choices.map(choiceIterator => mappingOfContentIds[
            choiceIterator._contentId] = choiceIterator._html);
          // Mapping the contenId of answerArray with it's html.
          answerArray = answerArray.map(ans => ans.map(
            contentId => mappingOfContentIds[contentId]));
          ctrl.answer = answerArray;
          ctrl.isAnswerLengthGreaterThanZero = (ctrl.answer.length > 0);
        };
      }]
    };
  }
]);
