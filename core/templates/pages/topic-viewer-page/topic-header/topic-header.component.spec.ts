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
 * @fileoverview Unit tests for TopicHeaderComponent.
 */

import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {
  I18nLanguageCodeService,
  TranslationKeyType,
} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TopicHeaderComponent} from './topic-header.component';
import {UrlService} from 'services/contextual/url.service';

describe('TopicHeaderComponent', () => {
  let component: TopicHeaderComponent;
  let fixture: ComponentFixture<TopicHeaderComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;
  let urlService: jasmine.SpyObj<UrlService>;

  beforeEach(waitForAsync(() => {
    urlService = jasmine.createSpyObj('UrlService', [
      'getClassroomUrlFragmentFromLearnerUrl',
    ]);
    TestBed.configureTestingModule({
      declarations: [TopicHeaderComponent, MockTranslatePipe],
      providers: [{provide: UrlService, useValue: urlService}],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicHeaderComponent);
    component = fixture.componentInstance;

    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    urlService = TestBed.inject(UrlService) as jasmine.SpyObj<UrlService>;
    urlService.getClassroomUrlFragmentFromLearnerUrl.and.returnValue('math');

    spyOn(i18nLanguageCodeService, 'getTopicTranslationKey').and.returnValues(
      'topic.title.translation.key',
      'topic.description.translation.key'
    );
    spyOn(
      i18nLanguageCodeService,
      'getClassroomTranslationKeys'
    ).and.returnValue({
      name: 'classroom.name.translation.key',
    } as ReturnType<I18nLanguageCodeService['getClassroomTranslationKeys']>);
    spyOn(
      i18nLanguageCodeService,
      'isHackyTranslationAvailable'
    ).and.returnValue(false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageEnglish').and.returnValue(
      true
    );
    spyOn(
      i18nLanguageCodeService,
      'isClassroomnNameTranslationAvailable'
    ).and.returnValue(false);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );

    component.topicId = 'topic_id';
    component.topicName = 'Place Values';
    component.topicDescription = 'Learn about place values.';
    component.classroomName = 'Math';

    fixture.detectChanges();
  });

  it('should have inputs set from parent and fetch classroomUrlFragment internally', () => {
    expect(component.topicName).toBe('Place Values');
    expect(component.topicDescription).toBe('Learn about place values.');
    expect(component.classroomName).toBe('Math');
    expect(urlService.getClassroomUrlFragmentFromLearnerUrl).toHaveBeenCalled();
    expect(component.classroomUrlFragment).toBe('math');
  });

  it('should return /learn/<fragment> or /learn', () => {
    expect(component.getClassroomUrl()).toBe('/learn/math');
    component.classroomUrlFragment = '';
    expect(component.getClassroomUrl()).toBe('/learn');
  });

  it('should delegate RTL detection to I18nLanguageCodeService', () => {
    expect(component.isLanguageRTL()).toBeFalse();
    (
      i18nLanguageCodeService.isCurrentLanguageRTL as jasmine.Spy
    ).and.returnValue(true);
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should handle null classroomName', () => {
    component.classroomName = null;
    fixture.detectChanges();
    expect(component.classroomName).toBeNull();
  });

  it('should initialize topic and classroom translation keys on init', () => {
    expect(i18nLanguageCodeService.getTopicTranslationKey).toHaveBeenCalledWith(
      'topic_id',
      TranslationKeyType.TITLE
    );
    expect(i18nLanguageCodeService.getTopicTranslationKey).toHaveBeenCalledWith(
      'topic_id',
      TranslationKeyType.DESCRIPTION
    );
    expect(
      i18nLanguageCodeService.getClassroomTranslationKeys
    ).toHaveBeenCalledWith('Math');
    expect(component.topicNameTranslationKey).toBe(
      'topic.title.translation.key'
    );
    expect(component.topicDescTranslationKey).toBe(
      'topic.description.translation.key'
    );
    expect(component.classroomNameTranslationKey).toBe(
      'classroom.name.translation.key'
    );
  });

  it('should not fetch classroom translation key when classroomName is null', () => {
    component.classroomName = null;

    component.ngOnInit();

    expect(
      i18nLanguageCodeService.getClassroomTranslationKeys
    ).toHaveBeenCalledTimes(1);
  });

  it('should show hacky topic name translation when available and non-english', () => {
    (
      i18nLanguageCodeService.isHackyTranslationAvailable as jasmine.Spy
    ).and.returnValue(true);
    (
      i18nLanguageCodeService.isCurrentLanguageEnglish as jasmine.Spy
    ).and.returnValue(false);

    expect(component.isHackyTopicNameTranslationDisplayed()).toBeTrue();
  });

  it('should not show hacky topic name translation in english', () => {
    (
      i18nLanguageCodeService.isHackyTranslationAvailable as jasmine.Spy
    ).and.returnValue(true);
    (
      i18nLanguageCodeService.isCurrentLanguageEnglish as jasmine.Spy
    ).and.returnValue(true);

    expect(component.isHackyTopicNameTranslationDisplayed()).toBeFalse();
  });

  it('should show hacky topic description translation when available and non-english', () => {
    (
      i18nLanguageCodeService.isHackyTranslationAvailable as jasmine.Spy
    ).and.returnValue(true);
    (
      i18nLanguageCodeService.isCurrentLanguageEnglish as jasmine.Spy
    ).and.returnValue(false);

    expect(component.isHackyTopicDescTranslationDisplayed()).toBeTrue();
  });

  it('should not show hacky classroom translation when classroomName is null', () => {
    component.classroomName = null;

    expect(component.isHackyClassroomNameTranslationDisplayed()).toBeFalse();
  });

  it('should delegate hacky classroom translation availability to service', () => {
    (
      i18nLanguageCodeService.isClassroomnNameTranslationAvailable as jasmine.Spy
    ).and.returnValue(true);

    expect(component.isHackyClassroomNameTranslationDisplayed()).toBeTrue();
    expect(
      i18nLanguageCodeService.isClassroomnNameTranslationAvailable
    ).toHaveBeenCalledWith('Math');
  });
});
