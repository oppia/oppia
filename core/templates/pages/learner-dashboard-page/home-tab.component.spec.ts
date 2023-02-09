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
 * @fileoverview Unit tests for for HomeTabComponent.
 */

import { async, ComponentFixture, TestBed } from
  '@angular/core/testing';
import { AppConstants } from 'app.constants';
import { MaterialModule } from 'modules/material.module';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HomeTabComponent } from './home-tab.component';
import { EventEmitter, NO_ERRORS_SCHEMA } from '@angular/core';
import { LearnerTopicSummary } from 'domain/topic/learner-topic-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

describe('Home tab Component', () => {
  let component: HomeTabComponent;
  let fixture: ComponentFixture<HomeTabComponent>;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let mockResizeEmitter: EventEmitter<void>;

  beforeEach(async(() => {
    mockResizeEmitter = new EventEmitter();
    TestBed.configureTestingModule({
      imports: [
        MaterialModule,
        FormsModule,
        HttpClientTestingModule
      ],
      declarations: [
        MockTranslatePipe,
        HomeTabComponent
      ],
      providers: [
        UrlInterpolationService,
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => mockResizeEmitter,
          }
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeTabComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
    let subtopic = {
      skill_ids: ['skill_id_2'],
      id: 1,
      title: 'subtopic_name',
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#F8BF74',
      url_fragment: 'subtopic-name'
    };

    let nodeDict = {
      id: 'node_1',
      thumbnail_filename: 'image.png',
      title: 'Title 1',
      description: 'Description 1',
      prerequisite_skill_ids: ['skill_1'],
      acquired_skill_ids: ['skill_2'],
      destination_node_ids: ['node_2'],
      outline: 'Outline',
      exploration_id: null,
      outline_is_finalized: false,
      thumbnail_bg_color: '#a33f40'
    };
    const learnerTopicSummaryBackendDict1 = {
      id: 'sample_topic_id',
      name: 'Topic Name',
      language_code: 'en',
      description: 'description',
      version: 1,
      story_titles: ['Story 1'],
      total_published_node_count: 2,
      thumbnail_filename: 'image.svg',
      thumbnail_bg_color: '#C6DCDA',
      classroom: 'math',
      practice_tab_is_displayed: false,
      canonical_story_summary_dict: [{
        id: '0',
        title: 'Story Title',
        description: 'Story Description',
        node_titles: ['Chapter 1'],
        thumbnail_filename: 'image.svg',
        thumbnail_bg_color: '#F8BF74',
        story_is_published: true,
        completed_node_titles: ['Chapter 1'],
        url_fragment: 'story-title',
        all_node_dicts: [nodeDict]
      }],
      url_fragment: 'topic-name',
      subtopics: [subtopic],
      degrees_of_mastery: {
        skill_id_1: 0.5,
        skill_id_2: 0.3
      },
      skill_descriptions: {
        skill_id_1: 'Skill Description 1',
        skill_id_2: 'Skill Description 2'
      }
    };
    component.currentGoals = [LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1)];
    component.goalTopics = [LearnerTopicSummary.createFromBackendDict(
      learnerTopicSummaryBackendDict1)];
    component.partiallyLearntTopicsList = [];
    component.untrackedTopics = {};
    component.username = 'username';
    fixture.detectChanges();
  });

  it('should get the correct width in mobile view', () => {
    component.ngOnInit();
    expect(component.width).toEqual(233);
    expect(component.windowIsNarrow).toBeTrue();
  });

  it('should check whether window is narrow on resizing the screen', () => {
    spyOn(windowDimensionsService, 'isWindowNarrow').and.returnValue(false);
    expect(component.windowIsNarrow).toBeTrue();

    mockResizeEmitter.emit();

    expect(component.windowIsNarrow).toBeFalse();
  });

  it('should get time of day as morning', () => {
    var baseTime = new Date();
    baseTime.setHours(11);
    jasmine.clock().mockDate(baseTime);

    expect(component.getTimeOfDay())
      .toEqual('I18N_LEARNER_DASHBOARD_MORNING_GREETING');
  });

  it('should get time of day as afternoon', () => {
    var baseTime = new Date();
    baseTime.setHours(15);
    jasmine.clock().mockDate(baseTime);

    expect(component.getTimeOfDay())
      .toEqual('I18N_LEARNER_DASHBOARD_AFTERNOON_GREETING');
  });

  it('should get time of day as evening', () => {
    var baseTime = new Date();
    baseTime.setHours(20);
    jasmine.clock().mockDate(baseTime);

    expect(component.getTimeOfDay())
      .toEqual('I18N_LEARNER_DASHBOARD_EVENING_GREETING');
  });

  it('should switch the tab to Goals', () => {
    const setActiveSection = spyOn(component.setActiveSection, 'emit');
    component.changeActiveSection();
    expect(setActiveSection).toHaveBeenCalled();
  });

  it('should check whether an object is non empty when calling ' +
    '\'isNonemptyObject\'', () => {
    let result = component.isNonemptyObject({});
    expect(result).toBe(false);

    result = component.isNonemptyObject({description: 'description'});
    expect(result).toBe(true);
  });

  it('should get the classroom link', () => {
    component.classroomUrlFragment = 'math';
    const urlSpy = spyOn(
      urlInterpolationService, 'interpolateUrl')
      .and.returnValue('/learn/math');
    expect(component.getClassroomLink('math')).toEqual(
      '/learn/math');
    expect(urlSpy).toHaveBeenCalled();
  });

  it('should get the correct width', () => {
    expect(component.getWidth(1)).toEqual(328);
    expect(component.getWidth(3)).toEqual(662);
  });

  it('should show empty learn something new tab' +
    '\'when goal selection limit is reached\'', () => {
    component.currentGoalsLength = AppConstants.MAX_CURRENT_GOALS_COUNT;

    expect(component.isGoalLimitReached()).toBeTrue();

    component.currentGoalsLength = 2;
    component.goalTopicsLength = 2;
    expect(component.isGoalLimitReached()).toBeTrue();
  });

  it('should not show empty learn something new tab' +
    '\'when goal selection limit is not reached\'', () => {
    component.goalTopicsLength = 0;
    expect(component.isGoalLimitReached()).toBeFalse();
  });

  it('should not show empty learn something new tab' +
    '\'when goal selection limit is reached and goal selection limit' +
    ' is not reached\'', () => {
    component.goalTopicsLength = 2;
    component.currentGoalsLength = 0;
    component.goalTopicsLength = 3;
    expect(component.isGoalLimitReached()).toBeFalse();
  });
});
