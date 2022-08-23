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

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { StoriesListComponent } from './topic-viewer-stories-list.component';

describe('Topic Viewer Stories List Component', () => {
  let component: StoriesListComponent;
  let fixture: ComponentFixture<StoriesListComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let windowDimensionsService: WindowDimensionsService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StoriesListComponent,
        MockTranslatePipe
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    fixture = TestBed.createComponent(StoriesListComponent);
    component = fixture.componentInstance;
    component.canonicalStorySummaries = [];
    component.classroomUrlFragment = 'classroom';
    component.topicUrlFragment = 'topic';
    component.topicName = 'Topic Name';
    component.topicDescription = 'Topic Description';
    component.topicId = 'topicId';
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);

    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should initialize properties after successfully', () => {
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey')
      .and.returnValues(
        'I18N_TOPIC_123abcd_TITLE', 'I18N_TOPIC_123abcd_DESCRIPTION');
    expect(component).toBeDefined();

    component.ngOnInit();

    expect(component.topicNameTranslationKey).toBe(
      'I18N_TOPIC_123abcd_TITLE');
    expect(component.topicDescTranslationKey).toBe(
      'I18N_TOPIC_123abcd_DESCRIPTION');
  });

  it('should check if topic name, desc translation is displayed correctly',
    () => {
      spyOn(i18nLanguageCodeService, 'getTopicTranslationKey')
        .and.returnValues(
          'I18N_TOPIC_123abcd_TITLE', 'I18N_TOPIC_123abcd_DESCRIPTION');
      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValues(true, true);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValues(false, false);

      component.ngOnInit();

      expect(component.isHackyTopicNameTranslationDisplayed()).toBe(true);
      expect(component.isHackyTopicDescTranslationDisplayed()).toBe(true);
    }
  );

  it('should check if the view is tablet or not', () => {
    var widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(730);
    expect(component.checkTabletView()).toBe(true);

    widthSpy.and.returnValue(800);
    expect(component.checkTabletView()).toBe(false);
  });
});
