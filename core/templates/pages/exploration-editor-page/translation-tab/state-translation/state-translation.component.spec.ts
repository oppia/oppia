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


import { HttpClientTestingModule } from '@angular/common/http/testing';
import { EventEmitter, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { ComponentFixture, waitForAsync, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CkEditorCopyContentService } from 'components/ck-editor-helpers/ck-editor-copy-content.service';
import { StateCustomizationArgsService } from 'components/state-editor/state-editor-properties-services/state-customization-args.service';
import { AnswerChoice, StateEditorService } from 'components/state-editor/state-editor-properties-services/state-editor.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { StateRecordedVoiceoversService } from 'components/state-editor/state-editor-properties-services/state-recorded-voiceovers.service';
import { StateSolutionService } from 'components/state-editor/state-editor-properties-services/state-solution.service';
import { StateWrittenTranslationsService } from 'components/state-editor/state-editor-properties-services/state-written-translations.service';
import { AnswerGroupObjectFactory } from 'domain/exploration/AnswerGroupObjectFactory';
import { OutcomeObjectFactory } from 'domain/exploration/OutcomeObjectFactory';
import { ReadOnlyExplorationBackendApiService } from 'domain/exploration/read-only-exploration-backend-api.service';
import { RecordedVoiceovers } from 'domain/exploration/recorded-voiceovers.model';
import { Rule } from 'domain/exploration/RuleObjectFactory';
import { StateObjectsBackendDict } from 'domain/exploration/StatesObjectFactory';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicodeObjectFactory } from 'domain/exploration/SubtitledUnicodeObjectFactory';
import { NumberWithUnitsObjectFactory } from 'domain/objects/NumberWithUnitsObjectFactory';
import { ParameterizeRuleDescriptionPipe } from 'filters/parameterize-rule-description.pipe';
import { ConvertToPlainTextPipe } from 'filters/string-utility-filters/convert-to-plain-text.pipe';
import { WrapTextWithEllipsisPipe } from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import { ContinueRulesService } from 'interactions/Continue/directives/continue-rules.service';
import { ContinueValidationService } from 'interactions/Continue/directives/continue-validation.service';
import { TextInputRulesService } from 'interactions/TextInput/directives/text-input-rules.service';
import { AngularNameService } from 'pages/exploration-editor-page/services/angular-name.service';
import { ExplorationStatesService } from 'pages/exploration-editor-page/services/exploration-states.service';
import { RouterService } from 'pages/exploration-editor-page/services/router.service';
import { StateEditorRefreshService } from 'pages/exploration-editor-page/services/state-editor-refresh.service';
import { ContextService } from 'services/context.service';
import { ExplorationHtmlFormatterService } from 'services/exploration-html-formatter.service';
import { ExplorationImprovementsTaskRegistryService } from 'services/exploration-improvements-task-registry.service';
import { ExternalSaveService } from 'services/external-save.service';
import { TranslationLanguageService } from '../services/translation-language.service';
import { TranslationTabActiveContentIdService } from '../services/translation-tab-active-content-id.service';
import { TranslationTabActiveModeService } from '../services/translation-tab-active-mode.service';
import { StateTranslationComponent } from './state-translation.component';

const DEFAULT_OBJECT_VALUES = require('objects/object_defaults.json');

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve()
    };
  }
}

@Pipe({ name: 'parameterizeRuleDescriptionPipe' })
class MockParameterizeRuleDescriptionPipe {
  transform(
      rule: Rule | null, interactionId: string | null,
      choices: AnswerChoice[] | null): string {
    return '';
  }
}
@Pipe({ name: 'wrapTextWithEllipsis' })
class MockWrapTextWithEllipsisPipe {
  transform(input: string, characterCount: number): string {
    return '';
  }
}

@Pipe({ name: 'truncate' })
class MockTruncatePipe {
  transform(value: string, params: number): string {
    return value;
  }
}

@Pipe({ name: 'convertToPlainText' })
class MockConvertToPlainTextPipe {
  transform(value: string): string {
    return value;
  }
}

describe('State translation component', () => {
  let component: StateTranslationComponent;
  let fixture: ComponentFixture<StateTranslationComponent>;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let explorationStatesService: ExplorationStatesService;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let routerService: RouterService;
  let stateEditorService: StateEditorService;
  let stateRecordedVoiceoversService: StateRecordedVoiceoversService;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService:
    TranslationTabActiveContentIdService;
  let translationTabActiveModeService: TranslationTabActiveModeService;

  let explorationState1 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      classifier_model_id: 'null',
      card_is_checkpoint: false,
      interaction: {
        id: 'TextInput',
        confirmed_unclassified_answers: null,
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
          training_data: null,
          tagged_skill_misconception_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
          labelled_as_correct: null,
          param_changes: null,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
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
  } as StateObjectsBackendDict;

  let recordedVoiceovers = {
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

  let refreshStateTranslationEmitter = new EventEmitter();

  class MockContextService {
    getExplorationId() {
      return 'expId';
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateTranslationComponent,
        MockParameterizeRuleDescriptionPipe,
        MockTruncatePipe,
        MockConvertToPlainTextPipe,
        MockWrapTextWithEllipsisPipe
      ],
      providers: [
        WrapTextWithEllipsisPipe,
        ConvertToPlainTextPipe,
        AngularNameService,
        { provide: ContextService, useClass: MockContextService },
        ContinueValidationService,
        ContinueRulesService,
        ExplorationImprovementsTaskRegistryService,
        ExplorationStatesService,
        ExternalSaveService,
        NumberWithUnitsObjectFactory,
        TextInputRulesService,
        OutcomeObjectFactory,
        StateCustomizationArgsService,
        StateInteractionIdService,
        StateEditorRefreshService,
        StateRecordedVoiceoversService,
        StateSolutionService,
        StateWrittenTranslationsService,
        ReadOnlyExplorationBackendApiService,
        RouterService,
        StateEditorService,
        TranslationLanguageService,
        TranslationTabActiveContentIdService,
        TranslationTabActiveModeService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ParameterizeRuleDescriptionPipe,
          useClass: MockParameterizeRuleDescriptionPipe
        },
        {
          provide: WrapTextWithEllipsisPipe,
          useClass: MockWrapTextWithEllipsisPipe
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationComponent);
    component = fixture.componentInstance;

    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    stateEditorService = TestBed.inject(StateEditorService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    stateRecordedVoiceoversService = TestBed.inject(
      StateRecordedVoiceoversService);
    routerService = TestBed.inject(RouterService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService);
    translationTabActiveModeService = TestBed.inject(
      TranslationTabActiveModeService);
    explorationStatesService.init(explorationState1);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));

    spyOnProperty(stateEditorService, 'onRefreshStateTranslation').and
      .returnValue(refreshStateTranslationEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    ckEditorCopyContentService.copyModeActive = true;
    spyOn(translationLanguageService, 'getActiveLanguageCode').and
      .returnValue('en');
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(true);

    explorationStatesService.init(explorationState1);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));

    component.isTranslationTabBusy = false;
    component.stateName = 'Introduction';

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('when translation tab is not busy and voiceover mode is' +
    ' active', () => {
    it('should init state translation when refreshing page', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      refreshStateTranslationEmitter.emit();

      expect(component.isActive('content')).toBe(true);
      expect(component.isVoiceoverModeActive()).toBe(true);
      expect(component.isDisabled('content')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('content_1', 'html');
    });

    it('should navigate to a given state', () => {
      spyOn(routerService, 'navigateToMainTab');
      component.navigateToState('Introduction');

      expect(routerService.navigateToMainTab).toHaveBeenCalledWith(
        'Introduction');
    });

    it('should get customization argument translatable customization' +
  ' arguments', () => {
      let content = SubtitledHtml.createDefault('', '');
      let translatableCa = (
        component.getInteractionCustomizationArgTranslatableContents({
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
      () => {
        spyOn(ckEditorCopyContentService, 'broadcastCopy').and
          .callFake(() => {});

        let mockEvent = {
          stopPropagation: () => {},
          target: {}
        } as Event;
        component.onContentClick(mockEvent);

        expect(ckEditorCopyContentService.broadcastCopy).toHaveBeenCalledWith(
          mockEvent.target);
      });

    it('should activate content tab when clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('content');

      expect(component.isActive('content')).toBe(true);
      expect(component.isDisabled('content')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('content_1', 'html');
      expect(component.tabStatusColorStyle('content')).toEqual({
        'border-top-color': '#D14836'
      });
      expect(component.tabNeedUpdatesStatus('content')).toBe(false);
      expect(component.contentIdNeedUpdates('content_1')).toBe(false);
      expect(component.contentIdStatusColorStyle('content_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate interaction custimization arguments tab when ' +
   'clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('ca');

      expect(component.isActive('ca')).toBe(true);
      expect(component.isDisabled('ca')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('ca_placeholder', 'unicode');
      expect(component.tabStatusColorStyle('ca')).toEqual({
        'border-top-color': '#D14836'
      });
      expect(component.tabNeedUpdatesStatus('ca')).toBe(false);
      expect(component.contentIdNeedUpdates('ca_placeholder')).toBe(false);
      expect(component.contentIdStatusColorStyle('ca_placeholder')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate feedback tab when clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('feedback');

      expect(component.isActive('feedback')).toBe(true);
      expect(component.isDisabled('feedback')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('feedback_1', 'html');
      expect(component.tabStatusColorStyle('feedback')).toEqual({
        'border-top-color': '#D14836'
      });
      expect(component.tabNeedUpdatesStatus('feedback')).toBe(false);
      expect(component.contentIdNeedUpdates('feedback_1')).toBe(false);
      expect(component.contentIdStatusColorStyle('feedback_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate hint tab when clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('hint');

      expect(component.isActive('hint')).toBe(true);
      expect(component.isDisabled('hint')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('hint_1', 'html');
      expect(component.tabStatusColorStyle('hint')).toEqual({
        'border-top-color': '#D14836'
      });
      expect(component.tabNeedUpdatesStatus('hint')).toBe(false);
      expect(component.contentIdNeedUpdates('hint_1')).toBe(false);
      expect(component.contentIdStatusColorStyle('hint_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate solution tab when clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('solution');

      expect(component.isActive('solution')).toBe(true);
      expect(component.isDisabled('solution')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('solution_1', 'html');
      expect(component.tabStatusColorStyle('solution')).toEqual({
        'border-top-color': '#D14836'
      });
      expect(component.tabNeedUpdatesStatus('solution')).toBe(false);
      expect(component.contentIdNeedUpdates('solution')).toBe(false);
      expect(component.contentIdStatusColorStyle('solution_1')).toEqual({
        'border-left': '3px solid #D14836'
      });
    });

    it('should activate rule inputs tab when clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('rule_input');

      expect(component.isActive('rule_input')).toBe(true);
      expect(component.isDisabled('rule_input')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('rule_input_4', 'set_of_normalized_string');
    });

    it('should change active rule content index', () => {
      component.onTabClick('rule_input');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveRuleContentIndex(1);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('rule_input_5', 'set_of_normalized_string');
    });

    it('should not change active rule content index if it is equal to the ' +
   'current one', () => {
      component.onTabClick('rule_input');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveRuleContentIndex(0);

      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should change active hint index', () => {
      component.onTabClick('hint');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveHintIndex(1);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('hint_2', 'html');
    });

    it('should not change active hint index if it is equal to the current one',
      () => {
        component.onTabClick('hint');

        spyOn(translationTabActiveContentIdService, 'setActiveContent');
        component.changeActiveHintIndex(0);

        expect(translationTabActiveContentIdService.setActiveContent).not
          .toHaveBeenCalled();
      });

    it('should change active answer group index', () => {
      component.onTabClick('feedback');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveAnswerGroupIndex(1);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('feedback_2', 'html');
    });

    it('should not change active customization argument index if it is equal' +
  ' to the current one',
    () => {
      component.onTabClick('ca');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveCustomizationArgContentIndex(0);

      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should change active answer group index to default outcome when' +
  ' index provided is equal to answer groups length', () => {
      component.onTabClick('feedback');

      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveAnswerGroupIndex(2);

      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('default_outcome', 'html');
    });

    it('should not change active hint index if it is equal to the current one',
      () => {
        component.onTabClick('feedback');

        spyOn(translationTabActiveContentIdService, 'setActiveContent');
        component.changeActiveAnswerGroupIndex(0);

        expect(translationTabActiveContentIdService.setActiveContent).not
          .toHaveBeenCalled();
      });

    it('should get subtitled html data translation', () => {
      let subtitledObject = SubtitledHtml.createFromBackendDict({
        content_id: 'content_1',
        html: 'This is the html'
      });
      expect(component.getRequiredHtml(subtitledObject)).toBe('Translation');
      expect(component.getSubtitledContentSummary(subtitledObject)).toBe(
        'This is the html');
    });

    it('should get empty content message when text translations haven\'t' +
  ' been added yet', () => {
      expect(component.getEmptyContentMessage()).toBe(
        'The translation for this section has not been created yet.' +
    ' Switch to translation mode to add a text translation.');
    });

    it('should get summary default outcome when outcome is linear',
      () => {
        expect(component.summarizeDefaultOutcome(
          outcomeObjectFactory.createNew(
            'unused', '1', 'Feedback Text', []), 'Continue', 0, 'true'))
          .toBe('[] Feedback Text');
      });

    it('should get summary default outcome when answer group count' +
  ' is greater than 0', () => {
      expect(component.summarizeDefaultOutcome(
        outcomeObjectFactory.createNew(
          'unused', '1', 'Feedback Text', []), 'TextInput', 1, 'true'))
        .toBe('[] Feedback Text');
    });

    it('should get summary default outcome when answer group count' +
  ' is equal to 0', () => {
      expect(component.summarizeDefaultOutcome(
        outcomeObjectFactory.createNew(
          'unused', '1', 'Feedback Text', []), 'TextInput', 0, 'true'))
        .toBe('[] Feedback Text');
    });

    it('should get an empty summary when default outcome is a falsy value',
      () => {
        expect(component.summarizeDefaultOutcome(null, 'Continue', 0, 'true'))
          .toBe('');
      });

    it('should get summary answer group', () => {
      expect(component.summarizeAnswerGroup(
        answerGroupObjectFactory.createNew(
          [],
          outcomeObjectFactory.createNew('unused', '1', 'Feedback text', []),
          null, '0'), '1', null, true))
        .toBe('[] Feedback text');
    });
  });
});

describe('State translation component', () => {
  let component: StateTranslationComponent;
  let fixture: ComponentFixture<StateTranslationComponent>;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let explorationStatesService: ExplorationStatesService;
  let stateEditorService: StateEditorService;
  let stateRecordedVoiceoversService: StateRecordedVoiceoversService;
  let subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService:
    TranslationTabActiveContentIdService;
  let translationTabActiveModeService: TranslationTabActiveModeService;

  let explorationState1 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      classifier_model_id: 'null',
      card_is_checkpoint: false,
      interaction: {
        id: 'TextInput',
        confirmed_unclassified_answers: null,
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
          training_data: null,
          tagged_skill_misconception_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
          labelled_as_correct: null,
          param_changes: null,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
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
  } as StateObjectsBackendDict;

  let recordedVoiceovers = {
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

  let refreshStateTranslationEmitter = new EventEmitter();
  let showTranslationTabBusyModalEmitter = new EventEmitter();

  class MockContextService {
    getExplorationId() {
      return 'expId';
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateTranslationComponent,
        MockParameterizeRuleDescriptionPipe,
        MockTruncatePipe,
        MockConvertToPlainTextPipe,
        MockWrapTextWithEllipsisPipe
      ],
      providers: [
        WrapTextWithEllipsisPipe,
        ConvertToPlainTextPipe,
        AngularNameService,
        { provide: ContextService, useClass: MockContextService },
        ContinueValidationService,
        ContinueRulesService,
        ExplorationImprovementsTaskRegistryService,
        ExplorationStatesService,
        ExternalSaveService,
        NumberWithUnitsObjectFactory,
        TextInputRulesService,
        OutcomeObjectFactory,
        StateCustomizationArgsService,
        StateInteractionIdService,
        StateEditorRefreshService,
        StateRecordedVoiceoversService,
        StateSolutionService,
        StateWrittenTranslationsService,
        ReadOnlyExplorationBackendApiService,
        RouterService,
        StateEditorService,
        TranslationLanguageService,
        TranslationTabActiveContentIdService,
        TranslationTabActiveModeService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ParameterizeRuleDescriptionPipe,
          useClass: MockParameterizeRuleDescriptionPipe
        },
        {
          provide: WrapTextWithEllipsisPipe,
          useClass: MockWrapTextWithEllipsisPipe
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationComponent);
    component = fixture.componentInstance;

    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    stateEditorService = TestBed.inject(StateEditorService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    stateRecordedVoiceoversService = TestBed.inject(
      StateRecordedVoiceoversService);
    subtitledUnicodeObjectFactory = TestBed.inject(
      SubtitledUnicodeObjectFactory);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService);
    translationTabActiveModeService = TestBed.inject(
      TranslationTabActiveModeService);
    explorationStatesService.init(explorationState1);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));

    spyOnProperty(stateEditorService, 'onRefreshStateTranslation').and
      .returnValue(refreshStateTranslationEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    ckEditorCopyContentService.copyModeActive = true;
    spyOn(translationLanguageService, 'getActiveLanguageCode').and
      .returnValue('en');
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(false);

    explorationStatesService.init(explorationState1);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));
    spyOnProperty(stateEditorService, 'onShowTranslationTabBusyModal').and
      .returnValue(showTranslationTabBusyModalEmitter);
    component.isTranslationTabBusy = true;
    component.stateName = 'Introduction';

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('when translation tab is busy and voiceover mode is not' +
    ' activate', () => {
    it('should open translation tab busy modal when clicking on content' +
    ' tab', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('content');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(component.isVoiceoverModeActive()).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on interaction' +
    'customization arguments tab', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('ca');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on feedback' +
    ' tab', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('feedback');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on hint' +
    ' tab', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('hint');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when clicking on solution' +
    ' tab', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('solution');

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
    ' active rule content index', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveRuleContentIndex(1);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
    ' active hint index', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveHintIndex(1);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
    ' active answer group index', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveAnswerGroupIndex(1);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should open translation tab busy modal when trying to change' +
    ' interaction customization argument index', () => {
      spyOn(showTranslationTabBusyModalEmitter, 'emit');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.changeActiveCustomizationArgContentIndex(0);

      expect(showTranslationTabBusyModalEmitter.emit).toHaveBeenCalled();
      expect(translationTabActiveContentIdService.setActiveContent).not
        .toHaveBeenCalled();
    });

    it('should get subtitled data', () => {
      let subtitledObject = SubtitledHtml.createFromBackendDict({
        content_id: 'content_1',
        html: 'This is the html'
      });
      expect(component.getRequiredHtml(subtitledObject))
        .toBe('This is the html');
      expect(component.getSubtitledContentSummary(subtitledObject)).toBe(
        'This is the html');

      let subtitledObjectBack = subtitledUnicodeObjectFactory
        .createFromBackendDict({
          content_id: 'content_1',
          unicode_str: 'This is the unicode'
        });
      expect(component.getSubtitledContentSummary(subtitledObjectBack)).toBe(
        'This is the unicode');
    });

    it('should get content message warning that there is not text available' +
    ' to translate', () => {
      expect(component.getEmptyContentMessage()).toBe(
        'There is no text available to translate.');
    });
  });
});

describe('State translation component', () => {
  let component: StateTranslationComponent;
  let fixture: ComponentFixture<StateTranslationComponent>;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let explorationStatesService: ExplorationStatesService;
  let stateEditorService: StateEditorService;
  let stateRecordedVoiceoversService: StateRecordedVoiceoversService;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService:
    TranslationTabActiveContentIdService;
  let translationTabActiveModeService: TranslationTabActiveModeService;

  let explorationState1 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      classifier_model_id: 'null',
      card_is_checkpoint: false,
      interaction: {
        id: 'TextInput',
        confirmed_unclassified_answers: null,
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
          training_data: null,
          tagged_skill_misconception_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
          labelled_as_correct: null,
          param_changes: null,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
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
  } as StateObjectsBackendDict;

  let explorationState2 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      classifier_model_id: 'null',
      card_is_checkpoint: false,
      interaction: {
        confirmed_unclassified_answers: null,
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
          labelled_as_correct: null,
          param_changes: null,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
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
          }
        }
      }
    }
  } as StateObjectsBackendDict;

  let recordedVoiceovers = {
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

  let refreshStateTranslationEmitter = new EventEmitter();

  class MockContextService {
    getExplorationId() {
      return 'expId';
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateTranslationComponent,
        MockParameterizeRuleDescriptionPipe,
        MockTruncatePipe,
        MockConvertToPlainTextPipe,
        MockWrapTextWithEllipsisPipe
      ],
      providers: [
        WrapTextWithEllipsisPipe,
        ConvertToPlainTextPipe,
        AngularNameService,
        { provide: ContextService, useClass: MockContextService },
        ContinueValidationService,
        ContinueRulesService,
        ExplorationImprovementsTaskRegistryService,
        ExplorationStatesService,
        ExternalSaveService,
        NumberWithUnitsObjectFactory,
        TextInputRulesService,
        OutcomeObjectFactory,
        StateCustomizationArgsService,
        StateInteractionIdService,
        StateEditorRefreshService,
        StateRecordedVoiceoversService,
        StateSolutionService,
        StateWrittenTranslationsService,
        ReadOnlyExplorationBackendApiService,
        RouterService,
        StateEditorService,
        TranslationLanguageService,
        TranslationTabActiveContentIdService,
        TranslationTabActiveModeService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ParameterizeRuleDescriptionPipe,
          useClass: MockParameterizeRuleDescriptionPipe
        },
        {
          provide: WrapTextWithEllipsisPipe,
          useClass: MockWrapTextWithEllipsisPipe
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationComponent);
    component = fixture.componentInstance;

    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    stateEditorService = TestBed.inject(StateEditorService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    stateRecordedVoiceoversService = TestBed.inject(
      StateRecordedVoiceoversService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService);
    translationTabActiveModeService = TestBed.inject(
      TranslationTabActiveModeService);
    explorationStatesService.init(explorationState1);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));

    spyOnProperty(stateEditorService, 'onRefreshStateTranslation').and
      .returnValue(refreshStateTranslationEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    ckEditorCopyContentService.copyModeActive = true;
    spyOn(translationLanguageService, 'getActiveLanguageCode').and
      .returnValue('en');
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(true);

    explorationStatesService.init(explorationState2);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));

    component.isTranslationTabBusy = false;
    component.stateName = 'Introduction';

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should cover all translatable objects', () => {
    Object.keys(DEFAULT_OBJECT_VALUES).forEach(objName => {
      if (objName.indexOf('Translatable') !== 0 ||
        objName.indexOf('ContentId') !== -1) {
        return;
      }
      expect(() => {
        component.getHumanReadableRuleInputValues(
          DEFAULT_OBJECT_VALUES[objName],
          objName);
      }).not.toThrowError();
    });
  });

  it('should format TranslatableSetOfNormalizedString values', () => {
    expect(component.getHumanReadableRuleInputValues(
      {normalizedStrSet: ['input1', 'input2'], unicodeStrSet: null},
      'TranslatableSetOfNormalizedString'
    )).toEqual('[input1, input2]');
  });

  it('should format TranslatableSetOfUnicodeString values', () => {
    expect(component.getHumanReadableRuleInputValues(
      {normalizedStrSet: null, unicodeStrSet: ['input1', 'input2']},
      'TranslatableSetOfUnicodeString'
    )).toEqual('[input1, input2]');
  });

  it('should throw an error on invalid type', () => {
    expect(() => {
      component.getHumanReadableRuleInputValues(
        null,
        'InvalidType');
    }).toThrowError('The InvalidType type is not implemented.');
  });

  describe('when rules input tab is accessed but with no rules', () => {
    it('should throw an error when there are no rules', () => {
      spyOn(component, 'isDisabled').and.returnValue(false);
      component.TAB_ID_CONTENT = 'something';
      component.interactionRuleTranslatableContents = [];
      expect(() => {
        component.onTabClick('rule_input');
      }).toThrowError(
        'Accessed rule input translation tab when there are no rules');
    });

    it('should throw an error when there are no rules', () => {
      component.interactionRuleTranslatableContents = [];
      expect(() => {
        component.onTabClick('rule_input');
      }).not.toThrowError(
        'Accessed rule input translation tab when there are no rules');
    });
  });

  describe('when state has default outcome and no answer groups', () => {
    it('should activate feedback tab with default outcome when' +
      ' clicking on tab', () => {
      spyOn(translationTabActiveContentIdService, 'setActiveContent');
      component.onTabClick('feedback');

      expect(component.isActive('feedback')).toBe(true);
      expect(component.isDisabled('feedback')).toBe(false);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('default_outcome', 'html');
    });
  });
});

describe('State translation component', () => {
  let component: StateTranslationComponent;
  let fixture: ComponentFixture<StateTranslationComponent>;
  let ckEditorCopyContentService: CkEditorCopyContentService;
  let explorationStatesService: ExplorationStatesService;
  let stateEditorService: StateEditorService;
  let stateRecordedVoiceoversService: StateRecordedVoiceoversService;
  let translationLanguageService: TranslationLanguageService;
  let translationTabActiveContentIdService:
    TranslationTabActiveContentIdService;
  let translationTabActiveModeService: TranslationTabActiveModeService;
  let subtitledUnicodeObjectFactory: SubtitledUnicodeObjectFactory;
  let explorationHtmlFormatterService: ExplorationHtmlFormatterService;
  let explorationState1 = {
    Introduction: {
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      classifier_model_id: 'null',
      card_is_checkpoint: false,
      interaction: {
        id: 'TextInput',
        confirmed_unclassified_answers: null,
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
          training_data: null,
          tagged_skill_misconception_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
            labelled_as_correct: null,
            param_changes: null,
            refresher_exploration_id: null,
            missing_prerequisite_skill_id: null,
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
          labelled_as_correct: null,
          param_changes: null,
          refresher_exploration_id: null,
          missing_prerequisite_skill_id: null,
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
  } as StateObjectsBackendDict;

  let explorationState4 = {
    Introduction: {
      classifier_model_id: null,
      card_is_checkpoint: null,
      content: {
        content_id: 'content_1',
        html: 'Introduction Content'
      },
      interaction: {
        default_outcome: null,
        confirmed_unclassified_answers: null,
        solution: null,
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
  } as StateObjectsBackendDict;

  let recordedVoiceovers = {
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

  let refreshStateTranslationEmitter = new EventEmitter();

  class MockContextService {
    getExplorationId() {
      return 'expId';
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateTranslationComponent,
        MockParameterizeRuleDescriptionPipe,
        MockTruncatePipe,
        MockConvertToPlainTextPipe,
        MockWrapTextWithEllipsisPipe
      ],
      providers: [
        WrapTextWithEllipsisPipe,
        ExplorationHtmlFormatterService,
        ConvertToPlainTextPipe,
        AngularNameService,
        { provide: ContextService, useClass: MockContextService },
        ContinueValidationService,
        ContinueRulesService,
        ExplorationImprovementsTaskRegistryService,
        ExplorationStatesService,
        ExternalSaveService,
        NumberWithUnitsObjectFactory,
        TextInputRulesService,
        OutcomeObjectFactory,
        StateCustomizationArgsService,
        StateInteractionIdService,
        StateEditorRefreshService,
        StateRecordedVoiceoversService,
        StateSolutionService,
        StateWrittenTranslationsService,
        ReadOnlyExplorationBackendApiService,
        RouterService,
        StateEditorService,
        TranslationLanguageService,
        TranslationTabActiveContentIdService,
        TranslationTabActiveModeService,
        {
          provide: NgbModal,
          useClass: MockNgbModal
        },
        {
          provide: ParameterizeRuleDescriptionPipe,
          useClass: MockParameterizeRuleDescriptionPipe
        },
        {
          provide: WrapTextWithEllipsisPipe,
          useClass: MockWrapTextWithEllipsisPipe
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateTranslationComponent);
    component = fixture.componentInstance;

    ckEditorCopyContentService = TestBed.inject(CkEditorCopyContentService);
    stateEditorService = TestBed.inject(StateEditorService);
    explorationStatesService = TestBed.inject(ExplorationStatesService);
    stateRecordedVoiceoversService = TestBed.inject(
      StateRecordedVoiceoversService);
    translationLanguageService = TestBed.inject(TranslationLanguageService);
    translationTabActiveContentIdService = TestBed.inject(
      TranslationTabActiveContentIdService);
    translationTabActiveModeService = TestBed.inject(
      TranslationTabActiveModeService);
    explorationStatesService.init(explorationState1);
    stateRecordedVoiceoversService.init(
      'Introduction', RecordedVoiceovers.createFromBackendDict(
        recordedVoiceovers));
    explorationHtmlFormatterService = TestBed.inject(
      ExplorationHtmlFormatterService);
    subtitledUnicodeObjectFactory = TestBed.inject(
      SubtitledUnicodeObjectFactory);
    spyOnProperty(stateEditorService, 'onRefreshStateTranslation').and
      .returnValue(refreshStateTranslationEmitter);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'Introduction');
    ckEditorCopyContentService.copyModeActive = true;
    spyOn(translationLanguageService, 'getActiveLanguageCode').and
      .returnValue('en');
    spyOn(translationTabActiveModeService, 'isVoiceoverModeActive').and
      .returnValue(true);

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
    component.isTranslationTabBusy = false;
    component.stateName = 'Introduction';

    component.ngOnInit();
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  describe('when state has a multiple choice interaction with no hints, ' +
       'solution or outcome', () => {
    it('should evaluate feedback tab as disabled', () => {
      expect(component.isDisabled('feedback')).toBe(true);
    });

    it('should evaluate hint tab as disabled', () => {
      expect(component.isDisabled('hint')).toBe(true);
    });

    it('should evaluate solution tab as disabled', () => {
      expect(component.isDisabled('solution')).toBe(true);
    });

    it('should change active customization argument index', () => {
      component.onTabClick('ca');
      spyOn(translationTabActiveContentIdService, 'setActiveContent');

      component.changeActiveCustomizationArgContentIndex(1);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('ca_1', 'html');

      component.changeActiveCustomizationArgContentIndex(0);
      expect(translationTabActiveContentIdService.setActiveContent)
        .toHaveBeenCalledWith('ca_0', 'unicode');
    });

    it('should isDisabled return true when stateinteractionId is null', () => {
      component.TAB_ID_CONTENT = 'some_id';
      component.stateInteractionId = null;

      expect(component.isDisabled('any')).toBeTrue();
    });
  });
});
