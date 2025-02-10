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
import {Rule} from 'domain/exploration/rule.model';
import {ParameterizeRuleDescriptionPipe} from 'filters/parameterize-rule-description.pipe';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {TrainingDataEditorPanelService} from 'pages/exploration-editor-page/editor-tab/training-panel/training-data-editor-panel.service';
import {AlertsService} from 'services/alerts.service';
import {ExternalSaveService} from 'services/external-save.service';
import {AnswerGroupEditor} from './answer-group-editor.component';
import {PlatformFeatureService} from 'services/platform-feature.service';

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

    expect(component.rulesMemento).toBe(undefined);
    expect(component.activeRuleIndex).toBe(undefined);
    expect(component.editAnswerGroupForm).toBe(undefined);
    expect(component.answerChoices).toEqual(undefined);

    component.ngOnInit();

    expect(component.rulesMemento).toBe(null);
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
      component.sendOnSaveTaggedMisconception(null);
      component.sendOnSaveAnswerGroupCorrectnessLabel(null);
      component.sendOnSaveAnswerGroupFeedback(null);

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
      component.sendOnSaveAnswerGroupDest(null);
      component.sendOnSaveAnswerGroupDestIfStuck(null);

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

    expect(component.openRuleEditor(null)).toBe(undefined);
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

    component.openRuleEditor(null);

    expect(component.rulesMemento).toEqual([rule1]);
    expect(component.changeActiveRuleIndex).toHaveBeenCalled();
  });
});
