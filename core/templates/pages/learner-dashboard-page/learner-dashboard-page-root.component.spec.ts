// Copyright 2023 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for learner dashboard page root component.
 */

import {CUSTOM_ELEMENTS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {TranslateModule} from '@ngx-translate/core';

import {AppConstants} from 'app.constants';
import {PageHeadService} from 'services/page-head.service';
import {LearnerDashboardPageRootComponent} from './learner-dashboard-page-root.component';

describe('LearnerDashboardPageRootComponent', () => {
  let fixture: ComponentFixture<LearnerDashboardPageRootComponent>;
  let component: LearnerDashboardPageRootComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot(), HttpClientTestingModule],
      declarations: [LearnerDashboardPageRootComponent],
      providers: [PageHeadService],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LearnerDashboardPageRootComponent);
    component = fixture.componentInstance;
  });

  it('should have the title and meta tags set', () => {
    expect(component.title).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_DASHBOARD.TITLE
    );
    expect(component.meta).toEqual(
      AppConstants.PAGES_REGISTERED_WITH_FRONTEND.LEARNER_DASHBOARD.META
    );
  });
});
