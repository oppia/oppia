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

import { ComponentFixture, fakeAsync, flush, TestBed, waitForAsync } from '@angular/core/testing';
import { RuleEditorComponent } from './rule-editor.component';
import { ObjectFormValidityChangeEvent } from 'app-events/app-events';
import { EventBusGroup, EventBusService } from 'app-events/event-bus.service';
import { StateInteractionIdService } from 'components/state-editor/state-editor-properties-services/state-interaction-id.service';
import { ResponsesService } from 'pages/exploration-editor-page/editor-tab/services/responses.service';
import { PopulateRuleContentIdsService } from 'pages/exploration-editor-page/services/populate-rule-content-ids.service';
import { NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';

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

describe('RuleEditorComponent', () => {
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
        PopulateRuleContentIdsService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      RuleEditorComponent);
    component = fixture.componentInstance;
    eventBusService = TestBed.inject(EventBusService);
    stateInteractionIdService = TestBed.inject(StateInteractionIdService);
    responsesService = TestBed.inject(ResponsesService);
    populateRuleContentIdsService = TestBed.inject(
      PopulateRuleContentIdsService);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should set component properties on initialization', () => {
    component.rule = {
      type: null
    };
    stateInteractionIdService.savedMemento = 'TextInput';

    expect(component.currentInteractionId).toBe(undefined);
    expect(component.editRuleForm).toEqual(undefined);

    component.ngOnInit();

    expect(component.currentInteractionId).toBe('TextInput');
    expect(component.editRuleForm).toEqual({});
  });

  it('should set change validity on form valid' +
     ' change event', () => {
    const eventBusGroup = new EventBusGroup(eventBusService);
    component.rule = {
      type: null
    };

    expect(component.isInvalid).toBe(undefined);

    component.isEditingRuleInline = true;
    component.ngOnInit();

    expect(component.isInvalid).toBe(false);

    component.modalId = Symbol();
    eventBusGroup.emit(new ObjectFormValidityChangeEvent({
      value: true, modalId: component.modalId
    }));
    component.ngAfterViewChecked();

    expect(component.isInvalid).toBe(true);
  });

  it('should change rule type when user selects' +
     ' new rule type and answer choice is present', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(
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
    component.rule = {
      type: 'Equals',
      inputTypes: { x: 'TranslatableSetOfNormalizedString' },
      inputs: {
        x: {
          contentId: null,
          normalizedStrSet: []
        }
      }
    };
    component.currentInteractionId = 'TextInput';

    component.onSelectNewRuleType('StartsWith');
    flush(10);

    expect(component.rule).toEqual({
      type: 'StartsWith',
      inputTypes: {
        x: 'TranslatableSetOfNormalizedString'
      },
      inputs: {
        x: { contentId: null, normalizedStrSet: [] }
      }
    });
  }));

  it('should change rule type when user selects' +
     ' new rule type and answer choice is not present', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices')
      .and.returnValue(undefined);
    component.rule = {
      type: 'Equals',
      inputTypes: { x: 'TranslatableSetOfNormalizedString' },
      inputs: {
        x: {
          contentId: null,
          normalizedStrSet: []
        }
      }
    };
    component.currentInteractionId = 'TextInput';

    component.onSelectNewRuleType('StartsWith');
    flush(10);

    expect(component.rule).toEqual({
      type: 'StartsWith',
      inputTypes: {
        x: 'TranslatableSetOfNormalizedString'
      },
      inputs: {
        x: { contentId: null, normalizedStrSet: [] }
      }
    });
  }));

  it('should change rule type when user selects' +
     ' new rule type and answer choice is not present', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices')
      .and.returnValue(undefined);
    component.rule = {
      type: 'MatchesExactlyWith',
      inputTypes: { x: 'AlgebraicExpression' },
      inputs: {
        x: {
          contentId: null,
          normalizedStrSet: []
        }
      }
    };
    component.currentInteractionId = 'AlgebraicExpressionInput';

    component.onSelectNewRuleType('MatchesWithGeneralForm');
    flush(10);

    expect(component.rule).toEqual({
      type: 'MatchesWithGeneralForm',
      inputTypes: {
        x: 'AlgebraicExpression',
        y: 'SetOfAlgebraicIdentifier'
      },
      inputs: {
        x: { contentId: null, normalizedStrSet: [] },
        y: []
      }
    });
  }));

  it('should cancel edit when user clicks cancel button', () => {
    spyOn(component.onCancelRuleEdit, 'emit');

    component.cancelThisEdit();

    expect(component.onCancelRuleEdit.emit).toHaveBeenCalled();
  });

  it('should save rule when user clicks save button', () => {
    spyOn(component.onSaveRule, 'emit');
    spyOn(populateRuleContentIdsService, 'populateNullRuleContentIds');

    component.saveThisRule();

    expect(component.onSaveRule.emit).toHaveBeenCalled();
    expect(populateRuleContentIdsService.populateNullRuleContentIds)
      .toHaveBeenCalled();
  });

  it('should set ruleDescriptionFragments for' +
     ' SetOfTranslatableHtmlContentIds', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    component.rule = {
      type: 'MatchesExactlyWith'
    };
    component.currentInteractionId = 'DummyInteraction1';

    component.onSelectNewRuleType('MatchesExactlyWith');
    flush();

    expect(component.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'checkboxes',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  }));

  it('should set ruleDescriptionFragments for' +
     ' ListOfSetsOfTranslatableHtmlContentIds', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    component.rule = {
      type: 'MatchesExactlyWith'
    };
    component.currentInteractionId = 'DummyInteraction2';

    component.onSelectNewRuleType('MatchesExactlyWith');
    flush();

    expect(component.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'dropdown',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  }));

  it('should set ruleDescriptionFragments for' +
     ' TranslatableHtmlContentId', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    component.rule = {
      type: 'MatchesExactlyWith'
    };
    component.currentInteractionId = 'DummyInteraction3';

    component.onSelectNewRuleType('MatchesExactlyWith');
    flush();

    expect(component.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'dragAndDropHtmlStringSelect',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  }));

  it('should set ruleDescriptionFragments for' +
     ' DragAndDropPositiveInt', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices').and.returnValue(
      [
        {
          val: 'c',
          label: '',
        }
      ]
    );
    component.rule = {
      type: 'MatchesExactlyWith'
    };
    component.currentInteractionId = 'DummyInteraction4';

    component.onSelectNewRuleType('MatchesExactlyWith');
    flush();

    expect(component.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      type: 'dragAndDropPositiveIntSelect',
      varName: 'x'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  }));

  it('should set ruleDescriptionFragments as noneditable when answer' +
     ' choices are empty', fakeAsync(() => {
    spyOn(responsesService, 'getAnswerChoices').and.returnValue([]);
    component.rule = {
      type: 'MatchesExactlyWith'
    };
    component.currentInteractionId = 'DummyInteraction4';

    component.onSelectNewRuleType('MatchesExactlyWith');
    flush();

    expect(component.ruleDescriptionFragments).toEqual([{
      text: '',
      type: 'noneditable'
    }, {
      text: ' [Error: No choices available] ',
      type: 'noneditable'
    }, {
      text: '',
      type: 'noneditable'
    }]);
  }));
});
