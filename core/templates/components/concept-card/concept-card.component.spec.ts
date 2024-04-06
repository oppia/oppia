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

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {RecordedVoiceovers} from 'domain/exploration/recorded-voiceovers.model';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {ConceptCardBackendApiService} from 'domain/skill/concept-card-backend-api.service';
import {ConceptCard} from 'domain/skill/concept-card.model';
import {WorkedExample} from 'domain/skill/worked-example.model';
import {ConceptCardComponent} from './concept-card.component';

describe('Concept card component', () => {
  let fixture: ComponentFixture<ConceptCardComponent>;
  let componentInstance: ConceptCardComponent;
  let conceptCardBackendApiService: ConceptCardBackendApiService;
  let conceptCard = new ConceptCard(
    new SubtitledHtml('', '1'),
    [new WorkedExample({} as SubtitledHtml, {} as SubtitledHtml)],
    RecordedVoiceovers.createEmpty()
  );
  let conceptCardObjects = [conceptCard];

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ConceptCardComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConceptCardComponent);
    componentInstance = fixture.componentInstance;
    conceptCardBackendApiService = TestBed.inject(ConceptCardBackendApiService);
  });

  it('should initialize and load concept cards successfully', fakeAsync(() => {
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.resolve(conceptCardObjects));
    componentInstance.index = 0;

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.loadingMessage).toEqual('');
    expect(componentInstance.currentConceptCard).toEqual(conceptCard);
  }));

  it('should initialize and handle error if fails to load concept cards', fakeAsync(() => {
    spyOn(
      conceptCardBackendApiService,
      'loadConceptCardsAsync'
    ).and.returnValue(Promise.reject({}));

    componentInstance.ngOnInit();
    tick();

    expect(componentInstance.loadingMessage).toEqual('');
    expect(componentInstance.skillDeletedMessage).toEqual(
      'Oops, it looks like this skill has been deleted.'
    );
  }));

  it('should tell if work example is last', () => {
    componentInstance.numberOfWorkedExamplesShown = 1;
    componentInstance.currentConceptCard = conceptCard;

    expect(componentInstance.isLastWorkedExample()).toBeTrue();
  });

  it('should show more worked examples', () => {
    let numberOfWorkedExamplesShown = 1;

    componentInstance.numberOfWorkedExamplesShown = numberOfWorkedExamplesShown;
    componentInstance.showMoreWorkedExamples();

    expect(componentInstance.explanationIsShown).toBeFalse();
    expect(componentInstance.numberOfWorkedExamplesShown).toEqual(
      numberOfWorkedExamplesShown + 1
    );
  });
});
