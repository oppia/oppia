// Copyright 2026 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for TechnicalFeedbackDashboardPageComponent.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {ActivatedRoute, Router} from '@angular/router';
import {BehaviorSubject} from 'rxjs';
import {convertToParamMap} from '@angular/router';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {FeedbackSharedModule} from 'components/feedback-shared/feedback-shared.module';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TechnicalFeedbackDashboardPageComponent} from './technical-feedback-dashboard-page.component';

class MockFeedbackBackendApiService {
  fetchTechnicalDashboardFeedbackListAsync(): Promise<{
    summaries: [];
    next_cursor: null;
    more: false;
  }> {
    return Promise.resolve({
      summaries: [],
      next_cursor: null,
      more: false,
    });
  }
}

describe('TechnicalFeedbackDashboardPageComponent', () => {
  let component: TechnicalFeedbackDashboardPageComponent;
  let fixture: ComponentFixture<TechnicalFeedbackDashboardPageComponent>;
  let paramMapSubject: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  beforeEach(async () => {
    paramMapSubject = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({
      imports: [FeedbackSharedModule],
      declarations: [
        TechnicalFeedbackDashboardPageComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: paramMapSubject.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: jasmine
              .createSpy('navigateByUrl')
              .and.returnValue(Promise.resolve(true)),
          },
        },
        {
          provide: FeedbackBackendApiService,
          useClass: MockFeedbackBackendApiService,
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TechnicalFeedbackDashboardPageComponent);
    component = fixture.componentInstance;
  });

  it('should create the component instance', () => {
    expect(component instanceof TechnicalFeedbackDashboardPageComponent).toBe(
      true
    );
  });
});
