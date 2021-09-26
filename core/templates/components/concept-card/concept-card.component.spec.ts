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
import { NO_ERRORS_SCHEMA, SimpleChanges } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptCard } from 'domain/skill/ConceptCardObjectFactory';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ConceptCardComponent } from './concept-card.component';
import { ConceptCardBackendApiService } from 'domain/skill/concept-card-backend-api.service';

describe('ConceptCardComponent', () => {
  let fixture: ComponentFixture<ConceptCardComponent>;
  let component: ConceptCardComponent;
  let conceptBackendApiService: ConceptCardBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        ConceptCardComponent,
        MockTranslatePipe
      ],
      providers: [
        ConceptCardBackendApiService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptCardComponent);
    component = fixture.componentInstance;
    conceptBackendApiService = TestBed.inject(ConceptCardBackendApiService);
  });

  it('should load concept cards', () => {
    spyOn(conceptBackendApiService, 'loadConceptCardsAsync').and.resolveTo([{
      getWorkedExamples: () => {
        return ['1'];
      }
    }] as unknown as ConceptCard[]);
    component.index = 0;

    component.conceptCards = [{
      getWorkedExamples: () => {
        return ['1'];
      }
    }] as unknown as ConceptCard[];
    component.ngOnInit();

    expect(component.numberOfWorkedExamplesShown).toBe(0);
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
    } as unknown as ConceptCard;
    component.numberOfWorkedExamplesShown = 1;

    expect(component.isLastWorkedExample()).toBe(true);

    component.numberOfWorkedExamplesShown = 2;

    expect(component.isLastWorkedExample()).toBe(false);
  });

  it('should update concept cards when index value' +
  ' changes', () => {
    component.index = 1;
    let changes: SimpleChanges = {
      index: {
        currentValue: 0,
        previousValue: 1,
        firstChange: false,
        isFirstChange: () => false
      }
    };
    component.ngOnInit();

    component.conceptCards = [{
      getWorkedExamples: () => {
        return ['1'];
      }
    }] as unknown as ConceptCard[];

    expect(component.index).toEqual(1);

    component.ngOnChanges(changes);

    expect(component.numberOfWorkedExamplesShown).toEqual(1);
  });
});
