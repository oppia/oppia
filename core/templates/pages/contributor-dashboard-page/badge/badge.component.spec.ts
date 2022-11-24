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
 * @fileoverview Unit tests for BadgeComponent.
 */

import { ComponentFixture, fakeAsync, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BadgeComponent } from './badge.component';
import { AppConstants } from 'app.constants';

describe('Badge component', () => {
  let component: BadgeComponent;
  let fixture: ComponentFixture<BadgeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [
        BadgeComponent
      ],
      providers: [],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  }));

  afterEach(() => {
    fixture.destroy();
  });

  describe('when a submission badge is passed ', () => {
    it('should show submission badges', fakeAsync(() => {
      component.contributionSubType = AppConstants
        .CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
      component.contributionCount = 1;
      component.language = 'Hindi';

      fixture.detectChanges();

      expect(component.contributionSubTypeText).toEqual('Submission');
      expect(component.language).toEqual('Hindi');
    }));

    it('should show review badges', fakeAsync(() => {
      component.contributionSubType = AppConstants
        .CONTRIBUTION_STATS_SUBTYPE_REVIEW;
      component.contributionCount = 1;
      component.language = 'Hindi';

      fixture.detectChanges();

      expect(component.contributionSubTypeText).toEqual('Review');
      expect(component.language).toEqual('Hindi');
    }));

    it('should show correction badges', fakeAsync(() => {
      component.contributionSubType = AppConstants
        .CONTRIBUTION_STATS_SUBTYPE_CORRECTION;
      component.contributionCount = 1;
      component.language = 'Hindi';

      fixture.detectChanges();

      expect(component.contributionSubTypeText).toEqual('Correction');
      expect(component.language).toEqual('Hindi');
    }));

    it('should show the plural form of badge text', fakeAsync(() => {
      component.contributionSubType = AppConstants
        .CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
      component.contributionCount = 10;
      component.language = 'Hindi';

      fixture.detectChanges();

      expect(component.contributionSubTypeText).toEqual('Submissions');
      expect(component.language).toEqual('Hindi');
    }));
  });

  describe('when a long language text is given ', () => {
    it('should decrease the font size', fakeAsync(() => {
      component.contributionSubType = AppConstants
        .CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
      component.contributionCount = 1;
      component.language = 'Netherlands';

      fixture.detectChanges();

      expect(component.fontSize).toEqual('10px');
      expect(component.language).toEqual('Netherlands');
    }));

    it('should decrease the line height', fakeAsync(() => {
      component.contributionSubType = AppConstants
        .CONTRIBUTION_STATS_SUBTYPE_SUBMISSION;
      component.contributionCount = 1;
      component.language = 'Bahasa Indonesia';

      fixture.detectChanges();

      expect(component.fontSize).toEqual('10px');
      expect(component.lineHeight).toEqual('90%');
    }));
  });
});
