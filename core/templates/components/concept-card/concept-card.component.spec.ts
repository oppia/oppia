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
import { ConceptCardObjectFactory } from 'domain/skill/ConceptCardObjectFactory';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ConceptCardComponent } from './concept-card.component';

describe('ConceptCardComponent', () => {
  let loadConceptCardsAsync: jasmine.Spy;
  let fixture: ComponentFixture<ConceptCardComponent>;
  let component: ConceptCardComponent;
  let conceptCardObjectFactory: ConceptCardObjectFactory;

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
    conceptCardObjectFactory = TestBed.inject(ConceptCardObjectFactory);
    component = fixture.componentInstance;
  });

  it('should load concept cards', () => {
    component.index = 0;
    loadConceptCardsAsync.and.resolveTo([{
      getWorkedExamples: () => {
        return ['1'];
      }
    }]);

    spyOn(conceptCardObjectFactory, 'getWorkedExamples').and.returnValue(['1']);
    component.ngOnInit();
    component.conceptCards = [{
      getWorkedExamples: () => {
        return ['1'];
      }
    }];

    expect(component.currentConceptCard.getWorkedExamples()).toEqual(['1']);
    expect(component.numberOfWorkedExamplesShown).toBe(1);
  });

  it('should show error message when adding concept card to' +
    ' a deleted skill', () => {
    loadConceptCardsAsync.and.returnValue($q.reject(''));
    spyOn($scope, '$watch').and.stub();

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
    component.currentConceptCard = {
      getWorkedExamples: () => {
        return ['1'];
      }
    };
    component.numberOfWorkedExamplesShown = 1;

    expect(component.isLastWorkedExample()).toBe(true);

    component.numberOfWorkedExamplesShown = 2;

    expect(component.isLastWorkedExample()).toBe(false);
  });
});
