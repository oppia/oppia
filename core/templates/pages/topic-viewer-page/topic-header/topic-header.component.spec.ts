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
import {I18nLanguageCodeService} from 'services/i18n-language-code.service';
import {MockTranslatePipe} from 'tests/unit-test-utils';
import {TopicHeaderComponent} from './topic-header.component';

describe('TopicHeaderComponent', () => {
  let component: TopicHeaderComponent;
  let fixture: ComponentFixture<TopicHeaderComponent>;
  let i18nLanguageCodeService: I18nLanguageCodeService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [TopicHeaderComponent, MockTranslatePipe],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TopicHeaderComponent);
    component = fixture.componentInstance;

    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );

    component.topicName = 'Place Values';
    component.topicDescription = 'Learn about place values.';
    component.classroomName = 'Math';
    component.classroomUrlFragment = 'math';

    fixture.detectChanges();
  });

  it('should have inputs set from parent', () => {
    expect(component.topicName).toBe('Place Values');
    expect(component.topicDescription).toBe('Learn about place values.');
    expect(component.classroomName).toBe('Math');
    expect(component.classroomUrlFragment).toBe('math');
  });

  it('getClassroomUrl should return /learn/<fragment> or /learn', () => {
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
});
