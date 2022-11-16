// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for QuestionBadgeComponent.
 */

import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AppConstants } from 'app.constants';
import { QuestionBadgeComponent } from './question-badge.component';

describe('Question badge component', () => {
  let component: QuestionBadgeComponent;
  let fixture: ComponentFixture<QuestionBadgeComponent>;
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        QuestionBadgeComponent
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));
  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(QuestionBadgeComponent);
    component = fixture.componentInstance;
    component.isUnlocked = true;
    component.type = AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;

    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when a submission badge is passed ', () => {
    it('should show submission badges', fakeAsync(() => {
      component.type = AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
      component.contributionCount = 1;

      component.ngOnInit();

      expect(component.contributionTypeText).toEqual('Submission');
    }));

    it('should show review badges', fakeAsync(() => {
      component.type = AppConstants.CONTRIBUTION_STATS_SUBTYPE_REVIEW;
      component.contributionCount = 1;

      component.ngOnInit();

      expect(component.contributionTypeText).toEqual('Review');
    }));

    it('should show correction badges', fakeAsync(() => {
      component.type = AppConstants.CONTRIBUTION_STATS_SUBTYPE_CORRECTION;
      component.contributionCount = 1;

      component.ngOnInit();

      expect(component.contributionTypeText).toEqual('Correction');
    }));

    it('should show multiple badges', fakeAsync(() => {
      component.type = AppConstants.CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
      component.contributionCount = 10;

      component.ngOnInit();

      expect(component.contributionTypeText).toEqual('Submissions');
    }));
  });

  describe('when an invalid type is passed ', () => {
    it('should throw an error', fakeAsync(() => {
      component.type = 'invalid';

      expect(() => {
        component.ngOnInit();
        tick();
      }).toThrowError();
      flush();
    }));
  });
});
