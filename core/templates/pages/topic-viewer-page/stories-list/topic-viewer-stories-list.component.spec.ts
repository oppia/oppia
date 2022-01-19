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

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';
import { StoriesListComponent } from './topic-viewer-stories-list.component';
 
describe('Topic Selector Component', () => {
  let component: StoriesListComponent;
  let fixture: ComponentFixture<StoriesListComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        StoriesListComponent
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    fixture = TestBed.createComponent(StoriesListComponent);
    component = fixture.componentInstance;
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
  });
});