// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for the controller of the 'Completion Graph' used by
 * the improvements tab.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NeedsGuidingResponsesTask } from 'domain/improvements/needs-guiding-response-task.model';
import { SupportingStateStats } from 'services/exploration-improvements-task-registry.service';
import { RouterService } from '../services/router.service';
import { NeedsGuidingResponsesTaskComponent } from './needs-guiding-responses-task.component';

describe('NeedsGuidingResponsesTask component', function() {
  let component: NeedsGuidingResponsesTaskComponent;
  let fixture: ComponentFixture<NeedsGuidingResponsesTaskComponent>;
  let routerService: RouterService;
  const stateName = 'Introduction';
  const totalAnswersCount = 50;
  let task = {targetId: stateName};
  let stats = {
    answerStats: [],
    stateStats: {
      totalAnswersCount,
      usefulFeedbackCount: null,
      totalHitCount: null,
      firstHitCount: null,
      numTimesSolutionViewed: null,
      numCompletions: null
    },
    cstPlaythroughIssues: null,
    eqPlaythroughIssues: null,
    misPlaythroughIssues: null
  } as SupportingStateStats;

  class MockNgbModal {
    open() {
      return {
        result: Promise.resolve()
      };
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
      ],
      declarations: [
        NeedsGuidingResponsesTaskComponent
      ],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      NeedsGuidingResponsesTaskComponent);
    component = fixture.componentInstance;

    routerService = TestBed.inject(RouterService);

    component.task = task as NeedsGuidingResponsesTask;
    component.stats = stats as SupportingStateStats;
    component.ngOnInit();
  });

  it('should configure sorted tiles viz based on input task and stats', () => {
    expect(component.sortedTilesData).toEqual(stats.answerStats);
    expect(component.sortedTilesOptions)
      .toEqual({header: '', use_percentages: true});
    expect(component.sortedTilesTotalFrequency).toEqual(totalAnswersCount);
  });

  it('should use router service to navigate to state editor', () => {
    const navigateSpy = spyOn(routerService, 'navigateToMainTab');

    component.navigateToStateEditor();

    expect(navigateSpy).toHaveBeenCalledWith(stateName);
  });
});
