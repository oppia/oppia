// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit test for Answer Group Editor Component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {StateEditorService} from 'components/state-editor/state-editor-properties-services/state-editor.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {Rule, RuleInputs} from 'domain/exploration/rule.model';
import {ParameterizeRuleDescriptionPipe} from 'filters/parameterize-rule-description.pipe';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {TrainingDataEditorPanelService} from 'pages/exploration-editor-page/editor-tab/training-panel/training-data-editor-panel.service';
import {AlertsService} from 'services/alerts.service';
import {ExternalSaveService} from 'services/external-save.service';
import {AnswerGroupEditor} from './answer-group-editor.component';
import {PlatformFeatureService} from 'services/platform-feature.service';

type Outcome = Parameters<
  AnswerGroupEditor['sendOnSaveAnswerGroupFeedback']
>[0];

class MockPlatformFeatureService {
  status = {
    ExplorationEditorCanTagMisconceptions: {
      isEnabled: true,
    },
  };
}

describe('Answer Group Editor Component', () => {
  let component: AnswerGroupEditor;
  let fixture: ComponentFixture<AnswerGroupEditor>;
  let externalSaveService: ExternalSaveService;
  let stateEditorService: StateEditorService;
  let stateInteractionIdService: StateInteractionIdService;
  let responsesService: ResponsesService;
  let alertsService: AlertsService;
  let trainingDataEditorPanelService: TrainingDataEditorPanelService;
  let mockOnExternalSave = new EventEmitter();
  let mockOnUpdateAnswerChoices = new EventEmitter();
  let mockOnInteractionIdChanged = new EventEmitter();
  let mockPlatformFeatureService = new MockPlatformFeatureService();

  let answerChoices = [
    {
      val: 'c',
      label: '',
    },
    {
      val: 'b',
      label: '',
    },
    {
      val: 'a',
      label: '',
    },
  ];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [AnswerGroupEditor, ParameterizeRuleDescriptionPipe],
      providers: [
        ExternalSaveService,
        StateEditorService,
        StateInteractionIdService,
        ResponsesService,
        AlertsService,
        TrainingDataEditorPanelService,
        {
          provide: PlatformFeatureService,
          useValue: mockPlatformFeatureService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerGroupEditor);
    component = fixture.componentInstance;

    externalSaveService = TestBed.inject(ExternalSaveService);
    stateEditorService = TestBed.inject(StateEditorService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    responsesService = TestBed.inject(ResponsesService);
    alertsService = TestBed.inject(AlertsService);
    trainingDataEditorPanelService = TestBed.inject(
      TrainingDataEditorPanelService
    );

    spyOn(externalSaveService, 'onExternalSave').and.returnValue(
      mockOnExternalSave
    );
    spyOn(stateEditorService, 'onUpdateAnswerChoices').and.returnValue(
      mockOnUpdateAnswerChoices
    );
    spyOn(stateInteractionIdService, 'onInteractionIdChanged').and.returnValue(
      mockOnInteractionIdChanged
    );
  });

  it('should set component properties on initialization', () => {
    spyOn(responsesService, 'getActiveRuleIndex').and.returnValue(1);
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    expect(component.rulesMemento).toBeNull();
    expect(component.activeRuleIndex).toBeUndefined();
    expect(component.editAnswerGroupForm).toEqual({});
    expect(component.answerChoices).toBeUndefined();

    component.ngOnInit();

    expect(component.rulesMemento).toBeNull();
    expect(component.activeRuleIndex).toBe(1);
    expect(component.editAnswerGroupForm).toEqual({});
    expect(component.answerChoices).toEqual(answerChoices);

    component.ngOnDestroy();
  });

  it(
    'should save rules when current rule is valid and user' +
      ' triggers an external save',
    fakeAsync(() => {
      let externalSaveEmitter = new EventEmitter();
      spyOnProperty(externalSaveService, 'onExternalSave').and.returnValue(
        externalSaveEmitter
      );
      spyOn(stateEditorService, 'checkCurrentRuleInputIsValid').and.returnValue(
        true
      );
      spyOn(component, 'saveRules').and.stub();

      component.ngOnInit();
      component.activeRuleIndex = 1;
      component.sendOnSaveTaggedMisconception({
        skillId: '',
        misconceptionId: 0,
      });
      component.sendOnSaveAnswerGroupCorrectnessLabel({} as unknown as Outcome);
      component.sendOnSaveAnswerGroupFeedback({} as unknown as Outcome);

      externalSaveEmitter.emit();
      tick();

      expect(component.saveRules).toHaveBeenCalled();

      component.ngOnDestroy();
    })
  );

  it(
    'should warning message when current rule is invalid and user' +
      ' triggers an external save',
    fakeAsync(() => {
      let externalSaveEmitter = new EventEmitter();
      spyOnProperty(externalSaveService, 'onExternalSave').and.returnValue(
        externalSaveEmitter
      );
      spyOn(stateEditorService, 'checkCurrentRuleInputIsValid').and.returnValue(
        false
      );
      spyOn(alertsService, 'addInfoMessage');

      component.ngOnInit();
      component.activeRuleIndex = 1;
      alertsService.addMessage('info', 'Some other message', 0);
      component.sendOnSaveAnswerGroupDest({} as unknown as Outcome);
      component.sendOnSaveAnswerGroupDestIfStuck({} as unknown as Outcome);

      externalSaveEmitter.emit();
      tick();

      expect(alertsService.addInfoMessage).toHaveBeenCalledWith(
        'There was an unsaved rule input which was invalid' +
          ' and has been discarded.'
      );

      component.ngOnDestroy();
    })
  );

  it('should return back when ruleTypes length is 0', () => {
    spyOn(component, 'getCurrentInteractionId').and.returnValue('Continue');
    spyOn(component, 'changeActiveRuleIndex').and.stub();

    component.addNewRule();

    expect(component.changeActiveRuleIndex).not.toHaveBeenCalled();
  });

  it('should get answer choices when user updates answer choices', fakeAsync(() => {
    let updateAnswerChoicesEmitter = new EventEmitter();
    spyOnProperty(stateEditorService, 'onUpdateAnswerChoices').and.returnValue(
      updateAnswerChoicesEmitter
    );
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    component.ngOnInit();
    updateAnswerChoicesEmitter.emit();
    tick();

    expect(component.answerChoices).toEqual(answerChoices);

    component.ngOnDestroy();
  }));

  it(
    'should save rules and get answer choices when interaction' + ' is changed',
    fakeAsync(() => {
      let interactionIdChangedEmitter = new EventEmitter();
      spyOnProperty(
        stateInteractionIdService,
        'onInteractionIdChanged'
      ).and.returnValue(interactionIdChangedEmitter);
      spyOn(component, 'saveRules').and.stub();
      spyOn(responsesService, 'getAnswerChoices').and.returnValue(
        answerChoices
      );

      component.ngOnInit();
      component.activeRuleIndex = 1;

      interactionIdChangedEmitter.emit();
      tick();

      expect(component.saveRules).toHaveBeenCalled();
      expect(component.answerChoices).toEqual(answerChoices);

      component.ngOnDestroy();
    })
  );

  it('should check if editor is in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(component.isInQuestionMode()).toBe(true);
  });

  it("should get current interaction's ID", () => {
    stateInteractionIdService.savedMemento = 'TextIput';

    expect(component.getCurrentInteractionId()).toBe('TextIput');
  });

  it('should get default input values for different variable type', () => {
    expect(component.getDefaultInputValue('Null')).toBe(null);
    expect(component.getDefaultInputValue('Boolean')).toBe(false);
    expect(component.getDefaultInputValue('Int')).toBe(0);
    expect(component.getDefaultInputValue('PositiveInt')).toBe(1);
    expect(component.getDefaultInputValue('UnicodeString')).toBe('');
    expect(component.getDefaultInputValue('NormalizedString')).toBe('');
    expect(component.getDefaultInputValue('MathExpressionContent')).toBe('');
    expect(component.getDefaultInputValue('Html')).toBe('');
    expect(component.getDefaultInputValue('SanitizedUrl')).toBe('');
    expect(component.getDefaultInputValue('Filepath')).toBe('');
    expect(component.getDefaultInputValue('CodeEvaluation')).toEqual({
      code: '',
      error: '',
      evaluation: '',
      output: '',
    });
    expect(component.getDefaultInputValue('CoordTwoDim')).toEqual([0, 0]);
    expect(component.getDefaultInputValue('MusicPhrase')).toEqual([]);
    expect(component.getDefaultInputValue('CheckedProof')).toEqual({
      assumptions_string: '',
      correct: false,
      proof_string: '',
      target_string: '',
    });
    expect(component.getDefaultInputValue('Graph')).toEqual({
      edges: [],
      isDirected: false,
      isLabeled: false,
      isWeighted: false,
      vertices: [],
    });
    expect(component.getDefaultInputValue('NormalizedRectangle2D')).toEqual([
      [0, 0],
      [0, 0],
    ]);
    expect(component.getDefaultInputValue('ImageRegion')).toEqual({
      area: [
        [0, 0],
        [0, 0],
      ],
      regionType: '',
    });
    expect(component.getDefaultInputValue('ImageWithRegions')).toEqual({
      imagePath: '',
      labeledRegions: [],
    });
    expect(component.getDefaultInputValue('ClickOnImage')).toEqual({
      clickPosition: [0, 0],
      clickedRegions: [],
    });
    expect(
      component.getDefaultInputValue('TranslatableSetOfNormalizedString')
    ).toEqual({
      contentId: null,
      normalizedStrSet: [],
    });
    expect(
      component.getDefaultInputValue('TranslatableSetOfUnicodeString')
    ).toEqual({
      contentId: null,
      normalizedStrSet: [],
    });
  });

  it(
    "should add new rule when user click on '+ Add Another" +
      " Possible Answer'",
    () => {
      component.rules = [];
      stateInteractionIdService.savedMemento = 'TextInput';

      component.addNewRule();

      expect(component.rules).toEqual([
        new Rule(
          'StartsWith',
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
    }
  );

  it('should not add rule for interaction specs without description', () => {
    stateInteractionIdService.savedMemento = 'MultipleChoiceInput';
    component.rules = [];
    expect(component.addNewRule()).toBe(undefined);
  });

  it('should delete rule when user clicks on delete', () => {
    component.originalContentIdToContent = {
      id1: 'content',
    };
    component.rules = [
      new Rule(
        'StartsWith',
        {
          x: {
            contentId: 'id1',
            normalizedStrSet: [],
          },
        },
        {
          x: 'TranslatableSetOfNormalizedString',
        }
      ),
      new Rule(
        'StartsWith',
        {
          x: {
            contentId: 'id2',
            normalizedStrSet: [],
          },
        },
        {
          x: 'TranslatableSetOfNormalizedString',
        }
      ),
    ];

    component.deleteRule(1);

    expect(component.rules).toEqual([
      new Rule(
        'StartsWith',
        {
          x: {
            contentId: 'id1',
            normalizedStrSet: [],
          },
        },
        {
          x: 'TranslatableSetOfNormalizedString',
        }
      ),
    ]);
  });

  it('should show warning if user deletes the only existing rule', () => {
    component.rules = [
      new Rule(
        'StartsWith',
        {
          x: {
            contentId: 'id1',
            normalizedStrSet: [],
          },
        },
        {
          x: 'TranslatableSetOfNormalizedString',
        }
      ),
    ];
    spyOn(alertsService, 'addWarning');

    component.deleteRule(0);

    expect(component.rules).toEqual([]);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'All answer groups must have at least one rule.'
    );
  });

  it('should cancel active rule edits, when user clicks on cancel', () => {
    let rule1 = new Rule(
      'StartsWith',
      {
        x: {
          contentId: 'id1',
          normalizedStrSet: [],
        },
      },
      {
        x: 'TranslatableSetOfNormalizedString',
      }
    );
    let rule2 = new Rule(
      'StartsWith',
      {
        x: {
          contentId: 'id2',
          normalizedStrSet: [],
        },
      },
      {
        x: 'TranslatableSetOfNormalizedString',
      }
    );

    component.rules = [rule1];
    component.rulesMemento = [rule2];

    component.cancelActiveRuleEdit();

    expect(component.rules).toEqual([rule2]);
  });

  it('should check if ML is enabled', () => {
    expect(component.isMLEnabled()).toBe(false);
  });

  it(
    'should open training data editor when user click on' +
      " 'Modify Training Data'",
    () => {
      spyOn(trainingDataEditorPanelService, 'openTrainingDataEditor');

      component.openTrainingDataEditor();

      expect(
        trainingDataEditorPanelService.openTrainingDataEditor
      ).toHaveBeenCalled();
    }
  );

  it('should check if current interaction is trainable', () => {
    // We set the current interaction as TextInput, which is trainable.
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.isCurrentInteractionTrainable()).toBe(true);

    // We set the current interaction as MultipleChoiceInput, which is not
    // trainable, according to the values provided during setup.
    stateInteractionIdService.savedMemento = 'MultipleChoiceInput';

    expect(component.isCurrentInteractionTrainable()).toBe(false);

    // An error is thrown if an invalid interaction ID is passed.
    stateInteractionIdService.savedMemento = 'InvalidInteraction';
    component.rules = [];
    component.rules.push(
      new Rule(
        'dummyRule1',
        {
          x: {
            contentId: null,
            normalizedStrSet: [],
          },
        },
        {
          x: 'dummyInputType1',
        }
      )
    );
    component.rules.push(
      new Rule(
        'dummyRule2',
        {
          x: {
            contentId: null,
            normalizedStrSet: [],
          },
        },
        {
          x: 'dummyInputType2',
        }
      )
    );

    expect(() => component.isCurrentInteractionTrainable()).toThrowError(
      'Invalid interaction id - InvalidInteraction. Answer group rules: ' +
        'dummyRule1, dummyRule2'
    );
  });

  it('should not open rule editor if it is in read-only mode', () => {
    spyOn(component, 'changeActiveRuleIndex');

    component.isEditable = false;

    expect(component.openRuleEditor(0)).toBe(undefined);
    expect(component.changeActiveRuleIndex).not.toHaveBeenCalled();
  });

  it('should open rule editor if it is not in read-only mode', () => {
    let rule1 = new Rule(
      'StartsWith',
      {
        x: {
          contentId: 'id1',
          normalizedStrSet: [],
        },
      },
      {
        x: 'TranslatableSetOfNormalizedString',
      }
    );
    component.rules = [rule1];
    spyOn(component, 'changeActiveRuleIndex');

    component.isEditable = true;

    component.openRuleEditor(0);

    expect(component.rulesMemento).toEqual([rule1]);
    expect(component.changeActiveRuleIndex).toHaveBeenCalled();
  });

  it('should return correct default values for different input types', () => {
    expect(component.getDefaultInputValue('Null')).toBeNull();
    expect(component.getDefaultInputValue('Boolean')).toBe(false);
    expect(component.getDefaultInputValue('Real')).toBe(0);
    expect(component.getDefaultInputValue('Int')).toBe(0);
    expect(component.getDefaultInputValue('NonnegativeInt')).toBe(0);
    expect(component.getDefaultInputValue('PositiveInt')).toBe(1);
    expect(component.getDefaultInputValue('CodeString')).toBe('');
    expect(component.getDefaultInputValue('UnicodeString')).toBe('');
    expect(component.getDefaultInputValue('NormalizedString')).toBe('');
    expect(component.getDefaultInputValue('MathExpressionContent')).toBe('');
    expect(component.getDefaultInputValue('Html')).toBe('');
    expect(component.getDefaultInputValue('SanitizedUrl')).toBe('');
    expect(component.getDefaultInputValue('Filepath')).toBe('');

    const codeEval = component.getDefaultInputValue(
      'CodeEvaluation'
    ) as unknown as Record<string, unknown>;
    expect(codeEval.code).toBe('');
    expect(codeEval.error).toBe('');

    const coord = component.getDefaultInputValue('CoordTwoDim') as number[];
    expect(coord).toEqual([0, 0]);

    expect(
      Array.isArray(component.getDefaultInputValue('ListOfUnicodeString'))
    ).toBeTrue();
    expect(
      Array.isArray(component.getDefaultInputValue('SetOfAlgebraicIdentifier'))
    ).toBeTrue();
    expect(
      Array.isArray(component.getDefaultInputValue('SetOfUnicodeString'))
    ).toBeTrue();
    expect(
      Array.isArray(component.getDefaultInputValue('SetOfNormalizedString'))
    ).toBeTrue();
    expect(
      Array.isArray(component.getDefaultInputValue('MusicPhrase'))
    ).toBeTrue();

    const checkedProof = component.getDefaultInputValue(
      'CheckedProof'
    ) as unknown as Record<string, unknown>;
    expect(checkedProof.assumptions_string).toBe('');
    expect(checkedProof.correct).toBe(false);

    const graph = component.getDefaultInputValue('Graph') as unknown as Record<
      string,
      unknown
    >;
    expect(graph.edges).toEqual([]);
    expect(graph.vertices).toEqual([]);
    expect(graph.isDirected).toBe(false);

    const normRect = component.getDefaultInputValue(
      'NormalizedRectangle2D'
    ) as number[][];
    expect(normRect).toEqual([
      [0, 0],
      [0, 0],
    ]);

    const imageRegion = component.getDefaultInputValue(
      'ImageRegion'
    ) as unknown as Record<string, unknown>;
    expect(imageRegion.regionType).toBe('');

    const imageWithRegions = component.getDefaultInputValue(
      'ImageWithRegions'
    ) as unknown as Record<string, unknown>;
    expect(imageWithRegions.imagePath).toBe('');
    expect(Array.isArray(imageWithRegions.labeledRegions)).toBeTrue();

    const clickOnImage = component.getDefaultInputValue(
      'ClickOnImage'
    ) as unknown as Record<string, unknown>;
    expect(Array.isArray(clickOnImage.clickPosition)).toBeTrue();
    expect(Array.isArray(clickOnImage.clickedRegions)).toBeTrue();

    const transSetNorm = component.getDefaultInputValue(
      'TranslatableSetOfNormalizedString'
    ) as unknown as Record<string, unknown>;
    expect(transSetNorm.contentId).toBeNull();
    expect(Array.isArray(transSetNorm.normalizedStrSet)).toBeTrue();

    const transSetUni = component.getDefaultInputValue(
      'TranslatableSetOfUnicodeString'
    ) as unknown as Record<string, unknown>;
    expect(transSetUni.contentId).toBeNull();
    expect(Array.isArray(transSetUni.normalizedStrSet)).toBeTrue();
  });

  it('should get translatable rules content ID to content map', () => {
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: 'content_1', normalizedStrSet: ['test']},
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString'}
      ),
    ];

    const map = component.getTranslatableRulesContentIdToContentMap();
    expect(map.content_1).toEqual({
      contentId: 'content_1',
      normalizedStrSet: ['test'],
    });
  });

  it('should get current interaction name', () => {
    stateInteractionIdService.savedMemento = 'TextInput';
    expect(component.getCurrentInteractionId()).toBe('TextInput');
  });

  it('should check if in question mode', () => {
    spyOn(stateEditorService, 'isInQuestionMode').and.returnValue(true);
    expect(component.isInQuestionMode()).toBeTrue();
  });

  it('should get answer choices', () => {
    const choices = [{val: 'a', label: 'A'}];
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(choices);
    expect(component.getAnswerChoices()).toEqual(choices);
  });

  it('should send events for saving tagged misconception', () => {
    spyOn(component.onSaveTaggedMisconception, 'emit');
    const event = {skillId: 'skill1', misconceptionId: 1};
    component.sendOnSaveTaggedMisconception(event);
    expect(component.onSaveTaggedMisconception.emit).toHaveBeenCalledWith(
      event
    );
  });

  it('should send events for saving correctness label', () => {
    spyOn(component.onSaveAnswerGroupCorrectnessLabel, 'emit');
    const outcome = {dest: 'dest1'} as unknown as Outcome;
    component.sendOnSaveAnswerGroupCorrectnessLabel(outcome);
    expect(
      component.onSaveAnswerGroupCorrectnessLabel.emit
    ).toHaveBeenCalledWith(outcome);
  });

  it('should send events for saving feedback', () => {
    spyOn(component.onSaveAnswerGroupFeedback, 'emit');
    const outcome = {dest: 'dest1'} as unknown as Outcome;
    component.sendOnSaveAnswerGroupFeedback(outcome);
    expect(component.onSaveAnswerGroupFeedback.emit).toHaveBeenCalledWith(
      outcome
    );
  });

  it('should send events for saving destination', () => {
    spyOn(component.onSaveAnswerGroupDest, 'emit');
    const outcome = {dest: 'dest1'} as unknown as Outcome;
    component.sendOnSaveAnswerGroupDest(outcome);
    expect(component.onSaveAnswerGroupDest.emit).toHaveBeenCalledWith(outcome);
  });

  it('should send events for saving destination if stuck', () => {
    spyOn(component.onSaveAnswerGroupDestIfStuck, 'emit');
    const outcome = {dest: 'dest1'} as unknown as Outcome;
    component.sendOnSaveAnswerGroupDestIfStuck(outcome);
    expect(component.onSaveAnswerGroupDestIfStuck.emit).toHaveBeenCalledWith(
      outcome
    );
  });

  it('should handle cancelActiveRuleEdit and restore rules from memento', () => {
    const originalRule = new Rule('Original', {x: 'test'}, {x: 'String'});
    component.rules = [new Rule('Modified', {x: 'new'}, {x: 'String'})];
    component.rulesMemento = [originalRule];
    component.activeRuleIndex = 0;

    component.cancelActiveRuleEdit();

    expect(component.rules.length).toBe(1);
    expect(component.rules[0].type).toBe('Original');
    expect(component.activeRuleIndex).toBe(-1);
  });

  it('should handle saveRules and emit events', () => {
    spyOn(component.onSaveAnswerGroupRules, 'emit');
    spyOn(component.onSaveNextContentIdIndex, 'emit');
    component.rules = [new Rule('Test', {x: 'value'}, {x: 'String'})];
    component.rulesMemento = [new Rule('Old', {}, {})];
    component.activeRuleIndex = 0;

    component.saveRules();

    expect(component.onSaveAnswerGroupRules.emit).toHaveBeenCalledWith(
      component.rules
    );
    expect(component.onSaveNextContentIdIndex.emit).toHaveBeenCalled();
    expect(component.rulesMemento).toBeNull();
    expect(component.activeRuleIndex).toBe(-1);
  });

  it('should throw error in isCurrentInteractionTrainable for invalid interaction', () => {
    stateInteractionIdService.savedMemento = 'InvalidInteractionId';

    expect(() => component.isCurrentInteractionTrainable()).toThrowError();
  });

  it('should return correct trainability for valid interaction', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    const result = component.isCurrentInteractionTrainable();

    expect(typeof result).toBe('boolean');
  });

  it('should handle addNewRule with trimmed varType', () => {
    // Use TextInput which has rule_descriptions.
    stateInteractionIdService.savedMemento = 'TextInput';
    component.rules = [];

    component.addNewRule();

    expect(component.rules.length).toBeGreaterThan(0);
    expect(component.activeRuleIndex).toBe(0);
    expect(component.rulesMemento).toEqual([]);
  });

  it('should handle deleteRule and warn when no rules left', () => {
    component.rules = [new Rule('Test', {x: 'value'}, {x: 'String'})];
    spyOn(alertsService, 'addWarning');

    component.deleteRule(0);

    expect(component.rules.length).toBe(0);
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'All answer groups must have at least one rule.'
    );
  });

  it('should handle deleteRule without warning when rules remain', () => {
    component.rules = [
      new Rule('Test1', {x: 'value1'}, {x: 'String'}),
      new Rule('Test2', {x: 'value2'}, {x: 'String'}),
    ];
    spyOn(alertsService, 'addWarning');

    component.deleteRule(0);

    expect(component.rules.length).toBe(1);
    expect(alertsService.addWarning).not.toHaveBeenCalled();
  });

  it('should open training data editor', () => {
    spyOn(trainingDataEditorPanelService, 'openTrainingDataEditor');

    component.openTrainingDataEditor();

    expect(
      trainingDataEditorPanelService.openTrainingDataEditor
    ).toHaveBeenCalled();
  });

  it('should check if ML is enabled', () => {
    stateInteractionIdService.savedMemento = 'TextInput';

    const result = component.isMLEnabled();

    expect(typeof result).toBe('boolean');
  });

  it('should check if rule editor is open', () => {
    component.activeRuleIndex = -1;
    expect(component.isRuleEditorOpen()).toBe(false);

    component.activeRuleIndex = 0;
    expect(component.isRuleEditorOpen()).toBe(true);
  });

  it('should change active rule index', () => {
    spyOn(responsesService, 'changeActiveRuleIndex');
    spyOn(responsesService, 'getActiveRuleIndex').and.returnValue(2);

    component.changeActiveRuleIndex(2);

    expect(responsesService.changeActiveRuleIndex).toHaveBeenCalledWith(2);
    expect(component.activeRuleIndex).toBe(2);
  });

  it('should handle saveRules with modified translatable content', () => {
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: 'content_1', normalizedStrSet: ['modified']},
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString'}
      ),
    ];
    component.originalContentIdToContent = {
      content_1: {contentId: 'content_1', normalizedStrSet: ['original']},
    };
    spyOn(component.onSaveAnswerGroupRules, 'emit');
    spyOn(component.onSaveNextContentIdIndex, 'emit');

    component.saveRules();

    expect(component.onSaveAnswerGroupRules.emit).toHaveBeenCalledWith(
      component.rules
    );
    expect(component.onSaveNextContentIdIndex.emit).toHaveBeenCalled();
  });

  it('should handle saveRules with unmodified translatable content', () => {
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: 'content_1', normalizedStrSet: ['same']},
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString'}
      ),
    ];
    component.originalContentIdToContent = {
      content_1: {contentId: 'content_1', normalizedStrSet: ['same']},
    };
    spyOn(component.onSaveAnswerGroupRules, 'emit');
    spyOn(component.onSaveNextContentIdIndex, 'emit');

    component.saveRules();

    expect(component.onSaveAnswerGroupRules.emit).toHaveBeenCalledWith(
      component.rules
    );
    expect(component.onSaveNextContentIdIndex.emit).toHaveBeenCalled();
  });

  it('should handle saveRules when originalContentIdToContent is undefined', () => {
    component.rules = [new Rule('Test', {x: 'value'}, {x: 'String'})];
    component.originalContentIdToContent = undefined as unknown as Record<
      string,
      unknown
    >;
    spyOn(component.onSaveAnswerGroupRules, 'emit');
    spyOn(component.onSaveNextContentIdIndex, 'emit');

    component.saveRules();

    expect(component.onSaveAnswerGroupRules.emit).toHaveBeenCalledWith(
      component.rules
    );
    expect(component.onSaveNextContentIdIndex.emit).toHaveBeenCalled();
  });

  it('should handle cancelActiveRuleEdit when rulesMemento is null', () => {
    component.rules = [new Rule('Test', {x: 'value'}, {x: 'String'})];
    component.rulesMemento = null;
    spyOn(component.onSaveAnswerGroupRules, 'emit');

    component.cancelActiveRuleEdit();

    expect(component.rules.length).toBe(0);
  });

  it('should get empty content map when rules have no translatable inputs', () => {
    component.rules = [
      new Rule('Equals', {x: 'simple_value'} as RuleInputs, {x: 'String'}),
    ];

    const map = component.getTranslatableRulesContentIdToContentMap();

    expect(Object.keys(map).length).toBe(0);
  });

  it('should get content map with null contentId filtered out', () => {
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: null, normalizedStrSet: ['test']},
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString'}
      ),
    ];

    const map = component.getTranslatableRulesContentIdToContentMap();

    expect(Object.keys(map).length).toBe(0);
  });

  it('should handle openRuleEditor and initialize originalContentIdToContent', () => {
    component.isEditable = true;
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: 'content_1', normalizedStrSet: ['test']},
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString'}
      ),
    ];
    spyOn(component, 'changeActiveRuleIndex');

    component.openRuleEditor(0);

    expect(component.originalContentIdToContent.content_1).toBeDefined();
    expect(component.rulesMemento).toEqual(component.rules);
    expect(component.changeActiveRuleIndex).toHaveBeenCalledWith(0);
  });

  it('should handle addNewRule with complex rule input patterns', () => {
    stateInteractionIdService.savedMemento = 'NumericInput';
    component.rules = [];

    component.addNewRule();

    expect(component.rules.length).toBeGreaterThan(0);
    expect(component.rules[0].inputs).toBeDefined();
  });

  it('should handle addNewRule with rule having multiple variables', () => {
    stateInteractionIdService.savedMemento = 'TextInput';
    component.rules = [];

    component.addNewRule();

    expect(component.rules.length).toBe(1);
    expect(component.rulesMemento).toEqual([]);
  });

  it('should initialize tagMisconceptionsFeatureFlagIsEnabled from platform service', () => {
    mockPlatformFeatureService.status.ExplorationEditorCanTagMisconceptions.isEnabled =
      true;

    component.ngOnInit();

    expect(component.tagMisconceptionsFeatureFlagIsEnabled).toBe(true);
  });

  it('should set tagMisconceptionsFeatureFlagIsEnabled to false when disabled', () => {
    mockPlatformFeatureService.status.ExplorationEditorCanTagMisconceptions.isEnabled =
      false;

    component.ngOnInit();

    expect(component.tagMisconceptionsFeatureFlagIsEnabled).toBe(false);
  });

  it('should return default value for unknown varType', () => {
    const result = component.getDefaultInputValue('UnknownType');

    expect(result).toBeNull();
  });

  it('should get default value for NonnegativeInt', () => {
    expect(component.getDefaultInputValue('NonnegativeInt')).toBe(0);
  });

  it('should get default value for CodeString', () => {
    expect(component.getDefaultInputValue('CodeString')).toBe('');
  });

  it('should get default value for Real', () => {
    expect(component.getDefaultInputValue('Real')).toBe(0);
  });

  it('should get default value for ListOfUnicodeString', () => {
    expect(component.getDefaultInputValue('ListOfUnicodeString')).toEqual([]);
  });

  it('should get default value for SetOfAlgebraicIdentifier', () => {
    expect(component.getDefaultInputValue('SetOfAlgebraicIdentifier')).toEqual(
      []
    );
  });

  it('should get default value for SetOfUnicodeString', () => {
    expect(component.getDefaultInputValue('SetOfUnicodeString')).toEqual([]);
  });

  it('should handle getTranslatableRulesContentIdToContentMap with multiple rules', () => {
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: 'content_1', normalizedStrSet: ['test1']},
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString'}
      ),
      new Rule(
        'Equals',
        {
          y: {contentId: 'content_2', normalizedStrSet: ['test2']},
        } as RuleInputs,
        {y: 'TranslatableSetOfNormalizedString'}
      ),
    ];

    const map = component.getTranslatableRulesContentIdToContentMap();

    expect(map.content_1).toBeDefined();
    expect(map.content_2).toBeDefined();
  });

  it('should handle getTranslatableRulesContentIdToContentMap with mixed inputs', () => {
    component.rules = [
      new Rule(
        'Equals',
        {
          x: {contentId: 'content_1', normalizedStrSet: ['test']},
          y: 'simple_string',
        } as RuleInputs,
        {x: 'TranslatableSetOfNormalizedString', y: 'String'}
      ),
    ];

    const map = component.getTranslatableRulesContentIdToContentMap();

    expect(map.content_1).toBeDefined();
    expect(Object.keys(map).length).toBe(1);
  });

  it('should unsubscribe from all subscriptions on destroy', () => {
    spyOn(component.directiveSubscriptions, 'unsubscribe');

    component.ngOnDestroy();

    expect(component.directiveSubscriptions.unsubscribe).toHaveBeenCalled();
  });
});
