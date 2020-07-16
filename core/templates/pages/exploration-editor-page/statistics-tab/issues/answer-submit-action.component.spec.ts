// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS-IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for answerSubmitAction component.
 */

import { TestBed } from '@angular/core/testing';
import { HtmlEscaperService } from 'services/html-escaper.service';
import { ExplorationHtmlFormatterService } from
  'services/exploration-html-formatter.service';

require(
  'pages/exploration-editor-page/statistics-tab/issues/' +
  'answer-submit-action.component.ts');

describe('Answer Submit Action directive', function() {
  var ctrl = null;
  var $scope = null;
  var explorationHtmlFormatterService = null;
  var htmlEscaperService = null;

  beforeEach(function() {
    explorationHtmlFormatterService = TestBed.get(
      ExplorationHtmlFormatterService);
    htmlEscaperService = TestBed.get(HtmlEscaperService);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('$attrs', {
      actionIndex: 2,
      answer: '"This is an answer string."',
      currentStateName: 'State name',
      destStateName: 'Introduction',
      interactionCustomizationArgs: '{"choices":{"value":"Value"}}',
      interactionId: '1',
      timeSpentInStateSecs: 2000
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    var $rootScope = $injector.get('$rootScope');

    $scope = $rootScope.$new();
    ctrl = $componentController('answerSubmitAction', {
      $scope: $scope,
      ExplorationHtmlFormatterService: explorationHtmlFormatterService,
      HtmlEscaperService: htmlEscaperService
    });
    ctrl.$onInit();
  }));

  it('should evaluate controller properties after initialization', function() {
    expect(ctrl.currentStateName).toBe('State name');
    expect(ctrl.destStateName).toBe('Introduction');
    expect(ctrl.actionIndex).toBe(2);
    expect(ctrl.timeSpentInStateSecs).toBe(2000);
  });

  it('should get short answer html', function() {
    expect(ctrl.getShortAnswerHtml()).toBe(
      '<oppia-short-response-1 answer="&amp;quot;This is an answer string.' +
      '&amp;quot;" choices="&amp;quot;Value&amp;quot;"' +
      '></oppia-short-response-1>');
  });
});
