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
 * @fileoverview Unit tests for rule editor.
 */

import { TestBed } from '@angular/core/testing';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { importAllAngularServices } from 'tests/unit-test-utils.ajs';

describe('RuleEditorComponent', () => {
  importAllAngularServices();

  let ctrl = null;
  let $scope = null;
  let $rootScope = null;
  let $timeout = null;

  let StateInteractionIdService = null;
  let ResponsesService = null;
  let PopulateRuleContentIdsService = null;

  beforeEach(angular.mock.module('oppia'));

  const INTERACTION_SPECS = {
    TextInput: {
      rule_descriptions: {
        StartsWith: 'starts with at least one of' +
          ' {{x|TranslatableSetOfNormalizedString}}',
        Contains: 'contains at least one of' +
          ' {{x|TranslatableSetOfNormalizedString}}',
        Equals: 'is equal to at least one of' +
          ' {{x|TranslatableSetOfNormalizedString}},' +
            ' without taking case into account',
        FuzzyEquals: 'is equal to at least one of {{x|TranslatableSetOf' +
          'NormalizedString}}, misspelled by at most one character'
      }
    },
    AlgebraicExpressionInput: {
      rule_descriptions: {
        MatchesExactlyWith: 'matches exactly with {{x|AlgebraicExpression}}',
        IsEquivalentTo: 'is equivalent to {{x|AlgebraicExpression}}'
      }
    },
    DummyInteraction1: {
      rule_descriptions: {
        MatchesExactlyWith: 'matches exactly with' +
          ' {{x|SetOfTranslatableHtmlContentIds}}'
      }
    },
    DummyInteraction2: {
      rule_descriptions: {
        MatchesExactlyWith: 'matches exactly with' +
          ' {{x|ListOfSetsOfTranslatableHtmlContentIds}}'
      }
    },
    DummyInteraction3: {
      rule_descriptions: {
        MatchesExactlyWith: 'matches exactly with' +
          ' {{x|TranslatableHtmlContentId}}'
      }
    },
    DummyInteraction4: {
      rule_descriptions: {
        MatchesExactlyWith: 'matches exactly with {{x|DragAndDropPositiveInt}}'
      }
    }
  };

  beforeEach(angular.mock.inject(($injector, $componentController) => {
    $rootScope = $injector.get('$rootScope');
    $scope = $rootScope.$new();
    $timeout = $injector.get('$timeout');

    StateInteractionIdService = $injector
      .get('StateInteractionIdService');
    ResponsesService = $injector.get('ResponsesService');
    PopulateRuleContentIdsService = $injector
      .get('PopulateRuleContentIdsService');

    ctrl = $componentController('ruleEditor', {
      $scope: $scope,
      INTERACTION_SPECS: INTERACTION_SPECS
    }, {
      isEditingRuleInline: () => {
        return true;
      },
      onCancelRuleEdit: () => {},
      onSaveRule: () => {}
    });
  }));

  afterEach(() => {
    ctrl.$onDestroy();
  });

  it('should set component properties on initialization', () => {
    ctrl.rule = {
      type: null
    };
    StateInteractionIdService.savedMemento = 'TextInput';

    expect(ctrl.currentInteractionId).toBe(undefined);
    expect(ctrl.editRuleForm).toEqual(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.currentInteractionId).toBe('TextInput');
    expect(ctrl.editRuleForm).toEqual({});
  });

  it('should set change validity on form valid' +
    ' change event', () => {
    const eventBusGroup = new EventBusGroup(
      TestBed.inject(EventBusService));
    ctrl.rule = {
      type: null
    };

    expect(ctrl.isInvalid).toBe(undefined);

    ctrl.$onInit();
    $scope.$apply();

    expect(ctrl.isInvalid).toBe(false);

    ctrl.modalId = Symbol();
    eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      value: true, modalId: ctrl.modalId}));

    expect(ctrl.isInvalid).toBe(true);
  });

  it('should change rule type when user selects' +
    ' new rule type and answer choice is present', () => {
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(
      [
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
      ]
    );
    ctrl.rule = {
      type: 'Equals',
      inputTypes: {x: 'TranslatableSetOfNormalizedString'},
      inputs: {x: {
        contentId: null,
        normalizedStrSet: []
      }}
    };
    ctrl.currentInteractionId = 'TextInput';

    ctrl.onSelectNewRuleType('StartsWith');
    $timeout.flush(10);

    expect(ctrl.rule).toEqual({
      type: 'StartsWith',
      inputTypes: {
        x: 'TranslatableSetOfNormalizedString'
      },
      inputs: {
        x: {contentId: null, normalizedStrSet: []}
      }
    });
  });

  it('should change rule type when user selects' +
    ' new rule type and answer choice is not present', () => {
    spyOn(ResponsesService, 'getAnswerChoices')
      .and.returnValue(undefined);
    ctrl.rule = {
      type: 'Equals',
      inputTypes: {x: 'TranslatableSetOfNormalizedString'},
      inputs: {x: {
        contentId: null,
        normalizedStrSet: []
      }}
    };
    ctrl.currentInteractionId = 'TextInput';

    ctrl.onSelectNewRuleType('StartsWith');
    $timeout.flush(10);

    expect(ctrl.rule).toEqual({
      type: 'StartsWith',
      inputTypes: {
        x: 'TranslatableSetOfNormalizedString'
      },
      inputs: {
        x: {contentId: null, normalizedStrSet: []}
      }
    });
  });

  it('should change rule type when user selects' +
    ' new rule type and answer choice is not present', () => {
    spyOn(ResponsesService, 'getAnswerChoices')
      .and.returnValue(undefined);
    ctrl.rule = {
      type: 'MatchesExactlyWith',
      inputTypes: {x: 'AlgebraicExpression'},
      inputs: {x: {
        contentId: null,
        normalizedStrSet: []
      }}
    };
    ctrl.currentInteractionId = 'AlgebraicExpressionInput';

    ctrl.onSelectNewRuleType('IsEquivalentTo');
    $timeout.flush(10);

    expect(ctrl.rule).toEqual({
      type: 'IsEquivalentTo',
      inputTypes: {
        x: 'AlgebraicExpression'
      },
      inputs: {
        x: {contentId: null, normalizedStrSet: []},
        y: []
      }
    });
  });

  it('should cancel edit when user clicks cancel button', () => {
    spyOn(ctrl, 'onCancelRuleEdit');

    ctrl.cancelThisEdit();

    expect(ctrl.onCancelRuleEdit).toHaveBeenCalled();
  });

  it('should save rule when user clicks save button', () => {
    spyOn(ctrl, 'onSaveRule');
    spyOn(PopulateRuleContentIdsService, 'populateNullRuleContentIds');

    ctrl.saveThisRule();

    expect(ctrl.onSaveRule).toHaveBeenCalled();
    expect(PopulateRuleContentIdsService.populateNullRuleContentIds)
      .toHaveBeenCalled();
  });

  it('should set ruleDescriptionFragments for' +
    ' SetOfTranslatableHtmlContentIds', () => {
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    ctrl.rule = {
      type: 'MatchesExactlyWith'
    };
    ctrl.currentInteractionId = 'DummyInteraction1';

    ctrl.onSelectNewRuleType('MatchesExactlyWith');
    $timeout.flush();

    expect(ctrl.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'checkboxes',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  });

  it('should set ruleDescriptionFragments for' +
    ' ListOfSetsOfTranslatableHtmlContentIds', () => {
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    ctrl.rule = {
      type: 'MatchesExactlyWith'
    };
    ctrl.currentInteractionId = 'DummyInteraction2';

    ctrl.onSelectNewRuleType('MatchesExactlyWith');
    $timeout.flush();

    expect(ctrl.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'dropdown',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  });

  it('should set ruleDescriptionFragments for' +
    ' TranslatableHtmlContentId', () => {
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    ctrl.rule = {
      type: 'MatchesExactlyWith'
    };
    ctrl.currentInteractionId = 'DummyInteraction3';

    ctrl.onSelectNewRuleType('MatchesExactlyWith');
    $timeout.flush();

    expect(ctrl.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'dragAndDropHtmlStringSelect',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  });

  it('should set ruleDescriptionFragments for' +
    ' DragAndDropPositiveInt', () => {
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    ctrl.rule = {
      type: 'MatchesExactlyWith'
    };
    ctrl.currentInteractionId = 'DummyInteraction4';

    ctrl.onSelectNewRuleType('MatchesExactlyWith');
    $timeout.flush();

    expect(ctrl.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'dragAndDropPositiveIntSelect',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  });

  it('should set ruleDescriptionFragments as noneditable when answer' +
    ' choices are empty', () => {
    spyOn(ResponsesService, 'getAnswerChoices').and.returnValue([]);
    ctrl.rule = {
      type: 'MatchesExactlyWith'
    };
    ctrl.currentInteractionId = 'DummyInteraction4';

    ctrl.onSelectNewRuleType('MatchesExactlyWith');
    $timeout.flush();

    expect(ctrl.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      text: ' [Error: No choices available] ',
      type: 'noneditable'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  });
});
