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
 * @fileoverview Unit tests for State Responses Component.
 */

import {EventEmitter, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  AnswerGroup,
  AnswerGroupObjectFactory,
} from 'domain/exploration/AnswerGroupObjectFactory';
import {
  Interaction,
  InteractionObjectFactory,
} from 'domain/exploration/InteractionObjectFactory';
import {
  Outcome,
  OutcomeObjectFactory,
} from 'domain/exploration/OutcomeObjectFactory';
import {Rule} from 'domain/exploration/rule.model';
import {MisconceptionObjectFactory} from 'domain/skill/MisconceptionObjectFactory';
import {NgbModal, NgbModalRef} from '@ng-bootstrap/ng-bootstrap';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {StateCustomizationArgsService} from '../state-editor-properties-services/state-customization-args.service';
import {
  AnswerChoice,
  StateEditorService,
} from '../state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from '../state-editor-properties-services/state-interaction-id.service';
import {AlertsService} from 'services/alerts.service';
import {ExternalSaveService} from 'services/external-save.service';
import {StateSolicitAnswerDetailsService} from '../state-editor-properties-services/state-solicit-answer-details.service';
import {StateResponsesComponent} from './state-responses.component';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ParameterizeRuleDescriptionPipe} from 'filters/parameterize-rule-description.pipe';
import {WrapTextWithEllipsisPipe} from 'filters/string-utility-filters/wrap-text-with-ellipsis.pipe';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {CdkDragSortEvent} from '@angular/cdk/drag-drop';
import {PlatformFeatureService} from 'services/platform-feature.service';

@Pipe({name: 'parameterizeRuleDescriptionPipe'})
class MockParameterizeRuleDescriptionPipe {
  transform(
    rule: Rule | null,
    interactionId: string | null,
    choices: AnswerChoice[] | null
  ): string {
    return '';
  }
}
@Pipe({name: 'wrapTextWithEllipsis'})
class MockWrapTextWithEllipsisPipe {
  transform(input: string, characterCount: number): string {
    return '';
  }
}

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: number): string {
    return value;
  }
}

@Pipe({name: 'convertToPlainText'})
class MockConvertToPlainTextPipe {
  transform(value: string): string {
    return value;
  }
}

class MockNgbModal {
  open() {
    return {
      result: Promise.resolve(),
    };
  }
}

class MockPlatformFeatureService {
  status = {
    ExplorationEditorCanTagMisconceptions: {
      isEnabled: true,
    },
  };
}

describe('State Responses Component', () => {
  let component: StateResponsesComponent;
  let fixture: ComponentFixture<StateResponsesComponent>;
  let windowDimensionsService: WindowDimensionsService;
  let stateEditorService: StateEditorService;
  let responsesService: ResponsesService;
  let stateInteractionIdService: StateInteractionIdService;
  let stateCustomizationArgsService: StateCustomizationArgsService;
  let interactionObjectFactory: InteractionObjectFactory;
  let interactionData: Interaction;
  let outcomeObjectFactory: OutcomeObjectFactory;
  let answerGroupObjectFactory: AnswerGroupObjectFactory;
  let misconceptionObjectFactory: MisconceptionObjectFactory;
  let externalSaveService: ExternalSaveService;
  let stateSolicitAnswerDetailsService: StateSolicitAnswerDetailsService;
  let alertsService: AlertsService;
  let ngbModal: NgbModal;
  let answerGroups: AnswerGroup[];
  let defaultOutcome: Outcome;
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  let defaultsOutcomesToSuppressWarnings = [
    {
      dest: 'State 4',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'feedback_1',
        html: '',
      },
      param_changes: [],
      refresher_exploration_id: null,
      labelled_as_correct: false,
      missing_prerequisite_skill_id: '',
    },
    {
      dest: 'State 5',
      dest_if_really_stuck: null,
      feedback: {
        content_id: 'feedback_2',
        html: "Let's go to state 5 ImageAndRegion",
      },
      param_changes: [],
      refresher_exploration_id: null,
      labelled_as_correct: false,
      missing_prerequisite_skill_id: '',
    },
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        StateResponsesComponent,
        MockParameterizeRuleDescriptionPipe,
        MockTruncatePipe,
        MockConvertToPlainTextPipe,
        MockWrapTextWithEllipsisPipe,
      ],
      providers: [
        WindowDimensionsService,
        StateEditorService,
        ResponsesService,
        StateInteractionIdService,
        StateCustomizationArgsService,
        ExternalSaveService,
        StateSolicitAnswerDetailsService,
        AlertsService,
        InteractionObjectFactory,
        OutcomeObjectFactory,
        AnswerGroupObjectFactory,
        MisconceptionObjectFactory,
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        {
          provide: ParameterizeRuleDescriptionPipe,
          useClass: MockParameterizeRuleDescriptionPipe,
        },
        {
          provide: WrapTextWithEllipsisPipe,
          useClass: MockWrapTextWithEllipsisPipe,
        },
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StateResponsesComponent);
    component = fixture.componentInstance;

    interactionObjectFactory = TestBed.inject(InteractionObjectFactory);
    outcomeObjectFactory = TestBed.inject(OutcomeObjectFactory);
    answerGroupObjectFactory = TestBed.inject(AnswerGroupObjectFactory);
    misconceptionObjectFactory = TestBed.inject(MisconceptionObjectFactory);
    ngbModal = TestBed.inject(NgbModal);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    stateEditorService = TestBed.inject(StateEditorService);
    responsesService = TestBed.inject(ResponsesService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    stateSolicitAnswerDetailsService = TestBed.inject(
      StateSolicitAnswerDetailsService
    );
    alertsService = TestBed.inject(AlertsService);
    stateCustomizationArgsService = TestBed.inject(
      StateCustomizationArgsService
    );
    externalSaveService = TestBed.inject(ExternalSaveService);

    interactionData = interactionObjectFactory.createFromBackendDict({
      id: 'TextInput',
      answer_groups: [
        {
          outcome: {
            dest: 'State',
            dest_if_really_stuck: null,
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
            labelled_as_correct: false,
            param_changes: [],
          },
          rule_specs: [
            {
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['abc'],
                },
              },
            },
          ],
          training_data: [],
          tagged_skill_misconception_id: 'misconception1',
        },
      ],
      default_outcome: {
        dest: 'Hola',
        dest_if_really_stuck: null,
        feedback: {
          content_id: '',
          html: '',
        },
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: 'test',
        missing_prerequisite_skill_id: 'test_skill_id',
      },
      confirmed_unclassified_answers: [],
      customization_args: {
        rows: {
          value: true,
        },
        placeholder: {
          value: 1,
        },
        catchMisspellings: {
          value: false,
        },
      },
      hints: [],
      solution: {
        answer_is_exclusive: true,
        correct_answer: 'test_answer',
        explanation: {
          content_id: '2',
          html: 'test_explanation1',
        },
      },
    });

    answerGroups = [
      answerGroupObjectFactory.createFromBackendDict(
        {
          rule_specs: [
            {
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['abc'],
                },
              },
            },
          ],
          outcome: {
            dest: 'State',
            dest_if_really_stuck: null,
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
          },
          training_data: [],
          tagged_skill_misconception_id: 'misconception1',
        },
        'TextInput'
      ),
    ];
    defaultOutcome = outcomeObjectFactory.createFromBackendDict({
      dest: 'Hola',
      dest_if_really_stuck: null,
      feedback: {
        content_id: '',
        html: '',
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: 'test',
      missing_prerequisite_skill_id: 'test_skill_id',
    });
  });

  it('should sort state responses properly', () => {
    component.answerGroups = answerGroups;
    spyOn(responsesService, 'save').and.callFake((value, values, callback) => {
      // This throws "Argument of type 'null' is not assignable to
      // parameter of type 'AnswerGroup[]'." We need to suppress this error
      // because of the need to test validations. This throws an error
      // because the value passed is null.
      // @ts-ignore
      callback(null, null);
    });
    spyOn(component.onSaveNextContentIdIndex, 'emit').and.stub();

    const event = {
      previousIndex: 1,
      currentIndex: 1,
    };
    component.drop(event as CdkDragSortEvent<AnswerGroup[]>);
    component.sendOnSaveNextContentIdIndex(0);
    expect(responsesService.save).toHaveBeenCalled();
    expect(component.onSaveNextContentIdIndex.emit).toHaveBeenCalledWith(0);
  });

  it('should set component properties on initialization', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(true);
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');
    spyOn(
      stateEditorService,
      'getInapplicableSkillMisconceptionIds'
    ).and.returnValue(['id1']);

    expect(component.responseCardIsShown).toBe(false);
    expect(component.enableSolicitAnswerDetailsFeature).toBe(false);
    expect(component.SHOW_TRAINABLE_UNRESOLVED_ANSWERS).toBe(false);
    expect(component.misconceptionsBySkill).toBeUndefined();
    expect(component.inapplicableSkillMisconceptionIds).toBeUndefined();

    component.ngOnInit();

    expect(component.responseCardIsShown).toBe(true);
    expect(component.enableSolicitAnswerDetailsFeature).toBe(true);
    expect(component.SHOW_TRAINABLE_UNRESOLVED_ANSWERS).toBe(false);
    expect(component.getActiveStateName()).toBe('Hola');
    expect(component.misconceptionsBySkill).toEqual({});
    expect(component.inapplicableSkillMisconceptionIds).toEqual(['id1']);

    component.ngOnDestroy();
  });

  it('should subscribe to events on component initialization', () => {
    spyOn(responsesService.onInitializeAnswerGroups, 'subscribe');
    spyOn(stateInteractionIdService.onInteractionIdChanged, 'subscribe');
    spyOn(responsesService.onAnswerGroupsChanged, 'subscribe');
    spyOn(stateEditorService.onUpdateAnswerChoices, 'subscribe');
    spyOn(stateEditorService.onHandleCustomArgsUpdate, 'subscribe');
    spyOn(stateEditorService.onStateEditorInitialized, 'subscribe');
    spyOn(stateEditorService.onUpdateMisconceptions, 'subscribe');

    component.ngOnInit();

    expect(
      responsesService.onInitializeAnswerGroups.subscribe
    ).toHaveBeenCalled();
    expect(
      stateInteractionIdService.onInteractionIdChanged.subscribe
    ).toHaveBeenCalled();
    expect(responsesService.onAnswerGroupsChanged.subscribe).toHaveBeenCalled();
    expect(
      stateEditorService.onUpdateAnswerChoices.subscribe
    ).toHaveBeenCalled();
    expect(
      stateEditorService.onHandleCustomArgsUpdate.subscribe
    ).toHaveBeenCalled();
    expect(
      stateEditorService.onStateEditorInitialized.subscribe
    ).toHaveBeenCalled();
    expect(
      stateEditorService.onUpdateMisconceptions.subscribe
    ).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it(
    'should set answer group and default answer when answer' +
      ' groups are initialized',
    () => {
      let onInitializeAnswerGroupsEmitter = new EventEmitter();
      spyOnProperty(
        responsesService,
        'onInitializeAnswerGroups'
      ).and.returnValue(onInitializeAnswerGroupsEmitter);
      spyOn(responsesService, 'changeActiveAnswerGroupIndex');
      spyOn(component, 'isCurrentInteractionLinear').and.returnValue(true);

      component.ngOnInit();

      onInitializeAnswerGroupsEmitter.emit(interactionData);

      expect(component.defaultOutcome).toEqual(defaultOutcome);
      expect(component.answerGroups).toEqual(answerGroups);
      expect(
        responsesService.changeActiveAnswerGroupIndex
      ).toHaveBeenCalledWith(0);

      component.ngOnDestroy();
    }
  );

  it(
    'should re-initialize properties and open add answer group modal when' +
      ' interaction is changed to a non-linear and non-terminal one',
    () => {
      let onInteractionIdChangedEmitter = new EventEmitter();
      spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
      spyOn(responsesService, 'getActiveAnswerGroupIndex').and.returnValue(0);
      spyOnProperty(
        stateInteractionIdService,
        'onInteractionIdChanged'
      ).and.returnValue(onInteractionIdChangedEmitter);
      spyOn(responsesService, 'onInteractionIdChanged').and.callFake(
        (options, callback) => {
          // This throws "Argument of type 'null' is not assignable to
          // parameter of type 'AnswerGroup[]'." We need to suppress this error
          // because of the need to test validations. This throws an error
          // because the value passed is null.
          // @ts-ignore
          callback(null, null);
        }
      );
      spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
      spyOn(responsesService, 'getDefaultOutcome').and.returnValue(
        defaultOutcome
      );
      spyOn(component, 'openAddAnswerGroupModal');

      expect(component.answerGroups).toEqual([]);
      expect(component.defaultOutcome).toEqual(undefined);
      expect(component.activeAnswerGroupIndex).toBe(undefined);

      component.ngOnInit();
      onInteractionIdChangedEmitter.emit('ImageClickInput');

      expect(component.answerGroups).toEqual(answerGroups);
      expect(component.defaultOutcome).toEqual(defaultOutcome);
      expect(component.activeAnswerGroupIndex).toBe(0);
      expect(component.openAddAnswerGroupModal).toHaveBeenCalled();

      component.ngOnDestroy();
    }
  );

  it(
    'should not open add answer group modal when interaction is' +
      ' changed to a linear and terminal one',
    () => {
      let onInteractionIdChangedEmitter = new EventEmitter();
      spyOnProperty(
        stateInteractionIdService,
        'onInteractionIdChanged'
      ).and.returnValue(onInteractionIdChangedEmitter);
      spyOn(component, 'openAddAnswerGroupModal');

      component.ngOnInit();
      onInteractionIdChangedEmitter.emit('Continue');

      expect(component.openAddAnswerGroupModal).not.toHaveBeenCalled();

      component.ngOnDestroy();
    }
  );

  it(
    'should get new answer groups, default outcome and verify/update' +
      ' inapplicable skill misconception ids on answer groups change',
    () => {
      let onAnswerGroupsChangedEmitter = new EventEmitter();
      spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
      spyOnProperty(responsesService, 'onAnswerGroupsChanged').and.returnValue(
        onAnswerGroupsChangedEmitter
      );
      spyOn(responsesService, 'getActiveAnswerGroupIndex').and.returnValue(0);
      spyOn(responsesService, 'getDefaultOutcome').and.returnValue(
        defaultOutcome
      );
      spyOn(
        stateEditorService,
        'getInapplicableSkillMisconceptionIds'
      ).and.returnValue(['misconception1']);

      expect(component.answerGroups).toEqual([]);
      expect(component.defaultOutcome).toBeUndefined();
      expect(component.activeAnswerGroupIndex).toBeUndefined();
      expect(component.inapplicableSkillMisconceptionIds).toBeUndefined();

      component.ngOnInit();

      expect(component.inapplicableSkillMisconceptionIds).toEqual([
        'misconception1',
      ]);

      onAnswerGroupsChangedEmitter.emit();

      expect(component.answerGroups).toEqual(answerGroups);
      expect(component.defaultOutcome).toEqual(defaultOutcome);
      expect(component.activeAnswerGroupIndex).toBe(0);
      expect(component.inapplicableSkillMisconceptionIds).toEqual([]);

      component.ngOnDestroy();
    }
  );

  it('should update answer choices', () => {
    let onUpdateAnswerChoicesEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onUpdateAnswerChoices').and.returnValue(
      onUpdateAnswerChoicesEmitter
    );
    spyOn(responsesService, 'updateAnswerChoices');

    component.ngOnInit();
    onUpdateAnswerChoicesEmitter.emit();

    expect(responsesService.updateAnswerChoices).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('should update custom arguments', () => {
    let onHandleCustomArgsUpdateEmitter = new EventEmitter();
    spyOnProperty(
      stateEditorService,
      'onHandleCustomArgsUpdate'
    ).and.returnValue(onHandleCustomArgsUpdateEmitter);
    spyOn(responsesService, 'handleCustomArgsUpdate').and.callFake(
      (newAnswerChoices, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the value passed is null.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

    component.ngOnInit();
    onHandleCustomArgsUpdateEmitter.emit();

    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();

    component.ngOnDestroy();
  });

  it('should set misconceptions when state editor is initialized', () => {
    let onStateEditorInitializedEmitter = new EventEmitter();
    spyOnProperty(
      stateEditorService,
      'onStateEditorInitialized'
    ).and.returnValue(onStateEditorInitializedEmitter);
    spyOn(stateEditorService, 'getMisconceptionsBySkill').and.returnValue({
      skill1: [
        misconceptionObjectFactory.create(
          1,
          'Misconception 1',
          'note',
          '',
          false
        ),
      ],
    });

    expect(component.misconceptionsBySkill).toBe(undefined);
    expect(component.containsOptionalMisconceptions).toBeFalse();

    component.ngOnInit();
    onStateEditorInitializedEmitter.emit();

    expect(component.misconceptionsBySkill).toEqual({
      skill1: [
        misconceptionObjectFactory.create(
          1,
          'Misconception 1',
          'note',
          '',
          false
        ),
      ],
    });
    expect(component.containsOptionalMisconceptions).toBe(true);

    component.ngOnDestroy();
  });

  it('should update misconceptions when state editor emits update event', () => {
    let onUpdateMisconceptionsEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onUpdateMisconceptions').and.returnValue(
      onUpdateMisconceptionsEmitter
    );
    spyOn(stateEditorService, 'getMisconceptionsBySkill').and.returnValue({
      skill1: [
        misconceptionObjectFactory.create(
          1,
          'Misconception 1',
          'note',
          '',
          false
        ),
      ],
    });

    expect(component.misconceptionsBySkill).toBe(undefined);
    expect(component.containsOptionalMisconceptions).toBeFalse();

    component.ngOnInit();
    onUpdateMisconceptionsEmitter.emit();

    expect(component.misconceptionsBySkill).toEqual({
      skill1: [
        misconceptionObjectFactory.create(
          1,
          'Misconception 1',
          'note',
          '',
          false
        ),
      ],
    });
    expect(component.containsOptionalMisconceptions).toBe(true);

    component.ngOnDestroy();
  });

  it('should reset tagged misconceptions when change linked skill id event is emitted', () => {
    let onChangeLinkedSkillIdEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onChangeLinkedSkillId').and.returnValue(
      onChangeLinkedSkillIdEmitter
    );
    stateEditorService.setLinkedSkillId('123');
    spyOn(component, 'resetTaggedSkillMisconceptions').and.callThrough();

    component.answerGroups = answerGroups;

    component.ngOnInit();
    onChangeLinkedSkillIdEmitter.emit();

    expect(component.resetTaggedSkillMisconceptions).toHaveBeenCalled();
    component.ngOnDestroy();
  });

  it('should reset tagged skill misconceptions', () => {
    spyOn(stateEditorService, 'getLinkedSkillId').and.returnValue('skill1');

    component.linkedSkillId = '123';
    component.answerGroups = answerGroups;

    let newAnswerGroups = [
      answerGroupObjectFactory.createFromBackendDict(
        {
          rule_specs: [
            {
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['abc'],
                },
              },
            },
          ],
          outcome: {
            dest: 'State',
            dest_if_really_stuck: null,
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
          },
          training_data: [],
          tagged_skill_misconception_id: null,
        },
        'TextInput'
      ),
    ];

    spyOn(responsesService, 'save').and.callFake(
      (answerGroups, defaultOutcome, callback) => {
        callback(newAnswerGroups, defaultOutcome);
      }
    );

    component.resetTaggedSkillMisconceptions();

    expect(component.answerGroups).toEqual(newAnswerGroups);
    expect(responsesService.save).toHaveBeenCalled();
  });

  it('should get static image URL', () => {
    component.ngOnInit();

    expect(component.getStaticImageUrl('/image/url')).toBe(
      '/assets/images/image/url'
    );

    component.ngOnDestroy();
  });

  it('should check if state is in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(component.isInQuestionMode()).toBe(true);
  });

  it(
    'should suppress default answer group warnings if each choice' +
      ' has been handled by at least one answer group for multiple' +
      ' choice interaction',
    () => {
      // This contains 2 AnswerGroup for a MultipleChoiceInteraction.
      let answerGroups = [
        answerGroupObjectFactory.createFromBackendDict(
          {
            outcome: defaultsOutcomesToSuppressWarnings[0],
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {x: 0},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
          'MultipleChoiceInput'
        ),
        answerGroupObjectFactory.createFromBackendDict(
          {
            outcome: defaultsOutcomesToSuppressWarnings[1],
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {x: 1},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
          'MultipleChoiceInput'
        ),
      ];
      // This contains 2 AnswerChoice for MultipleChoiceInteraction.
      let answerChoices = [
        {
          val: 0,
          label: 'label1',
        },
        {
          val: 1,
          label: 'label2',
        },
      ];
      stateInteractionIdService.savedMemento = 'MultipleChoiceInput';
      spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
      spyOn(responsesService, 'getAnswerChoices').and.returnValue(
        answerChoices
      );

      expect(component.shouldHideDefaultAnswerGroup()).toBe(true);
    }
  );

  it(
    'should suppress default answer group warnings if each choice' +
      ' has been handled by at least one answer group for item' +
      ' selection input interaction',
    () => {
      // This contains 2 AnswerGroup for a ItemSelectionInput.
      let answerGroups = [
        answerGroupObjectFactory.createFromBackendDict(
          {
            outcome: defaultsOutcomesToSuppressWarnings[0],
            rule_specs: [
              {
                rule_type: 'Equals',
                inputs: {x: ['ca_0', 'ca_1']},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
          'ItemSelectionInput'
        ),
        answerGroupObjectFactory.createFromBackendDict(
          {
            outcome: defaultsOutcomesToSuppressWarnings[1],
            rule_specs: [
              {
                rule_type: 'DoesNotContainAtLeastOneOf',
                inputs: {x: ['ca_0', 'ca_1', 'ca_2']},
              },
            ],
            training_data: [],
            tagged_skill_misconception_id: '',
          },
          'ItemSelectionInput'
        ),
      ];
      // This contains 2 AnswerChoice for ItemSelectionInput.
      let answerChoices = [
        {
          val: new SubtitledHtml('<p>Choice 1</p>', 'ca_choices_3'),
          label: '',
        },
      ];
      stateInteractionIdService.savedMemento = 'ItemSelectionInput';
      stateCustomizationArgsService.savedMemento = {
        maxAllowableSelectionCount: {
          value: 1,
        },
      };
      spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
      spyOn(responsesService, 'getAnswerChoices').and.returnValue(
        answerChoices as AnswerChoice[]
      );

      expect(component.shouldHideDefaultAnswerGroup()).toBe(true);
    }
  );

  it(
    'should not suppress warnings for interactions other than multiple' +
      ' choice input or item selection input',
    () => {
      stateInteractionIdService.savedMemento = 'TextInput';

      expect(component.shouldHideDefaultAnswerGroup()).toBe(false);
    }
  );

  it(
    'should save displayed value when solicit answer details' + ' are changed',
    () => {
      spyOn(stateSolicitAnswerDetailsService, 'saveDisplayedValue');
      spyOn(component.onSaveSolicitAnswerDetails, 'emit').and.stub();
      component.ngOnInit();

      component.onChangeSolicitAnswerDetails();

      expect(component.onSaveSolicitAnswerDetails.emit).toHaveBeenCalled();
      expect(
        stateSolicitAnswerDetailsService.saveDisplayedValue
      ).toHaveBeenCalled();
    }
  );

  it('should check if outcome has no feedback with self loop', () => {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'State Name'
    );
    let outcome1 = outcomeObjectFactory.createNew('State Name', '1', '', []);
    let outcome2 = outcomeObjectFactory.createNew(
      'State Name',
      '1',
      'Feedback Text',
      []
    );

    expect(component.isSelfLoopWithNoFeedback(outcome1)).toBe(true);
    expect(component.isSelfLoopWithNoFeedback(outcome2)).toBe(false);
  });

  it('should reject self-loop with undefined outcome', () => {
    // This throws "TS2322". We need to suppress this error because
    // the isSelfLoopThatIsMarkedCorrect function accepts an argument
    // of type Outcome.
    // @ts-ignore
    expect(component.isSelfLoopThatIsMarkedCorrect(undefined)).toBe(false);
  });

  it('should check if outcome marked as correct has self loop', () => {
    let outcome = outcomeObjectFactory.createFromBackendDict({
      dest: 'State Name',
      dest_if_really_stuck: null,
      feedback: {
        content_id: '',
        html: '',
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: 'test',
      missing_prerequisite_skill_id: 'test_skill_id',
    });
    spyOn(stateEditorService, 'getActiveStateName').and.returnValues(
      'State Name',
      'Hola'
    );

    expect(component.isSelfLoopThatIsMarkedCorrect(outcome)).toBe(true);

    expect(component.isSelfLoopThatIsMarkedCorrect(outcome)).toBe(false);
  });

  it(
    'should check if outcome marked as correct has self loop and return' +
      ' true if correctness feedback is enabled',
    () => {
      let outcome = outcomeObjectFactory.createFromBackendDict({
        dest: 'State Name',
        dest_if_really_stuck: null,
        feedback: {
          content_id: '',
          html: '',
        },
        labelled_as_correct: true,
        param_changes: [],
        refresher_exploration_id: 'test',
        missing_prerequisite_skill_id: 'test_skill_id',
      });
      spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
        'State Name'
      );

      expect(component.isSelfLoopThatIsMarkedCorrect(outcome)).toBe(true);
    }
  );

  it('should show state name input if user is creating new state', () => {
    let outcome1 = outcomeObjectFactory.createNew('/', '', '', []);
    let outcome2 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect(component.isCreatingNewState(outcome1)).toBe(true);
    expect(component.isCreatingNewState(outcome2)).toBe(false);
  });

  it('should check if current interaction is non trivial', () => {
    stateInteractionIdService.savedMemento = 'Continue';

    expect(component.isCurrentInteractionTrivial()).toBe(true);

    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionTrivial()).toBe(false);
  });

  it('should check if the interaction is linear and has feedback', () => {
    stateInteractionIdService.savedMemento = 'Continue';
    let outcome1 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect(component.isLinearWithNoFeedback(outcome1)).toBe(true);

    stateInteractionIdService.savedMemento = 'Continue';
    let outcome2 = outcomeObjectFactory.createNew('Hola', '', 'Right!', []);

    expect(component.isLinearWithNoFeedback(outcome2)).toBe(false);

    stateInteractionIdService.savedMemento = 'TextInput';
    let outcome3 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect(component.isLinearWithNoFeedback(outcome3)).toBe(false);

    stateInteractionIdService.savedMemento = 'TextInput';
    let outcome4 = outcomeObjectFactory.createNew('Hola', '', 'Wrong!', []);

    expect(component.isLinearWithNoFeedback(outcome4)).toBe(false);
  });

  it('should get outcome tooltip text', () => {
    // When outcome has self loop and is labelled correct.
    let outcome = outcomeObjectFactory.createFromBackendDict({
      dest: 'State Name',
      dest_if_really_stuck: null,
      feedback: {
        content_id: '',
        html: '',
      },
      labelled_as_correct: true,
      param_changes: [],
      refresher_exploration_id: 'test',
      missing_prerequisite_skill_id: 'test_skill_id',
    });
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue(
      'State Name'
    );

    expect(component.getOutcomeTooltip(outcome)).toBe(
      'Self-loops should not be labelled as correct.'
    );

    // When interaction is linear with no feedback.
    stateInteractionIdService.savedMemento = 'Continue';
    let outcome1 = outcomeObjectFactory.createNew('Hola', '', '', []);

    expect(component.getOutcomeTooltip(outcome1)).toBe(
      'Please direct the learner to a different card.'
    );

    // When interaction is not linear.
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.getOutcomeTooltip(outcome1)).toBe(
      'Please give Oppia something useful to say,' +
        ' or direct the learner to a different card.'
    );
  });

  it('should open openAddAnswerGroupModal', fakeAsync(() => {
    component.addState = () => {};
    component.answerGroups = answerGroups;
    spyOn(externalSaveService.onExternalSave, 'emit').and.stub();
    spyOn(alertsService, 'clearWarnings').and.stub();
    spyOn(answerGroupObjectFactory, 'createNew').and.returnValue(
      answerGroupObjectFactory.createFromBackendDict(
        {
          rule_specs: [
            {
              rule_type: 'Contains',
              inputs: {
                x: {
                  contentId: 'rule_input',
                  normalizedStrSet: ['abc'],
                },
              },
            },
          ],
          outcome: {
            dest: 'State',
            dest_if_really_stuck: null,
            feedback: {
              html: '',
              content_id: 'This is a new feedback text',
            },
            labelled_as_correct: false,
            param_changes: [],
            refresher_exploration_id: 'test',
            missing_prerequisite_skill_id: 'test_skill_id',
          },
          training_data: [],
          tagged_skill_misconception_id: 'misconception1',
        },
        'TextInput'
      )
    );
    stateInteractionIdService.savedMemento = 'MultipleChoiceInput';
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('none');
    spyOn(responsesService, 'save').and.callFake(
      (answerGroups, defaultOutcome, callback) => {
        callback(answerGroups, defaultOutcome);
      }
    );
    spyOn(ngbModal, 'open').and.returnValues(
      {
        componentInstance: {
          addState: {
            subscribe(value: () => void) {
              value();
            },
          },
          currentInteractionId: 'currentInteractionId',
          stateName: 'stateName',
        },
        result: Promise.resolve({
          reopen: true,
          tmpRule: new Rule(
            '',
            {
              x: {
                contentId: null,
                normalizedStrSet: [],
              },
            },
            {
              x: 'TranslatableSetOfNormalizedString',
            }
          ),
          tmpOutcome: outcomeObjectFactory.createNew(
            'Hola',
            '1',
            'Feedback text',
            []
          ),
          tmpTaggedSkillMisconceptionId: '',
        }),
      } as NgbModalRef,
      {
        componentInstance: {
          addState: {
            subscribe(value: () => void) {
              value();
            },
          },
          currentInteractionId: 'currentInteractionId',
          stateName: 'stateName',
        },
        result: Promise.resolve({
          reopen: false,
          tmpRule: new Rule(
            '',
            {
              x: {
                contentId: null,
                normalizedStrSet: [],
              },
            },
            {
              x: 'TranslatableSetOfNormalizedString',
            }
          ),
          tmpOutcome: outcomeObjectFactory.createNew(
            'Hola',
            '1',
            'Feedback text',
            []
          ),
          tmpTaggedSkillMisconceptionId: '',
        }),
      } as NgbModalRef
    );

    component.openAddAnswerGroupModal();
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(responsesService.save).toHaveBeenCalled();
  }));

  it('should open openAddAnswerGroupModal modal and call reject part', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        addState: {
          subscribe(value: () => void) {
            return;
          },
        },
        currentInteractionId: 'currentInteractionId',
        stateName: 'stateName',
      },
      result: Promise.reject(),
    } as NgbModalRef);

    component.openAddAnswerGroupModal();

    expect(ngbModal.open).toHaveBeenCalled();
  });

  it(
    'should open delete answer group modal when user clicks' +
      ' on delete button',
    () => {
      spyOn(ngbModal, 'open').and.callThrough();

      const event = new Event('');

      component.deleteAnswerGroup(event, 0);

      expect(ngbModal.open).toHaveBeenCalled();
    }
  );

  it('should delete answer group after modal is opened', fakeAsync(() => {
    spyOn(responsesService, 'deleteAnswerGroup').and.callFake(
      (value, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the callback is called with null as an argument.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);

    const event = new Event('');

    component.deleteAnswerGroup(event, 0);
    tick();

    expect(ngbModal.open).toHaveBeenCalled();
    expect(responsesService.deleteAnswerGroup).toHaveBeenCalled();
  }));

  it('should clear warnings when delete answer group modal is closed', () => {
    spyOn(alertsService, 'clearWarnings');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);

    const event = new Event('');

    component.deleteAnswerGroup(event, 0);

    expect(alertsService.clearWarnings).toHaveBeenCalled();
  });

  it('should update active answer group for newly tagged misconception', () => {
    spyOn(responsesService, 'updateActiveAnswerGroup').and.callFake(
      (taggedSkillMisconceptionId, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the callback is called with null as an argument.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

    component.saveTaggedMisconception({
      misconceptionId: 1,
      skillId: 'skill1',
    });

    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
  });

  it('should update active answer group when feedback is changed', () => {
    spyOn(responsesService, 'updateActiveAnswerGroup').and.callFake(
      (feedback, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the callback is called with null as an argument.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

    component.saveActiveAnswerGroupFeedback(defaultOutcome);

    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
  });

  it('should update active answer group when destination is changed', () => {
    spyOn(responsesService, 'updateActiveAnswerGroup').and.callFake(
      (dest, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the callback is called with null as an argument.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

    component.saveActiveAnswerGroupDest(defaultOutcome);

    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
  });

  it('should update active answer group when destination is changed', () => {
    spyOn(responsesService, 'updateActiveAnswerGroup').and.callFake(
      (destIfReallyStuck, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the callback is called with null as an argument.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

    component.saveActiveAnswerGroupDestIfStuck(defaultOutcome);

    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
  });

  it(
    'should update active answer group when correctness' + ' label is changed',
    () => {
      spyOn(responsesService, 'updateActiveAnswerGroup').and.callFake(
        (labelledAsCorrect, callback) => {
          // This throws "Argument of type 'null' is not assignable to
          // parameter of type 'AnswerGroup[]'." We need to suppress this error
          // because of the need to test validations. This throws an error
          // because the callback is called with null as an argument.
          // @ts-ignore
          callback(null);
        }
      );
      spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

      component.saveActiveAnswerGroupCorrectnessLabel(defaultOutcome);

      expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
    }
  );

  it('should update active answer group when answer rules are changed', () => {
    spyOn(responsesService, 'updateActiveAnswerGroup').and.callFake(
      (rules, callback) => {
        // This throws "Argument of type 'null' is not assignable to
        // parameter of type 'AnswerGroup[]'." We need to suppress this error
        // because of the need to test validations. This throws an error
        // because the callback is called with null as an argument.
        // @ts-ignore
        callback(null);
      }
    );
    spyOn(component.onSaveInteractionAnswerGroups, 'emit').and.stub();

    component.saveActiveAnswerGroupRules([
      new Rule(
        '',
        {
          x: {
            contentId: null,
            normalizedStrSet: [],
          },
        },
        {
          x: 'TranslatableSetOfNormalizedString',
        }
      ),
    ]);

    expect(component.onSaveInteractionAnswerGroups.emit).toHaveBeenCalled();
  });

  it(
    'should update default outcome when default' +
      ' outcome feedback is changed',
    () => {
      spyOn(responsesService, 'updateDefaultOutcome').and.callFake(
        ({feedback, dest}, callback) => {
          // This throws "Argument of type 'null' is not assignable to
          // parameter of type 'AnswerGroup[]'." We need to suppress this error
          // because of the need to test validations. This throws an error
          // because the callback is called with null as an argument.
          // @ts-ignore
          callback(null);
        }
      );
      spyOn(component.onSaveInteractionDefaultOutcome, 'emit').and.stub();

      component.saveDefaultOutcomeFeedback(defaultOutcome);

      expect(component.onSaveInteractionDefaultOutcome.emit).toHaveBeenCalled();
    }
  );

  it(
    'should update default outcome when default' +
      ' outcome destination is changed',
    () => {
      spyOn(responsesService, 'updateDefaultOutcome').and.callFake(
        (dest, callback) => {
          // This throws "Argument of type 'null' is not assignable to
          // parameter of type 'AnswerGroup[]'." We need to suppress this error
          // because of the need to test validations. This throws an error
          // because the callback is called with null as an argument.
          // @ts-ignore
          callback(null);
        }
      );
      spyOn(component.onSaveInteractionDefaultOutcome, 'emit').and.stub();

      component.saveDefaultOutcomeDest(defaultOutcome);

      expect(component.onSaveInteractionDefaultOutcome.emit).toHaveBeenCalled();
    }
  );

  it(
    'should update default outcome when default' +
      ' outcome destination for stuck learner is changed',
    () => {
      spyOn(responsesService, 'updateDefaultOutcome').and.callFake(
        (destIfReallyStuck, callback) => {
          // This throws "Argument of type 'null' is not assignable to
          // parameter of type 'AnswerGroup[]'." We need to suppress this error
          // because of the need to test validations. This throws an error
          // because the callback is called with null as an argument.
          // @ts-ignore
          callback(null);
        }
      );
      spyOn(component.onSaveInteractionDefaultOutcome, 'emit').and.stub();

      component.saveDefaultOutcomeDestIfStuck(defaultOutcome);

      expect(component.onSaveInteractionDefaultOutcome.emit).toHaveBeenCalled();
    }
  );

  it(
    'should update default outcome when default' +
      ' outcome correctness label is changed',
    () => {
      spyOn(responsesService, 'updateDefaultOutcome').and.callFake(
        ({labelledAsCorrect}, callback) => {
          // This throws "Argument of type 'null' is not assignable to
          // parameter of type 'AnswerGroup[]'." We need to suppress this error
          // because of the need to test validations. This throws an error
          // because the callback is called with null as an argument.
          // @ts-ignore
          callback(null);
        }
      );
      spyOn(component.onSaveInteractionDefaultOutcome, 'emit').and.stub();

      component.saveDefaultOutcomeCorrectnessLabel(defaultOutcome);

      expect(component.onSaveInteractionDefaultOutcome.emit).toHaveBeenCalled();
    }
  );

  it('should get answer choices', () => {
    const answerChoices = [
      {
        val: 0,
        label: 'label1',
      },
      {
        val: 1,
        label: 'label2',
      },
    ];
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    expect(component.getAnswerChoices()).toEqual(answerChoices);
  });

  it('should return summary of answer group', () => {
    expect(
      component.summarizeAnswerGroup(
        answerGroupObjectFactory.createNew(
          [],
          outcomeObjectFactory.createNew('unused', '1', 'Feedback text', []),
          [],
          '0'
        ),
        '1',
        [],
        true
      )
    ).toBe('[] Feedback text');

    expect(
      component.summarizeAnswerGroup(
        answerGroupObjectFactory.createNew(
          [],
          outcomeObjectFactory.createNew('unused', '1', 'Feedback text', []),
          [],
          '0'
        ),
        '1',
        [],
        false
      )
    ).toBe('[Answer ] Feedback text');
  });

  it('should get summary default outcome when outcome is linear', () => {
    expect(
      component.summarizeDefaultOutcome(
        outcomeObjectFactory.createNew('unused', '1', 'Feedback Text', []),
        'Continue',
        0,
        true
      )
    ).toBe('[] Feedback Text');
  });

  it(
    'should get summary default outcome when answer group count' +
      ' is greater than 0',
    () => {
      expect(
        component.summarizeDefaultOutcome(
          outcomeObjectFactory.createNew('unused', '1', 'Feedback Text', []),
          'TextInput',
          1,
          true
        )
      ).toBe('[] Feedback Text');
    }
  );

  it(
    'should get summary default outcome when answer group count' +
      ' is equal to 0',
    () => {
      expect(
        component.summarizeDefaultOutcome(
          outcomeObjectFactory.createNew('unused', '1', 'Feedback Text', []),
          'TextInput',
          0,
          true
        )
      ).toBe('[] Feedback Text');
    }
  );

  it(
    'should get an empty summary when default outcome' + ' is a falsy value',
    () => {
      // This throws "Argument of type 'null' is not assignable to parameter of
      // type 'Outcome'." We need to suppress this error because of the need to
      // test validations. This throws an error because the callback is called
      // with null as an argument.
      // @ts-ignore
      expect(component.summarizeDefaultOutcome(null, 'Continue', 0, true)).toBe(
        ''
      );
    }
  );

  it('should check if outcome is looping', () => {
    spyOn(stateEditorService, 'getActiveStateName').and.returnValue('Hola');
    expect(
      component.isOutcomeLooping(
        outcomeObjectFactory.createNew('Hola', '', '', [])
      )
    ).toBe(true);
    expect(
      component.isOutcomeLooping(
        outcomeObjectFactory.createNew('Second Last', '', '', [])
      )
    ).toBe(false);
  });

  it('should toggle response card', () => {
    component.responseCardIsShown = true;

    component.toggleResponseCard();
    expect(component.responseCardIsShown).toBe(false);

    component.toggleResponseCard();
    expect(component.responseCardIsShown).toBe(true);
  });

  it('should check if no action is expected for misconception', () => {
    spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    component.inapplicableSkillMisconceptionIds = ['misconception2'];

    // Here, misconception1 is assigned to answerGroup, so no action is
    // expected.
    expect(component.isNoActionExpected('misconception1')).toBe(true);
    // Here, misconception2 is not assigned to answerGroup but it is an
    // inapplicable skill misconception, so no action is expected.
    expect(component.isNoActionExpected('misconception2')).toBe(true);
    // Here, misconception3 is neither inapplicable nor assigned to answerGroup
    // so action is expected.
    expect(component.isNoActionExpected('misconceptions')).toBe(false);
  });

  it(
    'should update optional misconception id status when user' +
      ' marks it as applicable',
    () => {
      component.inapplicableSkillMisconceptionIds = ['misconception1'];

      component.updateOptionalMisconceptionIdStatus('misconception1', true);

      expect(component.inapplicableSkillMisconceptionIds).toEqual([]);
    }
  );

  it(
    'should update optional misconception id status when user' +
      ' marks it as applicable',
    () => {
      component.inapplicableSkillMisconceptionIds = ['misconception1'];

      component.updateOptionalMisconceptionIdStatus('misconception2', false);

      expect(component.inapplicableSkillMisconceptionIds).toEqual([
        'misconception1',
        'misconception2',
      ]);
    }
  );

  it('should get unaddressed misconception names in question mode', () => {
    spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
    component.misconceptionsBySkill = {
      skill1: [
        misconceptionObjectFactory.create(
          1,
          'Misconception 1',
          'note',
          '',
          false
        ),
        misconceptionObjectFactory.create(
          2,
          'Misconception 2',
          'note',
          '',
          true
        ),
      ],
    };

    expect(component.getUnaddressedMisconceptionNames()).toEqual([
      'Misconception 2',
    ]);
  });

  it('should get unaddressed misconception names in exploration mode', () => {
    spyOn(responsesService, 'getAnswerGroups').and.returnValue(answerGroups);
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(false);
    spyOn(stateEditorService, 'getLinkedSkillId').and.returnValue('skill1');
    component.misconceptionsBySkill = {
      skill1: [
        misconceptionObjectFactory.create(
          1,
          'Misconception 1',
          'note',
          '',
          false
        ),
        misconceptionObjectFactory.create(
          2,
          'Misconception 2',
          'note',
          '',
          true
        ),
      ],
    };

    expect(component.getUnaddressedMisconceptionNames()).toEqual([
      'Misconception 2',
    ]);
  });
});
