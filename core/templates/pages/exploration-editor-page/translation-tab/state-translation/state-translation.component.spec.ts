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
  'components/ck-editor-helpers/ck-editor-copy-content.service';
import { AngularNameService } from
  'pages/exploration-editor-page/services/angular-name.service';
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
import { StateEditorRefreshService } from
  'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ExplorationStatsService } from 'services/exploration-stats.service';
import { ExplorationImprovementsTaskRegistryService } from
  'services/exploration-improvements-task-registry.service';
import { RecordedVoiceovers } from
  'domain/exploration/recorded-voiceovers.model';
import { SubtitledHtml } from
  'domain/exploration/subtitled-html.model';
import { AnswerGroupObjectFactory } from
  'domain/exploration/AnswerGroupObjectFactory';
import { WrapTextWithEllipsisPipe } from
  'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { ConvertToPlainTextPipe } from
  'filters/string-utility-filters/convert-to-plain-text.pipe';
import { NumberWithUnitsObjectFactory } from
  'domain/objects/NumberWithUnitsObjectFactory';
import { ContinueValidationService } from
  'interactions/Continue/directives/continue-validation.service';
import { ContinueRulesService } from
  'interactions/Continue/directives/continue-rules.service';
import { EventEmitter } from '@angular/core';
import { ExternalSaveService } from 'services/external-save.service';
import { SubtitledUnicodeObjectFactory } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import { ReadOnlyExplorationBackendApiService } from
  'domain/exploration/read-only-exploration-backend-api.service';
// TODO(#7222): Remove the following block of unnnecessary imports once
// the code corresponding to the spec is upgraded to Angular 8.
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
// ^^^ This block is to be removed.

const DEFAULT_OBJECT_VALUES = require('objects/object_defaults.json');


describe('State translation component', function() {
  var ctrl = null;
  var $rootScope = null;
  var $scope = null;
  var answerGroupObjectFactory = null;
  var ckEditorCopyContentService = null;
  var explorationStatesService = null;
  var outcomeObjectFactory = null;
  var routerService = null;
  var stateEditorService = null;
  var stateRecordedVoiceoversService = null;
  var subtitledUnicodeObjectFactory = null;
  var translationLanguageService = null;
  var entityTranslationsService = null;
  var contextService = null;
  var translationTabActiveContentIdService = null;
  var translationTabActiveModeService = null;
  var explorationHtmlFormatterService = null;

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
              content_id: 'ca_placeholder',
              unicode_str: ''
            }
          },
          rows: {
            value: 1
          }
        },
        answer_groups: [{
          rule_specs: [{
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_4',
                normalizedStrSet: ['input1']
              }
            }
          }, {
            rule_type: 'Equals',
            inputs: {
              x: {
                contentId: 'rule_input_5',
                normalizedStrSet: ['input2']
              }
            }
          }],
          outcome: {
            dest: 'unused',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_1',
              html: ''
            },
          }
        }, {
          rule_specs: [],
          outcome: {
            dest: 'unused',
            dest_if_really_stuck: null,
            feedback: {
              content_id: 'feedback_2',
              html: ''
            },
          }
        }],
        default_outcome: {
          dest: 'default',
          dest_if_really_stuck: null,
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
      linked_skill_id: null,
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
          },
          ca_placeholder: {},
          rule_input_4: {},
          rule_input_5: {}
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
              content_id: 'ca_placeholder',
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
          dest_if_really_stuck: null,
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
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
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
              content_id: 'ca_placeholder',
              unicode_str: 'Button text value'
            }
          }
        },
        answer_groups: [],
        default_outcome: {
          dest: 'default',
          dest_if_really_stuck: null,
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
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
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
      linked_skill_id: null,
      next_content_id_index: 0,
      param_changes: [],
      solicit_answer_details: false,
      recorded_voiceovers: {
        voiceovers_mapping: {}
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
      solution_1: {},
      ca_placeholder: {},
      ca_fakePlaceholder: {},
      rule_input_4: {},
      rule_input_5: {}
    }
  };

  var refreshStateTranslationEmitter = new EventEmitter();
  var showTranslationTabBusyModalEmitter = new EventEmitter();
  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('NgbModal', {
      open: () => {
        return {
          result: Promise.resolve()
        };
      }
    });
  }));

  importAllAngularServices();

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [WrapTextWithEllipsisPipe, ConvertToPlainTextPipe]
    });
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.value('AngularNameService', TestBed.get(AngularNameService));
    $provide.value(
      'ContinueValidationService', TestBed.get(ContinueValidationService));
    $provide.value(
      'ContinueRulesService', TestBed.get(ContinueRulesService));
    $provide.value(
      'ExplorationImprovementsTaskRegistryService',
      TestBed.get(ExplorationImprovementsTaskRegistryService));
    $provide.value(
      'ExplorationStatsService', TestBed.get(ExplorationStatsService));
    $provide.value('ExternalSaveService', TestBed.get(ExternalSaveService));
    $provide.value(
      'NumberWithUnitsObjectFactory',
      TestBed.get(NumberWithUnitsObjectFactory));
    $provide.value(
      'TextInputRulesService',
      TestBed.get(TextInputRulesService));
    $provide.value(
      'OutcomeObjectFactory', outcomeObjectFactory);
    $provide.value(
      'StateCustomizationArgsService',
      TestBed.get(StateCustomizationArgsService));
    $provide.value(
      'StateInteractionIdService', TestBed.get(StateInteractionIdService));
    $provide.value(
      'StateEditorRefreshService', TestBed.get(StateEditorRefreshService));
    $provide.value(
      'StateRecordedVoiceoversService', stateRecordedVoiceoversService);
    $provide.value('StateSolutionService', TestBed.get(StateSolutionService));
    $provide.value(
      'StateWrittenTranslationsService',
      TestBed.get(StateWrittenTranslationsService));
    $provide.value(
      'ReadOnlyExplorationBackendApiService',
      TestBed.get(ReadOnlyExplorationBackendApiService));
  }));

  beforeEach(function() {
    answerGroupObjectFactory = TestBed.get(AnswerGroupObjectFactory);
    ckEditorCopyContentService = TestBed.get(CkEditorCopyContentService);
    outcomeObjectFactory = TestBed.get(OutcomeObjectFactory);
    stateEditorService = TestBed.get(StateEditorService);
    spyOnProperty(stateEditorService, 'onRefreshStateTranslation').and
      .returnValue(refreshStateTranslationEmitter);
    stateRecordedVoiceoversService = TestBed.get(
      StateRecordedVoiceoversService);
    subtitledUnicodeObjectFactory = TestBed.get(SubtitledUnicodeObjectFactory);
  });

  afterEach(function() {
    ctrl.$onDestroy();
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
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
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
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      refreshStateTranslationEmitter.emit();

      expect($scope.isActive('content')).toBe(true);
      expect($scope.isVoiceoverModeActive()).toBe(true);
      expect($scope.isDisabled('content')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('content_1', 'html');
    });

    it('should navigate to a given state', function() {
      spyOn(routerService, 'navigateToMainTab');
      $scope.navigateToState('Introduction');

      expect(routerService.navigateToMainTab).toHaveBeenCalledWith(
        'Introduction');
    });

    it('should get customization argument translatable customization' +
      ' arguments', () => {
      let content = SubtitledHtml.createDefault('', '');
      let translatableCa = (
        $scope.getInteractionCustomizationArgTranslatableContents({
          testingCustArgs: {
            value: {
              innerValue: content
            }
          }
        })
      );
      expect(translatableCa).toEqual([{
        name: 'Testing Cust Args > Inner Value',
        content
      }]);
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
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('content');

      expect($scope.isActive('content')).toBe(true);
      expect($scope.isDisabled('content')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('content_1', 'html');
      expect($scope.tabStatusColorStyle('content')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('content')).toBe(false);
      expect($scope.contentIdNeedUpdates('content_1')).toBe(false);
      expect($scope.contentIdStatusColorStyle('content_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate interaction custimization arguments tab when ' +
       'clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('ca');

      expect($scope.isActive('ca')).toBe(true);
      expect($scope.isDisabled('ca')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('ca_placeholder', 'unicode');
      expect($scope.tabStatusColorStyle('ca')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('ca')).toBe(false);
      expect($scope.contentIdNeedUpdates('ca_placeholder')).toBe(false);
      expect($scope.contentIdStatusColorStyle('ca_placeholder')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate feedback tab when clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('feedback');

      expect($scope.isActive('feedback')).toBe(true);
      expect($scope.isDisabled('feedback')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('feedback_1', 'html');
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
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('hint');

      expect($scope.isActive('hint')).toBe(true);
      expect($scope.isDisabled('hint')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('hint_1', 'html');
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
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('solution');

      expect($scope.isActive('solution')).toBe(true);
      expect($scope.isDisabled('solution')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('solution_1', 'html');
      expect($scope.tabStatusColorStyle('solution')).toEqual({
        'border-top-color': '#D14836'
      });
      expect($scope.tabNeedUpdatesStatus('solution')).toBe(false);
      expect($scope.contentIdNeedUpdates('solution')).toBe(false);
      expect($scope.contentIdStatusColorStyle('solution_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate rule inputs tab when clicking on tab', function() {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('rule_input');

      expect($scope.isActive('rule_input')).toBe(true);
      expect($scope.isDisabled('rule_input')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('rule_input_4', 'set_of_normalized_string');
    });

    it('should change active rule content index', function() {
      $scope.onTabClick('rule_input');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveRuleContentIndex(1);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('rule_input_5', 'set_of_normalized_string');
    });

    it('should not change active rule content index if it is equal to the ' +
       'current one', function() {
      $scope.onTabClick('rule_input');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveRuleContentIndex(0);

      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should change active hint index', function() {
      $scope.onTabClick('hint');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveHintIndex(1);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('hint_2', 'html');
    });

    it('should not change active hint index if it is equal to the current one',
      function() {
        $scope.onTabClick('hint');

        spyOn(translationTabActiveContentIdService, 'setActiveContent');
        $scope.changeActiveHintIndex(0);

        expect(translationTabActiveContentIdService.setActiveContent).not
          .toHaveBeenCalled();
      });

    it('should change active answer group index', function() {
      $scope.onTabClick('feedback');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveAnswerGroupIndex(1);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('feedback_2', 'html');
    });

    it('should not change active customization argument index if it is equal' +
      ' to the current one',
    function() {
      $scope.onTabClick('ca');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveCustomizationArgContentIndex(0);

      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should change active answer group index to default outcome when' +
      ' index provided is equal to answer groups length', function() {
      $scope.onTabClick('feedback');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveAnswerGroupIndex(2);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('default_outcome', 'html');
    });

    it('should not change active hint index if it is equal to the current one',
      function() {
        $scope.onTabClick('feedback');

        spyOn(translationTabActiveContentIdService, 'setActiveContent');
        $scope.changeActiveAnswerGroupIndex(0);

        expect(translationTabActiveContentIdService.setActiveContent).not
          .toHaveBeenCalled();
      });

    it('should get subtitled html data translation', function() {
      var subtitledObject = SubtitledHtml.createFromBackendDict({
        content_id: 'content_1',
        html: 'This is the html'
      });
      expect($scope.getRequiredHtml(subtitledObject)).toBe('Translation');
      expect($scope.getSubtitledContentSummary(subtitledObject)).toBe(
        'This is the html');
    });

    it('should get empty content message when text translations haven\'t' +
      ' been added yet', function() {
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
          [],
          outcomeObjectFactory.createNew('unused', '1', 'Feedback text', []),
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
      spyOnProperty(stateEditorService, 'onShowTranslationTabBusyModal').and
        .returnValue(showTranslationTabBusyModalEmitter);
      explorationStatesService.init(explorationState1);
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
          recordedVoiceovers));

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
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('content');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect($scope.isVoiceoverModeActive()).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on interaction' +
      'customization arguments tab', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('ca');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on feedback' +
      ' tab', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('feedback');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on hint' +
      ' tab', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('hint');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on solution' +
      ' tab', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('solution');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
      ' active rule content index', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveRuleContentIndex(1);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
      ' active hint index', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveHintIndex(1);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
      ' active answer group index', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveAnswerGroupIndex(1);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
      ' interaction customization argument index', function() {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.changeActiveCustomizationArgContentIndex(0);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should get subtitled data', function() {
      var subtitledObject = SubtitledHtml.createFromBackendDict({
        content_id: 'content_1',
        html: 'This is the html'
      });
      expect($scope.getRequiredHtml(subtitledObject)).toBe('This is the html');
      expect($scope.getSubtitledContentSummary(subtitledObject)).toBe(
        'This is the html');

      subtitledObject = subtitledUnicodeObjectFactory.createFromBackendDict(
        {
          content_id: 'content_1',
          unicode_str: 'This is the unicode'
        });
      expect($scope.getSubtitledContentSummary(subtitledObject)).toBe(
        'This is the unicode');
    });

    it('should get content message warning that there is not text available' +
      ' to translate', function() {
      expect($scope.getEmptyContentMessage()).toBe(
        'There is no text available to translate.');
    });
  });

  describe('when rules input tab is accessed but with no rules', function() {
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
      explorationStatesService.init({
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
                  content_id: 'ca_placeholder',
                  unicode_str: ''
                }
              },
              rows: {
                value: 1
              }
            },
            // This simulates the case where there are no rule specs.
            answer_groups: [{
              rule_specs: [],
              outcome: {
                dest: 'unused',
                dest_if_really_stuck: null,
                feedback: {
                  content_id: 'feedback_1',
                  html: ''
                },
                labelled_as_correct: false,
                param_changes: [],
                refresher_exploration_id: null
              },
            }],
            default_outcome: {
              dest: 'default',
              dest_if_really_stuck: null,
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
          linked_skill_id: null,
          next_content_id_index: 0,
          param_changes: [],
          solicit_answer_details: false,
          recorded_voiceovers: {
            voiceovers_mapping: {}
          }
        }
      });
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
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

    it('should throw an error when there are no rules', function() {
      expect(() => {
        $scope.onTabClick('rule_input');
      }).toThrowError(
        'Accessed rule input translation tab when there are no rules');
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
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
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
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      $scope.onTabClick('feedback');

      expect($scope.isActive('feedback')).toBe(true);
      expect($scope.isDisabled('feedback')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('default_outcome', 'html');
    });
  });

  describe('when state\'s property is_linear is true', function() {
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
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
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

    it('should evaluate content tab as enabled', function() {
      expect($scope.isDisabled('content')).toBe(false);
    });

    it('should evaluate feedback tab as disabled', function() {
      expect($scope.isDisabled('feedback')).toBe(true);
    });

    it('should evaluate hint tab as disabled', function() {
      expect($scope.isDisabled('hint')).toBe(true);
    });

    it('should evaluate solution tab as disabled', function() {
      expect($scope.isDisabled('solution')).toBe(true);
    });
  });

  describe('when state has a multiple choice interaction with no hints, ' +
           'solution or outcome', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      routerService = $injector.get('RouterService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');
      explorationHtmlFormatterService = $injector.get(
        'ExplorationHtmlFormatterService');

      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'Introduction');

      // Because the customization arguments we are passing for testing are
      // invalid, we will skip getInteractionHtml(), which would error
      // otherwise.
      spyOn(
        explorationHtmlFormatterService, 'getInteractionHtml'
      ).and.returnValue('');
      // These customization arguments are invalid. However, it is required to
      // test an edge case that could occur in the future (customization
      // argument value being a dictionary).
      spyOn(
        explorationStatesService, 'getInteractionCustomizationArgsMemento'
      ).and.returnValue({
        testCa: {
          value: {
            unicode: subtitledUnicodeObjectFactory.createDefault('', 'ca_0'),
            html: [SubtitledHtml.createDefault('', 'ca_1')]
          }
        }
      });
      explorationStatesService.init(explorationState4);
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
          {
            voiceovers_mapping: {
              content: {},
              default_outcome: {},
              content_1: {},
              feedback_1: {},
              hint_1: {},
              solution: {},
              solution_1: {},
              ca_0: {},
              ca_1: {}
            }
          }));

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

    it('should evaluate feedback tab as disabled', function() {
      expect($scope.isDisabled('feedback')).toBe(true);
    });

    it('should evaluate hint tab as disabled', function() {
      expect($scope.isDisabled('hint')).toBe(true);
    });

    it('should evaluate solution tab as disabled', function() {
      expect($scope.isDisabled('solution')).toBe(true);
    });

    it('should change active customization argument index', function() {
      $scope.onTabClick('ca');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');

      $scope.changeActiveCustomizationArgContentIndex(1);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('ca_1', 'html');

      $scope.changeActiveCustomizationArgContentIndex(0);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('ca_0', 'unicode');
    });
  });

  describe('getHumanReadableRuleInputValues', function() {
    beforeEach(angular.mock.inject(function($injector, $componentController) {
      var $filter = $injector.get('$filter');
      $rootScope = $injector.get('$rootScope');
      explorationStatesService = $injector.get('ExplorationStatesService');
      routerService = $injector.get('RouterService');
      entityTranslationsService = $injector.get('EntityTranslationsService');
      translationLanguageService = $injector.get('TranslationLanguageService');
      contextService = $injector.get('ContextService');
      translationTabActiveContentIdService = $injector.get(
        'TranslationTabActiveContentIdService');
      translationTabActiveModeService = $injector.get(
        'TranslationTabActiveModeService');

      contextService.explorationId = 'expId';
      entityTranslationsService.entityTranslation = {
        getWrittenTranslation: () => {}
      };
      explorationStatesService.init(explorationState2);
      stateRecordedVoiceoversService.init(
        'Introduction', RecordedVoiceovers.createFromBackendDict(
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

    it('should cover all translatable objects', function() {
      Object.keys(DEFAULT_OBJECT_VALUES).forEach(objName => {
        if (objName.indexOf('Translatable') !== 0 ||
            objName.indexOf('ContentId') !== -1) {
          return;
        }
        expect(() => {
          $scope.getHumanReadableRuleInputValues(
            DEFAULT_OBJECT_VALUES[objName],
            objName);
        }).not.toThrowError();
      });
    });

    it('should format TranslatableSetOfNormalizedString values', function() {
      expect($scope.getHumanReadableRuleInputValues(
        {normalizedStrSet: ['input1', 'input2']},
        'TranslatableSetOfNormalizedString'
      )).toEqual('[input1, input2]');
    });

    it('should format TranslatableSetOfUnicodeString values', function() {
      expect($scope.getHumanReadableRuleInputValues(
        {unicodeStrSet: ['input1', 'input2']},
        'TranslatableSetOfUnicodeString'
      )).toEqual('[input1, input2]');
    });

    it('should throw an error on invalid type', function() {
      expect(() => {
        $scope.getHumanReadableRuleInputValues(
          ['input1', 'input2'],
          'InvalidType');
      }).toThrowError('The InvalidType type is not implemented.');
    });
  });
});
