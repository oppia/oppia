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
 * @fileoverview Unit tests for for ProgressTabComponent.
 */

import { async, ComponentFixture, TestBed } from
  '@angular/core/testing';
import { MaterialModule } from 'components/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { ProgressTabComponent } from './progress-tab.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { StorySummary } from 'domain/story/story-summary.model';

describe('Progress tab Component', () => {
  let component: ProgressTabComponent;
  let fixture: ComponentFixture<ProgressTabComponent>;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        MockTranslatePipe,
        ProgressTabComponent
      ],
      providers: [
        UrlInterpolationService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProgressTabComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    const sampleStorySummaryBackendDict = {
      id: '0',
      title: 'Story Title',
      description: 'Story Description',
      node_titles: ['Chapter 1'],
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      story_is_published: true,
      completed_node_titles: ['Chapter 1'],
      url_fragment: 'story-title',
      all_node_dicts: [],
      topic_name: 'Topic',
      classroom_url_fragment: 'math',
      topic_url_fragment: 'topic'
    };
    let storySummary = StorySummary.createFromBackendDict(
      sampleStorySummaryBackendDict);
    component.completedStoriesList = [storySummary];
    fixture.detectChanges();
  });

  it('should get the correct width in mobile view', () => {
    component.ngOnInit();
    expect(component.width).toEqual(233);
  });

  it('should detect when application is being used on a mobile', () => {
    expect(component.checkMobileView()).toBe(false);

    spyOnProperty(navigator, 'userAgent').and.returnValue('iPhone');
    expect(component.checkMobileView()).toBe(true);
  });

  it('should get static image url', () => {
    const urlSpy = spyOn(
      urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue('/assets/images/learner_dashboard/star.svg');

    component.getStaticImageUrl('/learner_dashboard/star.svg');
    fixture.detectChanges();

    expect(urlSpy).toHaveBeenCalled();
  });
});
