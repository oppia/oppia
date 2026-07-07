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

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FeedbackBackendApiService} from 'domain/feedback/feedback-backend-api.service';
import {TechnicalFeedbackDashboardPageComponent} from './technical-feedback-dashboard-page.component';

describe('TechnicalFeedbackDashboardPageComponent', () => {
  let component: TechnicalFeedbackDashboardPageComponent;
  let fixture: ComponentFixture<TechnicalFeedbackDashboardPageComponent>;
  let feedbackBackendApiService: jasmine.SpyObj<FeedbackBackendApiService>;

  beforeEach(async () => {
    feedbackBackendApiService = jasmine.createSpyObj(
      'FeedbackBackendApiService',
      ['fetchPlatformFeedbackModelThreadsAsync']
    );
    feedbackBackendApiService.fetchPlatformFeedbackModelThreadsAsync.and.resolveTo(
      {
        results: [],
        cursor: null,
        more: false,
      }
    );

    await TestBed.configureTestingModule({
      declarations: [TechnicalFeedbackDashboardPageComponent],
      providers: [
        {
          provide: FeedbackBackendApiService,
          useValue: feedbackBackendApiService,
        },
      ],
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

  it('should fetch and log platform feedback threads on init', async () => {
    const consoleLogSpy = spyOn(console, 'log');

    await component.ngOnInit();

    expect(
      feedbackBackendApiService.fetchPlatformFeedbackModelThreadsAsync
    ).toHaveBeenCalledWith('LEAP', 'team', null, null, null, null);
    expect(consoleLogSpy).toHaveBeenCalledWith({
      results: [],
      cursor: null,
      more: false,
    });
  });
});
