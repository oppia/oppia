// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for ClassroomCardComponent.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {AssetsBackendApiService} from 'services/assets-backend-api.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {ClassroomCardComponent} from './classroom-card.component';
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';

describe('ClassroomCardComponent', () => {
  let component: ClassroomCardComponent;
  let fixture: ComponentFixture<ClassroomCardComponent>;
  let abas: AssetsBackendApiService;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  const dummyClassroomData = {
    classroom_id: 'mathclassroom',
    name: 'math',
    url_fragment: 'math',
    teaser_text: 'Learn math',
    is_published: true,
    thumbnail_filename: 'thumbnail.svg',
    thumbnail_bg_color: 'transparent',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [ClassroomCardComponent, MockTranslatePipe],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassroomCardComponent);
    component = fixture.componentInstance;
    abas = TestBed.inject(AssetsBackendApiService);
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    component.classroomSummary = dummyClassroomData;
  });

  it('should set component properties on initialization', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue(
      '/thumbnail/thumbnail.svg'
    );
    component.ngOnInit();
    expect(component.classroomThumbnailUrl).toBe('/thumbnail/thumbnail.svg');
    expect(component.classroomSummary).toEqual(dummyClassroomData);
  });

  it('should get classroom data', () => {
    spyOn(abas, 'getThumbnailUrlForPreview').and.returnValue(
      '/thumbnail/thumbnail.svg'
    );
    component.ngOnInit();

    expect(component.classroomThumbnailUrl).toBe('/thumbnail/thumbnail.svg');
    expect(component.getName()).toBe('math');
    expect(component.getClassroomUrl()).toBe('/learn/math');
  });

  it('should show translated classroom name if translation key is present', () => {
    component.classroomSummary = dummyClassroomData;
    component.classroomSummary.name = null;
    expect(component.isHackyClassroomNameTranslationDisplayed()).toBeFalse();

    component.classroomSummary.name = 'math';
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
      'isClassroomnNameTranslationAvailable'
    ).and.returnValue(true);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      false
    );

    component.ngOnInit();

    expect(component.classroomNameTranslationKey).toEqual(
      'I18N_CLASSROOM_MATH_NAME'
    );
    expect(component.isHackyClassroomNameTranslationDisplayed()).toBeTrue();
  });
});
