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

import {NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
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
      providers: [I18nLanguageCodeService],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    i18nLanguageCodeService = TestBed.inject(I18nLanguageCodeService);
    spyOn(i18nLanguageCodeService, 'isCurrentLanguageRTL').and.returnValue(
      false
    );

    fixture = TestBed.createComponent(TopicHeaderComponent);
    component = fixture.componentInstance;
    component.topicName = 'Place Values';
    component.topicDescription = 'Learn about place values.';
    component.classroomName = 'Math';
    component.classroomUrlFragment = 'math';
    fixture.detectChanges();
  });

  it('should render the topic title as an h1', () => {
    const el: HTMLElement = fixture.nativeElement;
    const h1 = el.querySelector('.topic-header-title');
    expect(h1?.tagName).toBe('H1');
    expect(h1?.textContent).toContain('Place Values');
  });

  it('should render the topic description', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(
      el.querySelector('.topic-header-description')?.textContent
    ).toContain('Learn about place values.');
  });

  it('should show the topic name as current page in breadcrumb', () => {
    const el: HTMLElement = fixture.nativeElement;
    const current = el.querySelector('[aria-current="page"]');
    expect(current?.textContent).toContain('Place Values');
  });

  it('should show the classroom breadcrumb link when classroomName is set', () => {
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll<HTMLAnchorElement>(
      '.topic-header-breadcrumbs-desktop a'
    );
    const hrefs = Array.from(links).map(a => a.getAttribute('href'));
    expect(hrefs).toContain('/learn/math');
  });

  it('should return correct classroom URL with fragment', () => {
    expect(component.getClassroomUrl()).toBe('/learn/math');
  });

  it('should return /learn when classroomUrlFragment is empty', () => {
    component.classroomUrlFragment = '';
    expect(component.getClassroomUrl()).toBe('/learn');
  });

  it('should delegate RTL check to I18nLanguageCodeService', () => {
    expect(component.isLanguageRTL()).toBeFalse();
    (
      i18nLanguageCodeService.isCurrentLanguageRTL as jasmine.Spy
    ).and.returnValue(true);
    expect(component.isLanguageRTL()).toBeTrue();
  });

  it('should not show classroom link when classroomName is null', () => {
    component.classroomName = null;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const links = el.querySelectorAll<HTMLAnchorElement>(
      '.topic-header-breadcrumbs-desktop a'
    );
    // Only the "Classrooms" link should remain; no classroom link.
    expect(links.length).toBe(1);
  });
});
