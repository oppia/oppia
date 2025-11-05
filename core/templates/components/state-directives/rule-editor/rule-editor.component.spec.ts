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

import {
  ComponentFixture,
  fakeAsync,
  flush,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {
  RuleDescriptionFragment,
  RuleEditorComponent,
} from './rule-editor.component';
import {ObjectFormValidityChangeEvent} from 'app-events/app-events';
import {EventBusGroup, EventBusService} from 'app-events/event-bus.service';
import {StateInteractionIdService} from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import {ResponsesService} from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import {PopulateRuleContentIdsService} from 'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA, Pipe} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {Rule} from 'domain/exploration/rule.model';

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

class MockChangeDetectorRef {
  detectChanges() {}
}

describe('Rule Editor Component', () => {
  let fixture: ComponentFixture<RuleEditorComponent>;
  let component: RuleEditorComponent;
  let eventBusService: EventBusService;
  let stateInteractionIdService: StateInteractionIdService;
  let responsesService: ResponsesService;
  let populateRuleContentIdsService: PopulateRuleContentIdsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        RuleEditorComponent,
        MockTruncatePipe,
        MockConvertToPlainTextPipe,
      ],
      providers: [
        EventBusService,
        StateInteractionIdService,
        ResponsesService,
        {
          provide: ChangeDetectorRef,
          useClass: MockChangeDetectorRef,
        },
        PopulateRuleContentIdsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RuleEditorComponent);
    component = fixture.componentInstance;
    eventBusService = TestBed.inject(EventBusService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    responsesService = TestBed.inject(ResponsesService);
    populateRuleContentIdsService = TestBed.inject(
      PopulateRuleContentIdsService
    );
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should intitialize properties of ListOfSetsOfTranslatableHtmlContentIds', fakeAsync(() => {
    spyOn(component, 'computeRuleDescriptionFragments').and.stub();
    component.rule = new Rule(
      'Equals',
      {
        x: [],
      },
      {
        x: 'ListOfSetsOfTranslatableHtmlContentIds',
      }
    );

    component.ruleDescriptionChoices = [
      {
        id: '1',
        val: 'data 1',
      },
      {
        id: '2',
        val: 'data 2',
      },
      {
        id: '3',
        val: 'data 3',
      },
    ];
    stateInteractionIdService.savedMemento = 'DragAndDropSortInput';

    tick();
    component.ngOnInit();

    expect(component.currentInteractionId).toBe('DragAndDropSortInput');
    expect(component.editRuleForm).toEqual({});
    expect(component.rule.inputs.x).toEqual([
      ['data 1'],
      ['data 2'],
      ['data 3'],
    ]);
  }));

  it('should intitialize properties of TranslatableHtmlContentId', fakeAsync(() => {
    component.rule = new Rule(
      'HasElementXAtPositionY',
      {
        x: '',
        y: 1,
      },
      {
        x: 'TranslatableHtmlContentId',
        y: 'DragAndDropPositiveInt',
      }
    );

    component.ruleDescriptionChoices = [
      {
        id: '1',
        val: 'data 1',
      },
    ];
    stateInteractionIdService.savedMemento = 'DragAndDropSortInput';

    tick();
    component.ngOnInit();

    expect(component.currentInteractionId).toBe('DragAndDropSortInput');
    expect(component.rule.inputs.x).toEqual('data 1');
    flush();
  }));

  it('should set component properties on initialization', () => {
    component.rule = new Rule('', {}, {});

    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.currentInteractionId).toBeUndefined();
    expect(component.editRuleForm).toEqual(undefined);

    component.ngOnInit();

    expect(component.currentInteractionId).toBe('TextInput');
    expect(component.editRuleForm).toEqual({});
  });

  it(
    'should set change validity on form valid' + ' change event',
    fakeAsync(() => {
      const eventBusGroup = new EventBusGroup(eventBusService);
      component.rule = new Rule('', {}, {});

      expect(component.isInvalid).toBe(undefined);

      component.isEditingRuleInline = true;
      component.ngOnInit();

      expect(component.isInvalid).toBe(false);

      component.modalId = Symbol();
      eventBusGroup.emit(
        new ObjectFormValidityChangeEvent({
          value: true,
          modalId: component.modalId,
        })
      );
      tick();
      component.ngAfterViewChecked();

      expect(component.isInvalid).toBe(true);
    })
  );

  it(
    'should change rule type when user selects' +
      ' new rule type and answer choice is present 1',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue([
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
      ]);
      component.rule = new Rule(
        'Equals',
        {x: 'c'},
        {
          x: 'TranslatableSetOfNormalizedString',
        }
      );

      component.currentInteractionId = 'TextInput';

      component.onSelectNewRuleType('StartsWith');
      flush(10);
      tick();

      expect(component.rule).toEqual(
        new Rule(
          'StartsWith',
          {x: 'c'},
          {
            x: 'TranslatableSetOfNormalizedString',
          }
        )
      );
    })
  );

  it(
    'should change rule type when user selects' +
      ' new rule type and answer choice is not present',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue(undefined);
      let componentRule = new Rule(
        'Equals',
        {x: 'TranslatableSetOfNormalizedString'},
        {}
      );

      component.rule = componentRule;
      component.currentInteractionId = 'TextInput';

      component.onSelectNewRuleType('StartsWith');
      flush(10);

      expect(component.rule).toEqual(componentRule);
    })
  );

  it(
    'should change rule type when user selects' +
      ' new rule type and answer choice is not present 2',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue(undefined);
      component.rule = new Rule(
        'MatchesExactlyWith',
        {x: 'AlgebraicExpression'},
        {
          x: 'AlgebraicExpression',
        }
      );
      component.rule.inputs = {
        x: 'AlgebraicExpression',
      };
      component.rule.inputTypes = {
        x: 'AlgebraicExpression',
      };

      component.currentInteractionId = 'AlgebraicExpressionInput';

      component.onSelectNewRuleType('MatchesExactlyWith');
      flush(10);

      expect(component.rule).toEqual(
        new Rule(
          'MatchesExactlyWith',
          {x: 'AlgebraicExpression'},
          {x: 'AlgebraicExpression'}
        )
      );
    })
  );

  it('should cancel edit when user clicks cancel button', () => {
    const item = {
      type: '',
      varName: 'varName',
    };

    component.rule = new Rule('', {varName: 2}, {});

    spyOn(component.onCancelRuleEdit, 'emit');

    component.cancelThisEdit();
    component.onSelectionChangeHtmlSelect(1, item);

    expect(component.onCancelRuleEdit.emit).toHaveBeenCalled();
  });

  it('should save rule when user clicks save button', () => {
    component.rule = new Rule('', {}, {});

    spyOn(component.onSaveRule, 'emit').and.stub();
    spyOn(
      populateRuleContentIdsService,
      'populateNullRuleContentIds'
    ).and.stub();

    component.saveThisRule();

    expect(component.onSaveRule.emit).toHaveBeenCalled();
    expect(
      populateRuleContentIdsService.populateNullRuleContentIds
    ).toHaveBeenCalled();
  });

  it(
    'should set ruleDescriptionFragments for' +
      ' SetOfTranslatableHtmlContentIds',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue([
        {
          val: 'c',
          label: '',
        },
      ]);
      component.rule = new Rule('Equals', {}, {});

      component.currentInteractionId = 'ItemSelectionInput';

      component.onSelectNewRuleType('Equals');
      flush();

      expect(component.ruleDescriptionFragments).toEqual([
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
        {
          type: 'checkboxes',
          varName: 'x',
          text: '',
        },
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
      ] as RuleDescriptionFragment[]);
    })
  );

  it(
    'should set ruleDescriptionFragments for' +
      ' ListOfSetsOfTranslatableHtmlContentIds',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue([
        {
          val: 'c',
          label: '',
        },
      ]);

      component.rule = new Rule(
        'IsEqualToOrderingWithOneItemAtIncorrectPosition',
        {},
        {}
      );

      component.currentInteractionId = 'DragAndDropSortInput';

      component.onSelectNewRuleType(
        'IsEqualToOrderingWithOneItemAtIncorrectPosition'
      );
      flush();

      expect(component.ruleDescriptionFragments).toEqual([
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
        {
          type: 'dropdown',
          varName: 'x',
          text: '',
        },
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
      ] as RuleDescriptionFragment[]);
    })
  );

  it(
    'should set ruleDescriptionFragments for' + ' TranslatableHtmlContentId',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue([
        {
          val: 'c',
          label: '',
        },
      ]);
      component.rule = new Rule('IsEqualToOrdering', {}, {});

      component.currentInteractionId = 'DragAndDropSortInput';
      component.onSelectNewRuleType('IsEqualToOrdering');
      flush();

      expect(component.ruleDescriptionFragments).toEqual([
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
        {
          type: 'dropdown',
          varName: 'x',
          text: '',
        },
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
      ] as RuleDescriptionFragment[]);
    })
  );

  it(
    'should set ruleDescriptionFragments for' + ' DragAndDropPositiveInt',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue([
        {
          val: 'c',
          label: '',
        },
      ]);
      component.rule = new Rule('HasElementXAtPositionY', {}, {});
      component.currentInteractionId = 'DragAndDropSortInput';

      component.onSelectNewRuleType('HasElementXAtPositionY');
      flush();

      expect(component.ruleDescriptionFragments.length).toEqual(5);
    })
  );

  it(
    'should set ruleDescriptionFragments as noneditable when answer' +
      ' choices are empty',
    fakeAsync(() => {
      spyOn(responsesService, 'getAnswerChoices').and.returnValue([]);
      component.rule = new Rule('MatchesExactlyWith', {}, {});
      component.currentInteractionId = 'AlgebraicExpressionInput';

      component.onSelectNewRuleType('MatchesExactlyWith');
      flush();

      expect(component.ruleDescriptionFragments).toEqual([
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
        {
          text: ' [Error: No choices available] ',
          type: 'noneditable',
          varName: '',
        },
        {
          text: '',
          type: 'noneditable',
          varName: '',
        },
      ] as RuleDescriptionFragment[]);
    })
  );

  it('should handle onSelectionChangeHtmlSelect', () => {
    component.rule = new Rule('Equals', {x: 1}, {x: 'Int'});
    const item = {type: 'select', varName: 'x'};

    component.onSelectionChangeHtmlSelect(5, item);

    expect(component.rule.inputs.x).toBe(5);
  });

  it('should handle cancelThisEdit', () => {
    spyOn(component.onCancelRuleEdit, 'emit');

    component.cancelThisEdit();

    expect(component.onCancelRuleEdit.emit).toHaveBeenCalled();
  });

  it('should handle saveThisRule', () => {
    component.rule = new Rule('Equals', {x: 'test'}, {x: 'UnicodeString'});
    spyOn(populateRuleContentIdsService, 'populateNullRuleContentIds');
    spyOn(component.onSaveRule, 'emit');

    component.saveThisRule();

    expect(
      populateRuleContentIdsService.populateNullRuleContentIds
    ).toHaveBeenCalledWith(component.rule);
    expect(component.onSaveRule.emit).toHaveBeenCalled();
  });

  it('should compute rule description fragments when rule type is empty', () => {
    component.rule = new Rule('', {}, {});
    component.currentInteractionId = 'TextInput';

    const result = component.computeRuleDescriptionFragments();

    expect(result).toBe('');
    expect(component.ruleDescriptionFragments).toEqual([]);
  });
});
