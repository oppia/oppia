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
import {PlatformFeedbackDetailResponse} from 'domain/feedback/feedback.model';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TechnicalFeedbackDashboardPageComponent} from './technical-feedback-dashboard-page.component';

describe('TechnicalFeedbackDashboardPageComponent', () => {
  let component: TechnicalFeedbackDashboardPageComponent;
  let fixture: ComponentFixture<TechnicalFeedbackDashboardPageComponent>;
  let feedbackBackendApiService: jasmine.SpyObj<FeedbackBackendApiService>;
  let platformFeedbackDetailResponse: PlatformFeedbackDetailResponse;

  beforeEach(async () => {
    platformFeedbackDetailResponse = {
      id: 'report_id',
      report_message: 'The card image is broken.',
      source: 'lesson',
      status: 'open',
      platform: 'web',
      destination_dashboard: 'LEAP',
      page_url: 'https://www.oppia.org/explore/exp_id',
      category: 'broken_layout_or_image',
      lesson_metadata_json: {
        exploration_id: 'exp_id',
        exploration_version: 1,
        state_name: 'Introduction',
        state_index: 0,
        learner_current_answer: null,
      },
      include_technical_logs: false,
      session_info: null,
      screenshot_filename: null,
      screenshot_entity_id: null,
      created_on_msecs: 1000,
    };
    feedbackBackendApiService = jasmine.createSpyObj(
      'FeedbackBackendApiService',
      [
        'fetchPlatformFeedbackListAsync',
        'fetchPlatformFeedbackDetailAsync',
        'updatePlatformFeedbackStatusAsync',
      ]
    );
    feedbackBackendApiService.fetchPlatformFeedbackListAsync.and.resolveTo({
      results: [],
      cursor: null,
      more: false,
    });
    feedbackBackendApiService.fetchPlatformFeedbackDetailAsync.and.resolveTo(
      platformFeedbackDetailResponse
    );
    feedbackBackendApiService.updatePlatformFeedbackStatusAsync.and.resolveTo({
      success: true,
    });

    await TestBed.configureTestingModule({
      declarations: [
        TechnicalFeedbackDashboardPageComponent,
        MockTranslatePipe,
      ],
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

  it('should fetch platform feedback list for LEAP team', async () => {
    await component.fetchListButton();

    expect(
      feedbackBackendApiService.fetchPlatformFeedbackListAsync
    ).toHaveBeenCalledWith('technical', 'LEAP', null, null, null, null);
  });

  it('should fetch platform feedback detail for LEAP team', async () => {
    await component.getDetailedViewButton();

    expect(
      feedbackBackendApiService.fetchPlatformFeedbackDetailAsync
    ).toHaveBeenCalledWith('technical', 'LEAP', '');
  });

  it('should update platform feedback status for LEAP team', async () => {
    await component.updateStatusButton();

    expect(
      feedbackBackendApiService.updatePlatformFeedbackStatusAsync
    ).toHaveBeenCalledWith('technical', 'LEAP', '', 'fixed');
  });
});
