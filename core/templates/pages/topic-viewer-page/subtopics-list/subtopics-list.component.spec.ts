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
 * @fileoverview Unit tests for subtopicsList.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { SubtopicSummaryTileComponent } from 'components/summary-tile/subtopic-summary-tile.component';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { SubtopicsListComponent } from './subtopics-list.component';

describe('Subtopics List Component', () => {
  let component: SubtopicsListComponent;
  let fixture: ComponentFixture<SubtopicsListComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MockTranslatePipe,
        SubtopicsListComponent,
        SubtopicSummaryTileComponent
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtopicsListComponent);
    component = fixture.componentInstance;
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    component.subtopicsList = [];
    component.classroomUrlFragment = 'classroom';
    component.topicUrlFragment = 'topic';
    component.topicName = 'Topic Name';
    component.topicId = 'topicId';
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      true);
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize properties after successfully', () => {
    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey')
      .and.returnValue('I18N_TOPIC_123abcd_TITLE');

    component.ngOnInit();

    expect(component.topicNameTranslationKey).toBe(
      'I18N_TOPIC_123abcd_TITLE');
  });

  it('should check if topic name, desc translation is displayed correctly',
    () => {
      spyOn(i18nLanguageCodeService, 'getTopicTranslationKey')
        .and.returnValue('I18N_TOPIC_123abcd_TITLE');
      spyOn(i18nLanguageCodeService, 'isHackyTranslationAvailable')
        .and.returnValue(true);
      spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish')
        .and.returnValue(false);

      component.ngOnInit();

      expect(component.isHackyTopicNameTranslationDisplayed()).toBe(true);
    }
  );
});
