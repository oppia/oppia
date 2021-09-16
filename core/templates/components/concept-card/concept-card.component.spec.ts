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
 * @fileoverview Unit test for Concept Card Component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { WorkedExample } from 'domain/skill/WorkedExampleObjectFactory';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ConceptCardComponent } from './concept-card.component';

describe('ConceptCardComponent', () => {
  let loadConceptCardsAsync: jasmine.Spy;
  let fixture: ComponentFixture<ConceptCardComponent>;
  let component: ConceptCardComponent;
  let conceptCard: ConceptCard;
  let example1: WorkedExample;
  let example2: WorkedExample;
  let workedExamples: WorkedExample[];

  example1 = new WorkedExample(new SubtitledHtml(
    'worked example question 1',
    'worked_example_q_1'
  ), new SubtitledHtml(
    'worked example explanation 1',
    'worked_example_e_1'
  ));

  example2 = new WorkedExample(new SubtitledHtml(
    'worked example question 2',
    'worked_example_q_2'
  ), new SubtitledHtml(
    'worked example explanation 2',
    'worked_example_e_2'
  ));
  workedExamples = [example1, example2],

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ConceptCardComponent,
        MockTranslatePipe
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptCardComponent);
    conceptCard = TestBed.inject(ConceptCard);
    component = fixture.componentInstance;
  });

  it('should load concept cards', () => {
    component.index = 0;
    loadConceptCardsAsync.and.resolveTo([{
      getWorkedExamples: () => {
        return ['1'];
      }
    }]);

    spyOn(conceptCard, 'getWorkedExamples').and.returnValue(workedExamples);
    component.ngOnInit();

    expect(
      component.currentConceptCard.getWorkedExamples()).toEqual(workedExamples);
    expect(component.numberOfWorkedExamplesShown).toBe(1);
  });

  it('should show error message when adding concept card to' +
    ' a deleted skill', () => {
    loadConceptCardsAsync.and.returnValue(Promise.reject(''));

    component.ngOnInit();

    expect(component.skillDeletedMessage).toBe(
      'Oops, it looks like this skill has been deleted.');
  });

  it('should show more worked examples when user clicks on \'+ Worked ' +
    'Examples\'', () => {
    component.explanationIsShown = true;
    component.numberOfWorkedExamplesShown = 2;

    component.showMoreWorkedExamples();

    expect(component.explanationIsShown).toBe(false);
    expect(component.numberOfWorkedExamplesShown).toBe(3);
  });

  it('should check if worked example is the last one', () => {
    spyOn(conceptCard, 'getWorkedExamples').and.returnValue(workedExamples);

    component.numberOfWorkedExamplesShown = 1;

    expect(component.isLastWorkedExample()).toBe(true);

    component.numberOfWorkedExamplesShown = 2;

    expect(component.isLastWorkedExample()).toBe(false);
  });
});
