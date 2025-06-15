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
 * @fileoverview Unit tests for storiesList.
 */

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {StoriesListComponent} from './topic-viewer-stories-list.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

describe('Topic Viewer Stories List Component', () => {
  let component: StoriesListComponent;
  let fixture: ComponentFixture<StoriesListComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let windowDimensionsService: WindowDimensionsService;
  let urlInterpolationService: UrlInterpolationService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [StoriesListComponent, MockTranslatePipe],
      providers: [UrlInterpolationService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    fixture = TestBed.createComponent(StoriesListComponent);
    component = fixture.componentInstance;
    component.canonicalStorySummaries = [];
    component.classroomUrlFragment = 'classroom';
    component.topicUrlFragment = 'topic';
    component.topicName = 'Topic Name';
    component.topicDescription = 'Topic Description';
    component.topicId = 'topicId';
    component.classroomName = 'math';
    windowDimensionsService = TestBed.inject(WindowDimensionsService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true
    );
  });

  it('should initialize properties after successfully', () => {
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey').and.returnValues(
      'I18N_TOPIC_123abcd_TITLE',
      'I18N_TOPIC_123abcd_DESCRIPTION'
    );
    spyOn(
      i18nLanguageCodeService,
      'getClassroomTranslationKeys'
    ).and.returnValue({
      name: 'I18N_CLASSROOM_MATH_NAME',
      courseDetails: 'I18N_CLASSROOM_MATH_COURSE_DETAILS',
      teaserText: 'I18N_CLASSROOM_MATH_TEASER_TEXT',
      topicListIntro: 'I18N_CLASSROOM_MATH_TOPICS_LIST_INTRO',
    });

    expect(component).toBeDefined();

    component.ngOnInit();

    expect(component.topicNameTranslationKey).toBe('I18N_TOPIC_123abcd_TITLE');
    expect(component.topicDescTranslationKey).toBe(
      'I18N_TOPIC_123abcd_DESCRIPTION'
    );
    expect(component.classroomNameTranslationKey).toBe(
      'I18N_CLASSROOM_MATH_NAME'
    );
  });

  it('should check if topic name, desc translation and classroom name is displayed correctly', () => {
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey').and.returnValues(
      'I18N_TOPIC_123abcd_TITLE',
      'I18N_TOPIC_123abcd_DESCRIPTION'
    );
    spyOn(
      i18nLanguageCodeService,
      'getClassroomTranslationKeys'
    ).and.returnValue({
      name: 'I18N_CLASSROOM_MATH_NAME',
      courseDetails: 'I18N_CLASSROOM_MATH_COURSE_DETAILS',
      teaserText: 'I18N_CLASSROOM_MATH_TEASER_TEXT',
      topicListIntro: 'I18N_CLASSROOM_MATH_TOPICS_LIST_INTRO',
    });
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValues(true, true, true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValues(
      false,
      false,
      false
    );

    component.ngOnInit();

    expect(component.isHackyTopicNameTranslationDisplayed()).toBeTrue();
    expect(component.isHackyTopicDescTranslationDisplayed()).toBeTrue();
    expect(component.isHackyClassroomNameTranslationDisplayed()).toBeTrue();
  });

  it('should not return the classroom name i18n key if the topic is not assigned to any classroom', () => {
    component.classroomName = null;
    spyOn(i18nLanguageCodeService, 'getClassroomTranslationKeys');

    component.ngOnInit();

    expect(
      i18nLanguageCodeService.getClassroomTranslationKeys
    ).not.toHaveBeenCalled();
    expect(component.isHackyClassroomNameTranslationDisplayed()).toBeFalse();
  });

  it('should check if the view is tablet or not', () => {
    var widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(730);
    expect(component.checkTabletView()).toBe(true);

    widthSpy.and.returnValue(800);
    expect(component.checkTabletView()).toBe(false);
  });

  it('should get RTL language status correctly', () => {
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      true
    );
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should generate the correct classroom URL using UrlInterpolationService', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.callThrough();

    const classroomNames = [
      'classroomA',
      'classroomB',
      'random-subject',
      'any-classroom',
    ];

    classroomNames.forEach(classroom => {
      component.classroomUrlFragment = classroom;
      expect(component.getClassroomUrl()).toBe(`/learn/${classroom}`);

      expect(urlInterpolationService.interpolateUrl).toHaveBeenCalledWith(
        '/learn/<classroom>',
        {classroom: classroom}
      );
    });

    component.classroomUrlFragment = '';
    expect(component.getClassroomUrl()).toBe('/learn');

    component.classroomUrlFragment = null;
    expect(component.getClassroomUrl()).toBe('/learn');

    component.classroomUrlFragment = undefined;
    expect(component.getClassroomUrl()).toBe('/learn');
  });
});
