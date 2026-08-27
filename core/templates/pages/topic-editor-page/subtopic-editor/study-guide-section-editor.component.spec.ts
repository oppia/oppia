// Copyright 2025 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for StudyGuideSectionEditorComponent
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {ChangeDetectorRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import {TopicUpdateService} from 'domain/topic/topic-update.service';
import {StudyGuide} from 'domain/topic/study-guide.model';
import {StudyGuideSection} from 'domain/topic/study-guide-sections.model';
import {TopicEditorStateService} from '../services/topic-editor-state.service';
import {StudyGuideSectionEditorComponent} from './study-guide-section-editor.component';
import {HtmlLengthService} from 'services/html-length.service';
import {SubtitledHtml} from 'domain/exploration/subtitled-html.model';
import {SubtitledUnicode} from 'domain/exploration/subtitled-unicode.model';

describe('Study Guide Section editor component', () => {
  let component: StudyGuideSectionEditorComponent;
  let fixture: ComponentFixture<StudyGuideSectionEditorComponent>;
  let topicEditorStateService: TopicEditorStateService;
  let topicUpdateService: TopicUpdateService;
  let sampleStudyGuide: StudyGuide;
  let htmlLengthService: jasmine.SpyObj<HtmlLengthService>;

  beforeEach(waitForAsync(() => {
    htmlLengthService = jasmine.createSpyObj('HtmlLengthService', [
      'computeHtmlLength',
    ]);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [StudyGuideSectionEditorComponent],
      providers: [
        ChangeDetectorRef,
        {
          provide: HtmlLengthService,
          useValue: htmlLengthService,
        },
        TopicEditorStateService,
        TopicUpdateService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StudyGuideSectionEditorComponent);
    component = fixture.componentInstance;
    topicEditorStateService = TestBed.inject(TopicEditorStateService);
    topicUpdateService = TestBed.inject(TopicUpdateService);

    sampleStudyGuide = new StudyGuide(
      '10',
      'topic1',
      [
        new StudyGuideSection(
          new SubtitledUnicode('section heading', 'section_heading_0'),
          new SubtitledHtml('<p>section content</p>', 'section_content_1')
        ),
      ],
      2,
      'en'
    );
    spyOn(topicEditorStateService, 'getStudyGuide').and.returnValue(
      sampleStudyGuide
    );
    const mockSection = jasmine.createSpyObj<StudyGuideSection>(
      'StudyGuideSection',
      ['getHeadingText', 'getContentHtml']
    );

    mockSection.getHeadingText.and.returnValue(
      new SubtitledUnicode('heading', 'section_heading_0')
    );

    mockSection.getContentHtml.and.returnValue(
      new SubtitledHtml('content', 'section_content_1')
    );

    component.isEditable = true;
    component.index = 2;
    component.section = mockSection;
    component.ngOnInit();
  });

  it('should set properties when initialized', () => {
    expect(component.headingEditorIsOpen).toBe(false);
    expect(component.contentEditorIsOpen).toBe(false);
    expect(component.STUDY_GUIDE_SECTION_HEADING_FORM_SCHEMA).toEqual({
      type: 'unicode',
      ui_config: {},
    });
    expect(component.STUDY_GUIDE_SECTION_CONTENT_FORM_SCHEMA).toEqual({
      type: 'html',
      ui_config: {
        rte_component_config_id: 'SKILL_AND_STUDY_GUIDE_EDITOR_COMPONENTS',
      },
    });
  });

  it('should open heading editor when clicking on edit button', () => {
    expect(component.headingEditorIsOpen).toBe(false);

    component.openHeadingEditor();

    expect(component.headingEditorIsOpen).toBe(true);
  });

  it('should open content editor when clicking on edit button', () => {
    expect(component.contentEditorIsOpen).toBe(false);

    component.openContentEditor();

    expect(component.contentEditorIsOpen).toBe(true);
  });

  it('should close heading editor when clicking on cancel button', () => {
    expect(component.headingEditorIsOpen).toBe(false);

    component.openHeadingEditor();

    expect(component.headingEditorIsOpen).toBe(true);

    component.cancelEditHeading();

    expect(component.headingEditorIsOpen).toBe(false);

    component.headingEditorIsOpen = true;
    component.originalSectionHeading = '';
    component.cancelEditHeading();

    expect(component.headingEditorIsOpen).toBe(true);
  });

  it('should close content editor when clicking on cancel button', () => {
    expect(component.contentEditorIsOpen).toBe(false);

    component.openContentEditor();

    expect(component.contentEditorIsOpen).toBe(true);

    component.cancelEditContent();

    expect(component.contentEditorIsOpen).toBe(false);

    component.contentEditorIsOpen = true;
    component.originalSectionContent = '';
    component.cancelEditContent();

    expect(component.contentEditorIsOpen).toBe(true);
  });

  it('should save study guide section when clicking on save button', () => {
    let sectionUpdateSpy = spyOn(
      topicUpdateService,
      'updateSection'
    ).and.returnValue();

    component.saveSection(true);

    expect(sectionUpdateSpy).toHaveBeenCalledWith(
      sampleStudyGuide,
      2,
      new SubtitledUnicode('heading', 'section_heading_0'),
      new SubtitledHtml('content', 'section_content_1'),
      10
    );

    component.saveSection(false);

    expect(sectionUpdateSpy).toHaveBeenCalledWith(
      sampleStudyGuide,
      2,
      new SubtitledUnicode('heading', 'section_heading_0'),
      new SubtitledHtml('content', 'section_content_1'),
      10
    );
  });

  it('should get schema', () => {
    expect(component.getContentSchema()).toEqual(
      component.STUDY_GUIDE_SECTION_CONTENT_FORM_SCHEMA
    );
    expect(component.getHeadingSchema()).toEqual(
      component.STUDY_GUIDE_SECTION_HEADING_FORM_SCHEMA
    );
  });

  it('should update tempSectionHeadingPlaintext', () => {
    component.container.sectionHeadingPlaintext = 'head';

    component.updateLocalHeading('new head');

    expect(component.container.sectionHeadingPlaintext).toEqual('new head');
  });

  it('should update tempSectionContentHtml', () => {
    component.container.sectionContentHtml = 'con';

    component.updateLocalContent('new con');

    expect(component.container.sectionContentHtml).toEqual('new con');
  });

  it('should check if section content length is exceeded', () => {
    component.container.sectionContentHtml = 'short content';

    htmlLengthService.computeHtmlLength.and.returnValue(500);
    expect(component.isSectionContentLengthExceeded()).toBe(false);

    htmlLengthService.computeHtmlLength.and.returnValue(6500);
    expect(component.isSectionContentLengthExceeded()).toBe(true);
  });
});
