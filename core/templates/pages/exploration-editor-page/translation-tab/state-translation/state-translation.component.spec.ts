// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for stateTranslation.
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CkEditorCopyContentService } from
  'components/ck-editor-helpers/ck-editor-copy-content-service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
import { AnswerGroupsCacheService } from
  // eslint-disable-next-line max-len
  'pages/exploration-editor-page/editor-tab/services/answer-groups-cache.service';
import { TextInputRulesService } from
  'interactions/TextInput/directives/text-input-rules.service';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { StateCustomizationArgsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { StateInteractionIdService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateSolutionService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateEditorService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateRecordedVoiceoversService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateWrittenTranslationsService } from
  // eslint-disable-next-line max-len
  'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { RecordedVoiceoversObjectFactory } from
  'domain/exploration/RecordedVoiceoversObjectFactory';
import { SubtitledHtmlObjectFactory } from
  'domain/exploration/SubtitledHtmlObjectFactory';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { WrapTextWithEllipsisPipe } from
  'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { FractionObjectFactory } from
  'domain/objects/FractionObjectFactory';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { ContinueValidationService } from
  'interactions/Continue/directives/continue-validation.service';
import { ContinueRulesService } from
  'interactions/Continue/directives/continue-rules.service';

fdescribe('State translation component', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var answerGroupObjectFactory = null;
  var ckEditorCopyContentService = null;
  var explorationStatesService = null;
  var outcomeObjectFactory = null;
  var recordedVoiceoversObjectFactory = null;
  var routerService = null;
  var stateEditorService = null;
  var stateRecordedVoiceoversService = null;
  var subtitledHtmlObjectFactory = null;
  var translationLanguageService = null;
  var translationTabActiveContentIdService = null;
  var translationTabActiveModeService = null;

  var explorationState1 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      interaction: {
        id: 'TextInput',
        customization_args: {
          placeholder: {
            value: {
              content_id: '',
              unicode_str: ''
            }
          },
          rows: {
            value: 1
          }
        },
        answer_groups: [{
          rule_specs: [],
          outcome: {
            dest: 'unused',
            feedback: {
              content_id: 'feedback_1',
              html: ''
            },
          }
        }, {
          rule_specs: [],
          outcome: {
            dest: 'unused',
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
          }
        }],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: 'Default Outcome'
          },
        },
        solution: {
          correct_answer: 'This is the correct answer',
          answer_is_exclusive: false,
          explanation: {
            html: 'Solution explanation',
            content_id: 'solution_1'
          }
        },
        hints: [{
          hint_content: {
            html: 'Hint 1',
            content_id: 'hint_1'
          }
        }, {
          hint_content: {
            html: 'Hint 2',
            content_id: 'hint_2'
          }
        }]
      },
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
      },
      written_translations: {
        translations_mapping: {
          content_1: {
            en: {
              data_format: 'html',
              translation: 'Translation',
              needs_update: false
            }
          }
        }
      }
    }
  };
  var explorationState2 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      interaction: {
        id: 'TextInput',
        customization_args: {
          placeholder: {
            value: {
              content_id: '',
              unicode_str: ''
            }
          },
          rows: {
            value: 1
          }
        },
        answer_groups: [],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: 'Default Outcome'
          },
        },
        solution: {
          correct_answer: 'This is the correct answer',
          answer_is_exclusive: false,
          explanation: {
            html: 'Solution explanation',
            content_id: 'solution_1'
          }
        },
        hints: [{
          hint_content: {
            html: 'Hint 1',
            content_id: 'hint_1'
          }
        }, {
          hint_content: {
            html: 'Hint 2',
            content_id: 'hint_2'
          }
        }]
      },
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
      },
      written_translations: {
        translations_mapping: {
          content_1: {
            en: {
              data_format: 'html',
              translation: 'Translation',
              needs_update: false
            }
          }
        }
      }
    }
  };
  var explorationState3 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      interaction: {
        id: 'Continue',
        customization_args: {
          buttonText: {
            value: {
              content_id: 'content',
              unicode_str: 'Button text value'
            }
          }
        },
        answer_groups: [],
        default_outcome: {
          dest: 'default',
          feedback: {
            content_id: 'default_outcome',
            html: 'Default Outcome'
          },
        },
        solution: {
          correct_answer: 'This is the correct answer',
          answer_is_exclusive: false,
          explanation: {
            html: 'Solution explanation',
            content_id: 'solution_1'
          }
        },
        hints: [{
          hint_content: {
            html: 'Hint 1',
            content_id: 'hint_1'
          }
        }, {
          hint_content: {
            html: 'Hint 2',
            content_id: 'hint_2'
          }
        }]
      },
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
      },
      written_translations: {
        translations_mapping: {
          content_1: {
            en: {
              data_format: 'html',
              translation: 'Translation',
              needs_update: false
            }
          }
        }
      }
    }
  };
  var explorationState4 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      interaction: {
        id: 'TextInput',
        customization_args: {
          placeholder: {
            value: {
              content_id: '',
              unicode_str: ''
            }
          },
          rows: {
            value: 1
          }
        },
        answer_groups: [],
        hints: []
      },
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
      },
      written_translations: {
        translations_mapping: {
          content_1: {
            en: {
              data_format: 'html',
              translation: 'Translation',
              needs_update: false
            }
          }
        }
      }
    }
  };
  var recordedVoiceovers = {
    voiceovers_mapping: {
      content: {},
      default_outcome: {},
      content_1: {},
      feedback_1: {},
      hint_1: {},
      solution: {},
      solution_1: {}
    }
  };

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'AnswerGroupsCacheService', TestBed.get(AnswerGroupsCacheService));
    $provide.value('ContinueValidationService',
      TestBed.get(ContinueValidationService));
    $provide.value('ContinueRulesService',
      TestBed.get(ContinueRulesService));
    $provide.value('ExplorationImprovementsTaskRegistryService',
      TestBed.get(ExplorationImprovementsTaskRegistryService));
    $provide.value('ExplorationStatsService',
      TestBed.get(ExplorationStatsService));
    $provide.value('FractionObjectFactory', TestBed.get(FractionObjectFactory));
    $provide.value('NumberWithUnitsObjectFactory',
      TestBed.get(NumberWithUnitsObjectFactory));
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', outcomeObjectFactory);
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value('StateInteractionIdService',
      TestBed.get(StateInteractionIdService));
    $provide.value('StateRecordedVoiceoversService',
      stateRecordedVoiceoversService);
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value('StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
  }));

  beforeEach(function() {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WrapTextWithEllipsisPipe, ConvertToPlainTextPipe]
    });

    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    ckEditorCopyContentService = TestBed.get(CkEditorCopyContentService);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    recordedVoiceoversObjectFactory = TestBed.get(
      RecordedVoiceoversObjectFactory);
    stateEditorService = TestBed.get(StateEditorService);
    stateRecordedVoiceoversService = TestBed.get(
      StateRecordedVoiceoversService);
    subtitledHtmlObjectFactory = TestBed.get(SubtitledHtmlObjectFactory);
  });

  describe('when translation tab is not busy and voiceover mode is' +
    ' active', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $filter = $injector.get('$filter');
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      routerService = $injector.get('RouterService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');

      spyOn(ckEditorCopyContentService, 'copyModeActive').and
        .returnValue(true);
      spyOn(translationLanguageService, 'getActiveLanguageCode').and
        .returnValue('en');
      spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
        .returnValue(true);
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'Introduction');
      explorationStatesService.init(explorationState1);
      stateRecordedVoiceoversService.init('Introduction',
        recordedVoiceoversObjectFactory.createFromBackendDict(
          recordedVoiceovers));

      $scope = $rootScope.$new();
      ctrl = $componentController('stateTranslation', {
        $filter: $filter,
        $rootScope: $rootScope,
        $scope: $scope,
        CkEditorCopyContentService: ckEditorCopyContentService,
        StateEditorService: stateEditorService
      }, {
        isTranslationTabBusy: false
      });
      ctrl.$onInit();
    }));

    it('should init state translation when refreshing page', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $rootScope.$broadcast('refreshStateTranslation');

      expect($scope.isActive('content')).toBe(true);
      expect($scope.isDisabled('content')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('content_1');
    });

    it('should navigate to a given state', function() {
      spyOn(routerService, 'navigateToMainTab');
      $scope.navigateToState('Introduction');

      expect(routerService.navigateToMainTab).toHaveBeenCalledWith(
        'Introduction');
    });

    it('should broadcast copy to ck editor when clicking on content',
      function() {
        spyOn(ckEditorCopyContentService, 'broadcastCopy').and
          .callFake(() => {});

        var mockEvent = {
          stopPropagation: jasmine.createSpy('stopPropagation', () => {}),
          target: {}
        };
        $scope.onContentClick(mockEvent);

        expect(mockEvent.stopPropagation).toHaveBeenCalled();
        expect(ckEditorCopyContentService.broadcastCopy).toHaveBeenCalledWith(
          mockEvent.target);
      });

    it('should activate content tab when clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('content');

      expect($scope.isActive('content')).toBe(true);
      expect($scope.isDisabled('content')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('content_1');
      expect($scope.tabStatusColorStyle('content')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('content')).toBe(false);
      expect($scope.contentIdNeedUpdates('content_1')).toBe(false);
      expect($scope.contentIdStatusColorStyle('content_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate feedback tab when clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('feedback');

      expect($scope.isActive('feedback')).toBe(true);
      expect($scope.isDisabled('feedback')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('feedback_1');
      expect($scope.tabStatusColorStyle('feedback')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('feedback')).toBe(false);
      expect($scope.contentIdNeedUpdates('feedback_1')).toBe(false);
      expect($scope.contentIdStatusColorStyle('feedback_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate hint tab when clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('hint');

      expect($scope.isActive('hint')).toBe(true);
      expect($scope.isDisabled('hint')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('hint_1');
      expect($scope.tabStatusColorStyle('hint')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('hint')).toBe(false);
      expect($scope.contentIdNeedUpdates('hint_1')).toBe(false);
      expect($scope.contentIdStatusColorStyle('hint_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate solution tab when clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('solution');

      expect($scope.isActive('solution')).toBe(true);
      expect($scope.isDisabled('solution')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('solution_1');
      expect($scope.tabStatusColorStyle('solution')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('solution')).toBe(false);
      expect($scope.contentIdNeedUpdates('solution')).toBe(false);
      expect($scope.contentIdStatusColorStyle('solution_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should change active hint index ', function() {
      $scope.onTabClick('hint');

      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.changeActiveHintIndex(1);

      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('hint_2');
    });

    it('should not change active hint index if it is equal to the current one',
      function() {
        $scope.onTabClick('hint');

        spyOn(translationTabActiveContentIdService, 'setActiveContentId');
        $scope.changeActiveHintIndex(0);

        expect(translationTabActiveContentIdService.setActiveContentId).not
          .toHaveBeenCalled();
      });

    it('should change active answer group index ', function() {
      $scope.onTabClick('feedback');

      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.changeActiveAnswerGroupIndex(1);

      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('feedback_2');
    });

    it('should change active answer group index to default outcome when' +
      ' index provided is equal to answer groups length', function() {
      $scope.onTabClick('feedback');

      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.changeActiveAnswerGroupIndex(2);

      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('default_outcome');
    });

    it('should not change active hint index if it is equal to the current one',
      function() {
        $scope.onTabClick('feedback');

        spyOn(translationTabActiveContentIdService, 'setActiveContentId');
        $scope.changeActiveAnswerGroupIndex(0);

        expect(translationTabActiveContentIdService.setActiveContentId).not
          .toHaveBeenCalled();
      });

    it('should get subtitled html data translation', function() {
      var subtitledObject = subtitledHtmlObjectFactory.createFromBackendDict({
        content_id: 'content_1',
        html: 'This is the html'
      });
      expect($scope.getRequiredHtml(subtitledObject)).toBe('Translation');
      expect($scope.getHtmlSummary(subtitledObject)).toBe('This is the html');
    });

    it('should get content message warning that creating translation' +
      ' is allowed only when it is on translation mode', function() {
      expect($scope.getEmptyContentMessage()).toBe(
        'The translation for this section has not been created yet.' +
        ' Switch to translation mode to add a text translation.');
    });

    it('should get summary default outcome when outcome is linear',
      function() {
        expect($scope.summarizeDefaultOutcome(
          outcomeObjectFactory.createNew(
            'unused', '1', 'Feedback Text', []), 'Continue', 0, true))
          .toBe('[When the button is clicked] Feedback Text');
      });

    it('should get summary default outcome when answer group count' +
      ' is greater than 0', function() {
      expect($scope.summarizeDefaultOutcome(
        outcomeObjectFactory.createNew(
          'unused', '1', 'Feedback Text', []), 'TextInput', 1, true))
        .toBe('[All other answers] Feedback Text');
    });

    it('should get summary default outcome when answer group count' +
      ' is equal to 0', function() {
      expect($scope.summarizeDefaultOutcome(
        outcomeObjectFactory.createNew(
          'unused', '1', 'Feedback Text', []), 'TextInput', 0, true))
        .toBe('[All answers] Feedback Text');
    });

    it('should get an empty summary when default outcome is a falsy value',
      function() {
        expect($scope.summarizeDefaultOutcome(null, 'Continue', 0, true))
          .toBe('');
      });

    it('should get summary answer group', function() {
      expect($scope.summarizeAnswerGroup(
        answerGroupObjectFactory.createNew(
          [], outcomeObjectFactory.createNew('unused', '1', 'Feedback text'),
          'Training data text', '0'), '1', {}, true))
        .toBe('[Answer] Feedback text');
    });
  });

  describe('when translation tab is busy and voiceover mode is not' +
    ' activate', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');

      spyOn(translationLanguageService, 'getActiveLanguageCode').and
        .returnValue('en');
      spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
        .returnValue(false);
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'Introduction');
      explorationStatesService.init(explorationState1);
      stateRecordedVoiceoversService.init('Introduction',
        recordedVoiceoversObjectFactory.createFromBackendDict(
          recordedVoiceovers));

      spyOn($rootScope, '$broadcast');

      $scope = $rootScope.$new();
      ctrl = $componentController('stateTranslation', {
        $rootScope: $rootScope,
        $scope: $scope,
        CkEditorCopyContentService: ckEditorCopyContentService,
        StateEditorService: stateEditorService
      }, {
        isTranslationTabBusy: true
      });
      ctrl.$onInit();
    }));

    it('should open translation tab busy modal when clicking on content' +
      ' tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('content');

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');
      expect(translationTabActiveContentIdService.setActiveContentId).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on feedback' +
      ' tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('feedback');

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');
      expect(translationTabActiveContentIdService.setActiveContentId).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on hint' +
      ' tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('hint');

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');
      expect(translationTabActiveContentIdService.setActiveContentId).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on solution' +
      ' tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('solution');

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');
      expect(translationTabActiveContentIdService.setActiveContentId).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
      ' active hint index ', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.changeActiveHintIndex(1);

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');
      expect(translationTabActiveContentIdService.setActiveContentId).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
      ' active answer group index ', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.changeActiveAnswerGroupIndex(1);

      expect($rootScope.$broadcast).toHaveBeenCalledWith(
        'showTranslationTabBusyModal');
      expect(translationTabActiveContentIdService.setActiveContentId).not
        .toHaveBeenCalled();
    });

    it('should get subtitled html data', function() {
      var subtitledObject = subtitledHtmlObjectFactory.createFromBackendDict({
        content_id: 'content_1',
        html: 'This is the html'
      });
      expect($scope.getRequiredHtml(subtitledObject)).toBe('This is the html');
      expect($scope.getHtmlSummary(subtitledObject)).toBe('This is the html');
    });

    it('should get content message warning that there is not text available' +
      ' to translate', function() {
      expect($scope.getEmptyContentMessage()).toBe(
        'There is no text available to translate.');
    });
  });

  describe('when state has default outcome and no answer groups', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $filter = $injector.get('$filter');
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      routerService = $injector.get('RouterService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'Introduction');
      explorationStatesService.init(explorationState2);
      stateRecordedVoiceoversService.init('Introduction',
        recordedVoiceoversObjectFactory.createFromBackendDict(
          recordedVoiceovers));

      $scope = $rootScope.$new();
      ctrl = $componentController('stateTranslation', {
        $filter: $filter,
        $rootScope: $rootScope,
        $scope: $scope,
        CkEditorCopyContentService: ckEditorCopyContentService,
        StateEditorService: stateEditorService
      }, {
        isTranslationTabBusy: false
      });
      ctrl.$onInit();
    }));

    it('should activate feedback tab with default outcome when' +
      ' clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContentId');
      $scope.onTabClick('feedback');

      expect($scope.isActive('feedback')).toBe(true);
      expect($scope.isDisabled('feedback')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContentId)
        .toHaveBeenCalledWith('default_outcome');
    });
  });

  describe('when state is linear', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      routerService = $injector.get('RouterService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'Introduction');
      explorationStatesService.init(explorationState3);
      stateRecordedVoiceoversService.init('Introduction',
        recordedVoiceoversObjectFactory.createFromBackendDict(
          recordedVoiceovers));

      $scope = $rootScope.$new();
      ctrl = $componentController('stateTranslation', {
        $rootScope: $rootScope,
        $scope: $scope,
        CkEditorCopyContentService: ckEditorCopyContentService,
        StateEditorService: stateEditorService
      }, {
        isTranslationTabBusy: false
      });
      ctrl.$onInit();
    }));

    it('should evaluate hint tab as enabled', function() {
      expect($scope.isDisabled('content')).toBe(false);
    });


    it('should evaluate feedback tab as disable', function() {
      expect($scope.isDisabled('feedback')).toBe(true);
    });

    it('should evaluate hint tab as disable', function() {
      expect($scope.isDisabled('hint')).toBe(true);
    });


    it('should evaluate solution tab as disable', function() {
      expect($scope.isDisabled('solution')).toBe(true);
    });
  });

  describe('when state has no hints, solution and outcome', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      routerService = $injector.get('RouterService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'Introduction');
      explorationStatesService.init(explorationState4);
      stateRecordedVoiceoversService.init('Introduction',
        recordedVoiceoversObjectFactory.createFromBackendDict(
          recordedVoiceovers));

      $scope = $rootScope.$new();
      ctrl = $componentController('stateTranslation', {
        $rootScope: $rootScope,
        $scope: $scope,
        CkEditorCopyContentService: ckEditorCopyContentService,
        StateEditorService: stateEditorService
      }, {
        isTranslationTabBusy: false
      });
      ctrl.$onInit();
    }));

    it('should evaluate feedback tab as disable', function() {
      expect($scope.isDisabled('feedback')).toBe(true);
    });

    it('should evaluate hint tab as disable', function() {
      expect($scope.isDisabled('hint')).toBe(true);
    });

    it('should evaluate solution tab as disable', function() {
      expect($scope.isDisabled('solution')).toBe(true);
    });
  });
});
