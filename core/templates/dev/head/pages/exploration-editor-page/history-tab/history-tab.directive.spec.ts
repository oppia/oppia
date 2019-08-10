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
 * @fileoverview Unit tests for the exploration history tab.
 */

// TODO(#7222): Remove the following block of unnnecessary imports once
// history-tab.directive.ts is upgraded to Angular 8.
import { EditabilityService } from 'services/EditabilityService.ts';
import { ExplorationDraftObjectFactory } from
  'domain/exploration/ExplorationDraftObjectFactory.ts';
import { HintObjectFactory } from 'domain/exploration/HintObjectFactory.ts';
import { OutcomeObjectFactory } from
  'domain/exploration/OutcomeObjectFactory.ts';
import { ParamChangeObjectFactory } from
  'domain/exploration/ParamChangeObjectFactory.ts';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory.ts';
import { RuleObjectFactory } from 'domain/exploration/RuleObjectFactory.ts';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory.ts';
import { VersionTreeService } from
  'pages/exploration-editor-page/history-tab/services/version-tree.service.ts';
import { VoiceoverObjectFactory } from
  'domain/exploration/VoiceoverObjectFactory.ts';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory.ts';
import { WrittenTranslationsObjectFactory } from
  'domain/exploration/WrittenTranslationsObjectFactory.ts';
// ^^^ This block is to be removed.

require('pages/exploration-editor-page/history-tab/history-tab.directive.ts');

describe('HistoryTab controller', function() {
  beforeEach(angular.mock.module('oppia'));
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('EditabilityService', new EditabilityService());
    $provide.value(
      'ExplorationDraftObjectFactory', new ExplorationDraftObjectFactory());
    $provide.value(
      'HintObjectFactory', new HintObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'OutcomeObjectFactory', new OutcomeObjectFactory(
        new SubtitledHtmlObjectFactory()));
    $provide.value(
      'ParamChangeObjectFactory', new ParamChangeObjectFactory());
    $provide.value(
      'RecordedVoiceoversObjectFactory',
      new RecordedVoiceoversObjectFactory(new VoiceoverObjectFactory()));
    $provide.value('RuleObjectFactory', new RuleObjectFactory());
    $provide.value(
      'SubtitledHtmlObjectFactory', new SubtitledHtmlObjectFactory());
    $provide.value('VersionTreeService', new VersionTreeService());
    $provide.value('VoiceoverObjectFactory', new VoiceoverObjectFactory());
    $provide.value(
      'WrittenTranslationObjectFactory',
      new WrittenTranslationObjectFactory());
    $provide.value(
      'WrittenTranslationsObjectFactory',
      new WrittenTranslationsObjectFactory(
        new WrittenTranslationObjectFactory()));
  }));

  describe('HistoryTab', function() {
    var $componentController, historyTabCtrl;

    beforeEach(angular.mock.inject(function(_$componentController_) {
      $componentController = _$componentController_;
      historyTabCtrl = $componentController('historyTab', null, {});
    }));

    it('should get version numbers of revisions to be displayed',
      function() {
        historyTabCtrl.displayedCurrentPageNumber = 1;
        historyTabCtrl.versionCheckboxArray = [
          {vnum: 32, selected: false},
          {vnum: 31, selected: true},
          {vnum: 30, selected: false},
          {vnum: 29, selected: false},
          {vnum: 28, selected: false},
          {vnum: 27, selected: false},
          {vnum: 26, selected: false},
          {vnum: 25, selected: false},
          {vnum: 24, selected: false},
          {vnum: 23, selected: false},
          {vnum: 22, selected: false},
          {vnum: 21, selected: false},
          {vnum: 20, selected: false},
          {vnum: 19, selected: false},
          {vnum: 18, selected: false},
          {vnum: 17, selected: false},
          {vnum: 16, selected: false},
          {vnum: 15, selected: false},
          {vnum: 14, selected: true},
          {vnum: 13, selected: false},
          {vnum: 12, selected: false},
          {vnum: 11, selected: false},
          {vnum: 10, selected: false},
          {vnum: 9, selected: false},
          {vnum: 8, selected: false},
          {vnum: 7, selected: false},
          {vnum: 6, selected: false},
          {vnum: 5, selected: false},
          {vnum: 4, selected: false},
          {vnum: 3, selected: false},
          {vnum: 2, selected: false},
          {vnum: 1, selected: false}
        ];
        historyTabCtrl.computeVersionsToDisplay();
        expect(historyTabCtrl.versionNumbersToDisplay).toEqual([
          32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16,
          15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3]);
        historyTabCtrl.displayedCurrentPageNumber = 2;
        historyTabCtrl.computeVersionsToDisplay();
        expect(historyTabCtrl.versionNumbersToDisplay).toEqual([2, 1]);
      }
    );
  });
});
