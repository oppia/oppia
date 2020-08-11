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
 * @fileoverview Unit tests for stateTranslationEditor.
 */

import { TestBed } from '@angular/core/testing';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { WrittenTranslationObjectFactory } from
  'domain/exploration/WrittenTranslationObjectFactory';
import { StateObjectFactory } from 'domain/state/StateObjectFactory';

describe('State Translation Editor Component', function() {
  var $q = null;
  var $rootScope = null;
  var $scope = null;
  var $uibModal = null;
  var editabilityService = null;
  var explorationStatesService = null;
  var stateEditorService = null;
  var stateObjectFactory = null;
  var stateWrittenTranslationsService = null;
  var translationLanguageService = null;
  var translationTabActiveContentIdService = null;
  var writtenTranslationObjectFactory = null;

  var stateName = 'State1';
  var state = {
    classifier_model_id: '1',
    content: {
      content_id: 'content1',
      html: 'This is a html text'
    },
    interaction: {
      answer_groups: [{
        outcome: {
          dest: 'outcome 1',
          feedback: {
            content_id: 'content2',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        rule_types_to_inputs_translations: {},
        rule_inputs: {},
        tagged_skill_misconception_id: ''
      }, {
        outcome: {
          dest: 'outcome 2',
          feedback: {
            content_id: 'content3',
            html: ''
          },
          labelled_as_correct: true,
          param_changes: [],
          refresher_exploration_id: null
        },
        rule_types_to_inputs_translations: {},
        rule_inputs: {},
        tagged_skill_misconception_id: ''
      }],
      confirmed_unclassified_answers: null,
      customization_args: {},
      hints: [],
      id: null,
      solution: {
        answer_is_exclusive: false,
        correct_answer: 'This is the correct answer',
        explanation: {
          content_id: 'content1',
          html: 'This is a html text'
        }
      }
    },
    param_changes: [],
    recorded_voiceovers: {
      voiceovers_mapping: {
        content_1: {
          en: {
            needs_update: false,
          },
          es: {
            needs_update: true,
          }
        }
      }
    },
    solicit_answer_details: true,
    written_translations: {
      translations_mapping: {}
    },
  };
  var stateObj = null;

  beforeEach(angular.mock.module('oppia'));

  beforeEach(function() {
    stateEditorService = TestBed.get(StateEditorService);
    stateObjectFactory = TestBed.get(StateObjectFactory);
    stateWrittenTranslationsService = TestBed.get(
      StateWrittenTranslationsService);
    writtenTranslationObjectFactory = TestBed.get(
      WrittenTranslationObjectFactory);
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('StateRecordedVoiceoversService', TestBed.get(
      StateRecordedVoiceoversService));
    $provide.value('StateWrittenTranslationsService',
      stateWrittenTranslationsService);
  }));

  describe('when has written translation', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      editabilityService = $injector.get('EditabilityService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);
      spyOn(editabilityService, 'isEditable').and.returnValue(true);
      stateObj = stateObjectFactory.createFromBackendDict(stateName, state);
      spyOn(explorationStatesService, 'getState').and.returnValue(stateObj);
      spyOn(explorationStatesService, 'saveWrittenTranslations').and.callFake(
        () => {});

      stateWrittenTranslationsService.init(stateName, {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a html',
            needs_update: true
          })
        ),
        updateWrittenTranslationHtml: () => {}
      });

      $scope = $rootScope.$new();
      var ctrl = $componentController('stateTranslationEditor', {
        $scope: $scope,
        StateEditorService: stateEditorService,
        StateWrittenTranslationsService: stateWrittenTranslationsService,
        WrittenTranslationObjectFactory: writtenTranslationObjectFactory
      });
      ctrl.$onInit();
    }));

    it('should evaluate $scope properties after controller initialization',
      function() {
        expect($scope.translationEditorIsOpen).toBe(false);
        expect($scope.activeWrittenTranslation).toEqual(
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a html',
            needs_update: true
          }));
      });

    it('should not update state\'s recorded voiceovers after broadcasting' +
      ' externalSave when written translation doesn\'t need udpdate',
    function() {
      $scope.openTranslationEditor();
      expect($scope.translationEditorIsOpen).toBe(true);
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        )
      };
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(translationLanguageService, 'getActiveLanguageCode').and
        .returnValue('es');
      spyOn($uibModal, 'open');

      $rootScope.$broadcast('externalSave');

      expect($uibModal.open).not.toHaveBeenCalled();
    });

    it('should update state\'s recorded voiceovers after broadcasting' +
      ' externalSave event when closing modal', function() {
      $scope.openTranslationEditor();
      expect($scope.translationEditorIsOpen).toBe(true);
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        )
      };
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(translationLanguageService, 'getActiveLanguageCode').and
        .returnValue('en');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.resolve()
      });

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);

      $rootScope.$broadcast('externalSave');
      $scope.$apply();

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(true);
    });

    it('should update state\'s recorded voiceovers after broadcasting' +
    ' externalSave event when dismissing modal', function() {
      $scope.openTranslationEditor();
      expect($scope.translationEditorIsOpen).toBe(true);
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        )
      };
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(translationLanguageService, 'getActiveLanguageCode').and
        .returnValue('en');
      spyOn($uibModal, 'open').and.returnValue({
        result: $q.reject()
      });

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);

      $rootScope.$broadcast('externalSave');
      $scope.$apply();

      expect(
        stateObj.recordedVoiceovers.getBindableVoiceovers('content_1')
          .en.needsUpdate).toBe(false);
    });

    it('should update written translation html when clicking on save' +
      ' translation button', function() {
      spyOn(
        stateWrittenTranslationsService.displayed,
        'updateWrittenTranslationHtml').and.callThrough();
      $scope.onSaveTranslationButtonClicked();

      expect(
        stateWrittenTranslationsService.displayed.updateWrittenTranslationHtml)
        .toHaveBeenCalled();
    });

    it('should cancel edit and restore values', function() {
      stateWrittenTranslationsService.displayed = {
        hasWrittenTranslation: () => true,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a second html',
            needs_update: true
          })
        )
      };
      $scope.cancelEdit();

      expect(
        stateWrittenTranslationsService.displayed.getWrittenTranslation()
          .getHtml()
      ).toBe('This is a html');
    });

    it('should init editor when changing active content id language',
      function() {
        $rootScope.$broadcast('activeContentIdChanged');
        expect($scope.translationEditorIsOpen).toBe(false);
        expect($scope.activeWrittenTranslation).toEqual(
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a html',
            needs_update: true
          }));
      });

    it('should init editor when changing active language', function() {
      $rootScope.$broadcast('activeLanguageChanged');
      expect($scope.translationEditorIsOpen).toBe(false);
      expect($scope.activeWrittenTranslation).toEqual(
        writtenTranslationObjectFactory.createFromBackendDict({
          data_format: 'html',
          translation: 'This is a html',
          needs_update: true
        }));
    });
  });

  describe('when hasn\'t written translation', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $q = $injector.get('$q');
      $rootScope = $injector.get('$rootScope');
      $uibModal = $injector.get('$uibModal');
      editabilityService = $injector.get('EditabilityService');
      explorationStatesService = $injector.get('ExplorationStatesService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        stateName);
      spyOn(editabilityService, 'isEditable').and.returnValue(true);
      stateObj = stateObjectFactory.createFromBackendDict(stateName, state);
      spyOn(explorationStatesService, 'getState').and.returnValue(stateObj);
      spyOn(explorationStatesService, 'saveWrittenTranslations').and.callFake(
        () => {});

      stateWrittenTranslationsService.init(stateName, {
        hasWrittenTranslation: () => false,
        getWrittenTranslation: () => (
          writtenTranslationObjectFactory.createFromBackendDict({
            data_format: 'html',
            translation: 'This is a html',
            needs_update: true
          })
        ),
        addWrittenTranslation: () => {}
      });

      $scope = $rootScope.$new();
      var ctrl = $componentController('stateTranslationEditor', {
        $scope: $scope,
        StateEditorService: stateEditorService,
        StateWrittenTranslationsService: stateWrittenTranslationsService,
        WrittenTranslationObjectFactory: writtenTranslationObjectFactory
      });
      ctrl.$onInit();
    }));

    it('should evaluate $scope properties after controller initialization',
      function() {
        expect($scope.translationEditorIsOpen).toBe(false);
        expect($scope.activeWrittenTranslation).toBe(null);
      });

    it('should open translation editor when is editable', function() {
      $scope.openTranslationEditor();
      expect($scope.translationEditorIsOpen).toBe(true);
      expect($scope.activeWrittenTranslation).toEqual(
        writtenTranslationObjectFactory.createNew('html', ''));
    });

    it('should add written translation html when clicking on save' +
      ' translation button', function() {
      $scope.openTranslationEditor();
      spyOn(
        stateWrittenTranslationsService.displayed,
        'addWrittenTranslation').and.callThrough();
      spyOn(translationTabActiveContentIdService, 'getActiveContentId').and
        .returnValue('content_1');
      spyOn(translationLanguageService, 'getActiveLanguageCode').and
        .returnValue('es');
      $scope.onSaveTranslationButtonClicked();

      expect(
        stateWrittenTranslationsService.displayed.addWrittenTranslation)
        .toHaveBeenCalled();
    });
  });
});
