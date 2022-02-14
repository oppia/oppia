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

import { EventEmitter } from '@angular/core';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';
import { Rule } from 'domain/exploration/RuleObjectFactory';

describe('AnswerGroupEditorComponent', () => {
  let ctrl = null;
  let $rootScope = null;
  let $scope = null;

  let ExternalSaveService = null;
  let StateEditorService = null;
  let StateInteractionIdService = null;
  let ResponsesService = null;
  let AlertsService = null;
  let TrainingDataEditorPanelService = null;

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

  beforeEach(angular.mock.module('oppia'));
  importAllAngularServices();

  afterEach(() => {
    ctrl.$onDestroy();
  });

  beforeEach(angular.mock.module('oppia', function($provide) {
    $provide.constant('INTERACTION_SPECS', {
      TextInput: {
        is_linear: false,
        is_terminal: false,
        is_trainable: true,
        rule_descriptions: {
          StartsWith: 'starts with at least one of' +
          ' {{x|TranslatableSetOfNormalizedString}}',
          Contains: 'contains at least one of' +
          ' {{x|TranslatableSetOfNormalizedString}}',
          Equals: 'is equal to at least one of ' +
          '{{x|TranslatableSetOfNormalizedString}}, without ' +
          'taking case into account',
          FuzzyEquals: 'is equal to at least one of ' +
          '{{x|TranslatableSetOfNormalizedString}}, ' +
          'misspelled by at most one character'
        }
      },
      MultipleChoiceInput: {
        is_linear: false,
        is_terminal: false,
        is_trainable: false,
        rule_descriptions: {}
      }
    });
  }));

  beforeEach(angular.mock.inject(function($injector, $componentController) {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();

    ExternalSaveService = $injector.get('ExternalSaveService');
    StateEditorService = $injector.get('StateEditorService');
    StateInteractionIdService = $injector.get('StateInteractionIdService');
    ResponsesService = $injector.get('ResponsesService');
    AlertsService = $injector.get('AlertsService');
    TrainingDataEditorPanelService = $injector.get(
      'TrainingDataEditorPanelService');

    ctrl = $componentController('answerGroupEditor', {
      $scope: $scope
    }, {
      getOnSaveAnswerGroupRulesFn: () => {
        return () => {};
      },
      getOnSaveNextContentIdIndex: () => {
        return () => {};
      },
      showMarkAllAudioAsNeedingUpdateModalIfRequired: () => {}
    });
  }));

  it('should set component properties on initialization', () => {
    spyOn(ResponsesService, 'getActiveRuleIndex').and.returnValue(1);
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    expect(ctrl.rulesMemento).toBe(undefined);
    expect(ctrl.activeRuleIndex).toBe(undefined);
    expect(ctrl.editAnswerGroupForm).toBe(undefined);
    expect(ctrl.answerChoices).toEqual(undefined);

    ctrl.$onInit();

    expect(ctrl.rulesMemento).toBe(null);
    expect(ctrl.activeRuleIndex).toBe(1);
    expect(ctrl.editAnswerGroupForm).toEqual({});
    expect(ctrl.answerChoices).toEqual(answerChoices);
  });

  it('should save rules when current rule is valid and user' +
    ' triggers an external save', () => {
    let externalSaveEmitter = new EventEmitter();
    spyOnProperty(ExternalSaveService, 'onExternalSave').and.returnValue(
      externalSaveEmitter);
    spyOn(StateEditorService, 'checkCurrentRuleInputIsValid').and.returnValue(
      true);
    spyOn(ctrl, 'saveRules').and.stub();

    ctrl.$onInit();
    ctrl.activeRuleIndex = 1;

    externalSaveEmitter.emit();
    $scope.$apply();

    expect(ctrl.saveRules).toHaveBeenCalled();
  });

  it('should warning message when current rule is invalid and user' +
    ' triggers an external save', () => {
    let externalSaveEmitter = new EventEmitter();
    spyOnProperty(ExternalSaveService, 'onExternalSave').and.returnValue(
      externalSaveEmitter);
    spyOn(StateEditorService, 'checkCurrentRuleInputIsValid').and.returnValue(
      false);
    spyOn(AlertsService, 'addInfoMessage');

    ctrl.$onInit();
    ctrl.activeRuleIndex = 1;
    AlertsService.addMessage('info', 'Some other message', 0);

    externalSaveEmitter.emit();
    $scope.$apply();

    expect(AlertsService.addInfoMessage).toHaveBeenCalledWith(
      'There was an unsaved rule input which was invalid' +
      ' and has been discarded.'
    );
  });

  it('should get answer choices when user updates answer choices', () => {
    let updateAnswerChoicesEmitter = new EventEmitter();
    spyOnProperty(StateEditorService, 'onUpdateAnswerChoices').and.returnValue(
      updateAnswerChoicesEmitter);
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    ctrl.$onInit();
    updateAnswerChoicesEmitter.emit();
    $scope.$apply();

    expect(ctrl.answerChoices).toEqual(answerChoices);
  });

  it('should save rules and get answer choices when interaction' +
    ' is changed', () => {
    let interactionIdChangedEmitter = new EventEmitter();
    spyOnProperty(StateInteractionIdService, 'onInteractionIdChanged')
      .and.returnValue(interactionIdChangedEmitter);
    spyOn(ctrl, 'saveRules').and.stub();
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(answerChoices);

    ctrl.$onInit();
    ctrl.activeRuleIndex = 1;

    interactionIdChangedEmitter.emit();
    $scope.$apply();

    expect(ctrl.saveRules).toHaveBeenCalled();
    expect(ctrl.answerChoices).toEqual(answerChoices);
  });

  it('should check if editor is in question mode', () => {
    spyOn(StateEditorService, 'isInQuestionMode').and.returnValue(true);

    expect(ctrl.isInQuestionMode()).toBe(true);
  });

  it('should get current interaction\'s ID', () => {
    StateInteractionIdService.savedMemento = 'TextIput';

    expect(ctrl.getCurrentInteractionId()).toBe('TextIput');
  });

  it('should get default input values for different variable type', () => {
    expect(ctrl.getDefaultInputValue('Null')).toBe(null);
    expect(ctrl.getDefaultInputValue('Boolean')).toBe(false);
    expect(ctrl.getDefaultInputValue('Int')).toBe(0);
    expect(ctrl.getDefaultInputValue('PositiveInt')).toBe(1);
    expect(ctrl.getDefaultInputValue('UnicodeString')).toBe('');
    expect(ctrl.getDefaultInputValue('NormalizedString')).toBe('');
    expect(ctrl.getDefaultInputValue('MathExpressionContent')).toBe('');
    expect(ctrl.getDefaultInputValue('Html')).toBe('');
    expect(ctrl.getDefaultInputValue('SanitizedUrl')).toBe('');
    expect(ctrl.getDefaultInputValue('Filepath')).toBe('');
    expect(ctrl.getDefaultInputValue('CodeEvaluation')).toEqual({
      code: '',
      error: '',
      evaluation: '',
      output: ''
    });
    expect(ctrl.getDefaultInputValue('CoordTwoDim')).toEqual([
      0, 0
    ]);
    expect(ctrl.getDefaultInputValue('MusicPhrase')).toEqual([]);
    expect(ctrl.getDefaultInputValue('CheckedProof')).toEqual({
      assumptions_string: '',
      correct: false,
      proof_string: '',
      target_string: ''
    });
    expect(ctrl.getDefaultInputValue('Graph')).toEqual({
      edges: [],
      isDirected: false,
      isLabeled: false,
      isWeighted: false,
      vertices: []
    });
    expect(ctrl.getDefaultInputValue('NormalizedRectangle2D')).toEqual([
      [0, 0],
      [0, 0]
    ]);
    expect(ctrl.getDefaultInputValue('ImageRegion')).toEqual({
      area: [[0, 0], [0, 0]],
      regionType: ''
    });
    expect(ctrl.getDefaultInputValue('ImageWithRegions')).toEqual({
      imagePath: '',
      labeledRegions: []
    });
    expect(ctrl.getDefaultInputValue('ClickOnImage')).toEqual({
      clickPosition: [0, 0],
      clickedRegions: []
    });
    expect(ctrl.getDefaultInputValue('TranslatableSetOfNormalizedString'))
      .toEqual({
        contentId: null,
        normalizedStrSet: []
      });
    expect(ctrl.getDefaultInputValue('TranslatableSetOfUnicodeString'))
      .toEqual({
        contentId: null,
        normalizedStrSet: []
      });
  });

  it('should add new rule when user click on \'+ Add Another' +
    ' Possible Answer\'', () => {
    ctrl.rules = [];
    StateInteractionIdService.savedMemento = 'TextInput';

    ctrl.addNewRule();

    expect(ctrl.rules).toEqual([
      new Rule('StartsWith', {
        x: {
          contentId: null,
          normalizedStrSet: []
        }
      }, {
        x: 'TranslatableSetOfNormalizedString'
      })
    ]);
  });

  it('should not add rule for interaction specs without description', () => {
    StateInteractionIdService.savedMemento = 'MultipleChoiceInput';

    expect(ctrl.addNewRule()).toBe(undefined);
  });

  it('should delete rule when user clicks on delete', () => {
    ctrl.originalContentIdToContent = {
      id1: 'content'
    };
    ctrl.rules = [
      new Rule('StartsWith', {
        x: {
          contentId: 'id1',
          normalizedStrSet: []
        }
      }, {
        x: 'TranslatableSetOfNormalizedString'
      }),
      new Rule('StartsWith', {
        x: {
          contentId: 'id2',
          normalizedStrSet: []
        }
      }, {
        x: 'TranslatableSetOfNormalizedString'
      })
    ];

    ctrl.deleteRule(1);

    expect(ctrl.rules).toEqual([
      new Rule('StartsWith', {
        x: {
          contentId: 'id1',
          normalizedStrSet: []
        }
      }, {
        x: 'TranslatableSetOfNormalizedString'
      })
    ]);
  });

  it('should show warning if user deletes the only existing rule', () => {
    ctrl.rules = [
      new Rule('StartsWith', {
        x: {
          contentId: 'id1',
          normalizedStrSet: []
        }
      }, {
        x: 'TranslatableSetOfNormalizedString'
      })
    ];
    spyOn(AlertsService, 'addWarning');

    ctrl.deleteRule(0);

    expect(ctrl.rules).toEqual([]);
    expect(AlertsService.addWarning).toHaveBeenCalledWith(
      'All answer groups must have at least one rule.'
    );
  });

  it('should cancel active rule edits, when user clicks on cancel', () => {
    let rule1 = new Rule('StartsWith', {
      x: {
        contentId: 'id1',
        normalizedStrSet: []
      }
    }, {
      x: 'TranslatableSetOfNormalizedString'
    });
    let rule2 = new Rule('StartsWith', {
      x: {
        contentId: 'id2',
        normalizedStrSet: []
      }
    }, {
      x: 'TranslatableSetOfNormalizedString'
    });

    ctrl.rules = [rule1];
    ctrl.rulesMemento = [rule2];

    ctrl.cancelActiveRuleEdit();

    expect(ctrl.rules).toEqual([rule2]);
  });

  it('should check if ML is enabled', () => {
    expect(ctrl.isMLEnabled()).toBe(false);
  });

  it('should open training data editor when user click on' +
    ' \'Modify Training Data\'', () => {
    spyOn(TrainingDataEditorPanelService, 'openTrainingDataEditor');

    ctrl.openTrainingDataEditor();

    expect(TrainingDataEditorPanelService.openTrainingDataEditor)
      .toHaveBeenCalled();
  });

  it('should check if current interaction is trainable', () => {
    // We set the current interaction as TextInput, which is trainable.
    StateInteractionIdService.savedMemento = 'TextInput';

    expect(ctrl.isCurrentInteractionTrainable()).toBe(true);

    // We set the current interaction as MultipleChoiceInpit, which is not
    // trainable, according to the values provided during setup.
    StateInteractionIdService.savedMemento = 'MultipleChoiceInput';

    expect(ctrl.isCurrentInteractionTrainable()).toBe(false);

    // An error is thrown if an invalid interaction ID is passed.
    StateInteractionIdService.savedMemento = 'InvalidInteraction';
    var rulesString = '';
    for (var i = 0; i < ctrl.rules.length; i++) {
      rulesString = rulesString + ctrl.rules[i].type;
      if (i !== ctrl.rules.length - 1) {
        rulesString = rulesString + ', ';
      }
    }

    expect(() => ctrl.isCurrentInteractionTrainable())
      .toThrowError(
        'Invalid interaction id - InvalidInteraction. Answer Group rules: ' +
        rulesString);
  });

  it('should not open rule editor if it is in read-only mode', () => {
    spyOn(ctrl, 'changeActiveRuleIndex');

    ctrl.isEditable = false;

    expect(ctrl.openRuleEditor()).toBe(undefined);
    expect(ctrl.changeActiveRuleIndex).not.toHaveBeenCalled();
  });

  it('should open rule editor if it is not in read-only mode', () => {
    let rule1 = new Rule('StartsWith', {
      x: {
        contentId: 'id1',
        normalizedStrSet: []
      }
    }, {
      x: 'TranslatableSetOfNormalizedString'
    });
    ctrl.rules = [rule1];
    spyOn(ctrl, 'changeActiveRuleIndex');

    ctrl.isEditable = true;

    ctrl.openRuleEditor();

    expect(ctrl.rulesMemento).toEqual([rule1]);
    expect(ctrl.changeActiveRuleIndex).toHaveBeenCalled();
  });
});
