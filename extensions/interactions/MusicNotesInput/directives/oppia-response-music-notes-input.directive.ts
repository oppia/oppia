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
 * @fileoverview Directives for the MusicNotesInput response.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('services/html-escaper.service.ts');

angular.module('oppia').directive('oppiaResponseMusicNotesInput', [
  'HtmlEscaperService', function(HtmlEscaperService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./music-notes-input-response.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.$onInit = function() {
          var _answer = HtmlEscaperService.escapedJsonToObj($attrs.answer);
          var _notes = [];
          for (var i = 0; i < _answer.length; i++) {
            if (_answer[i].readableNoteName) {
              _notes.push(_answer[i].readableNoteName);
            }
          }

          if (_notes.length > 0) {
            ctrl.displayedAnswer = _notes.join(', ');
          } else {
            ctrl.displayedAnswer = 'No answer given.';
          }
        };
      }]
    };
  }
]);
