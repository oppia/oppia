// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for subtopic viewer page component.
 */

import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';

import { PageTitleService } from 'services/page-title.service';
import { ReadOnlySubtopicPageData } from 'domain/subtopic_viewer/read-only-subtopic-page-data.model';
import { SubtopicViewerPageComponent } from './subtopic-viewer-page.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { LoaderService } from 'services/loader.service';
import { SubtopicViewerBackendApiService } from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('Subtopic viewer page', function() {
  let component: SubtopicViewerPageComponent;
  let fixture: ComponentFixture<SubtopicViewerPageComponent>;
  let pageTitleService: PageTitleService;
  let contextService: ContextService;
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let subtopicViewerBackendApiService: SubtopicViewerBackendApiService;
  let urlService: UrlService;
  let loaderService: LoaderService;

  let topicName = 'Topic Name';
  let topicId = '1';
  let subtopicTitle = 'Subtopic Title';
  let subtopicUrlFragment = 'subtopic-title';
  let subtopicDataObject: ReadOnlySubtopicPageData = (
    ReadOnlySubtopicPageData.createFromBackendDict({
      topic_id: topicId,
      topic_name: topicName,
      subtopic_title: subtopicTitle,
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {}
        }
      },
      next_subtopic_dict: {
        id: 1,
        title: '',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: subtopicUrlFragment
      },
      prev_subtopic_dict: null
    }));

  let subtopicDataObjectWithPrevSubtopic: ReadOnlySubtopicPageData = (
    ReadOnlySubtopicPageData.createFromBackendDict({
      topic_id: topicId,
      topic_name: topicName,
      subtopic_title: subtopicTitle,
      page_contents: {
        subtitled_html: {
          content_id: '',
          html: 'This is a html'
        },
        recorded_voiceovers: {
          voiceovers_mapping: {}
        }
      },
      next_subtopic_dict: null,
      prev_subtopic_dict: {
        id: 1,
        title: '',
        skill_ids: [],
        thumbnail_filename: '',
        thumbnail_bg_color: '',
        url_fragment: subtopicUrlFragment
      }
    }));

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      declarations: [
        SubtopicViewerPageComponent,
        MockTranslatePipe
      ],
      providers: [
        AlertsService,
        ContextService,
        LoaderService,
        PageTitleService,
        SubtopicViewerBackendApiService,
        UrlService,
        WindowDimensionsService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SubtopicViewerPageComponent);
    component = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    contextService = TestBed.inject(ContextService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    alertsService = TestBed.inject(AlertsService);
    subtopicViewerBackendApiService = TestBed.inject(
      SubtopicViewerBackendApiService);
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
  });

  it('should succesfully get subtopic data and set context with next subtopic' +
  ' card', fakeAsync(() => {
    spyOn(pageTitleService, 'setDocumentTitle');
    spyOn(pageTitleService, 'updateMetaTag');
    spyOn(contextService, 'setCustomEntityContext');
    spyOn(contextService, 'removeCustomEntityContext');
    spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
      'topic-url');
    spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl').and.returnValue(
      'classroom-url');
    spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
      'subtopic-url');
    spyOn(loaderService, 'showLoadingScreen');

    expect(component.subtopicSummaryIsShown).toBe(false);
    spyOn(subtopicViewerBackendApiService, 'fetchSubtopicDataAsync')
      .and.returnValue(Promise.resolve(subtopicDataObject));

    component.ngOnInit();
    tick();

    expect(component.pageContents).toEqual(
      subtopicDataObject.getPageContents());
    expect(component.subtopicTitle).toEqual(
      subtopicDataObject.getSubtopicTitle());
    expect(component.parentTopicId).toEqual(
      subtopicDataObject.getParentTopicId());
    expect(component.nextSubtopic).toEqual(
      subtopicDataObject.getNextSubtopic());
    expect(component.prevSubtopic).toBeNull();
    expect(component.subtopicSummaryIsShown).toBeTrue();

    expect(contextService.setCustomEntityContext).toHaveBeenCalled();
    expect(pageTitleService.setDocumentTitle).toHaveBeenCalled();
    expect(pageTitleService.updateMetaTag).toHaveBeenCalled();

    component.ngOnDestroy();
    expect(contextService.removeCustomEntityContext).toHaveBeenCalled();
  }));

  it('should succesfully get subtopic data with prev subtopic card',
    fakeAsync(() => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic-url');
      spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
        .and.returnValue('classroom-url');
      spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
        'subtopic-url');
      spyOn(loaderService, 'showLoadingScreen');

      expect(component.subtopicSummaryIsShown).toBe(false);
      spyOn(subtopicViewerBackendApiService, 'fetchSubtopicDataAsync')
        .and.returnValue(Promise.resolve(subtopicDataObjectWithPrevSubtopic));

      component.ngOnInit();
      tick();

      expect(component.pageContents).toEqual(
        subtopicDataObjectWithPrevSubtopic.getPageContents());
      expect(component.subtopicTitle).toEqual(
        subtopicDataObjectWithPrevSubtopic.getSubtopicTitle());
      expect(component.parentTopicId).toEqual(
        subtopicDataObjectWithPrevSubtopic.getParentTopicId());
      expect(component.prevSubtopic).toEqual(
        subtopicDataObjectWithPrevSubtopic.getPrevSubtopic());
      expect(component.nextSubtopic).toBeNull();
      expect(component.subtopicSummaryIsShown).toBeTrue();

      component.ngOnDestroy();
    }));

  it(
    'should use reject handler when fetching subtopic data fails',
    fakeAsync(() => {
      spyOn(urlService, 'getTopicUrlFragmentFromLearnerUrl').and.returnValue(
        'topic-url');
      spyOn(urlService, 'getClassroomUrlFragmentFromLearnerUrl')
        .and.returnValue('classroom-url');
      spyOn(urlService, 'getSubtopicUrlFragmentFromLearnerUrl').and.returnValue(
        'subtopic-url');
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(subtopicViewerBackendApiService, 'fetchSubtopicDataAsync').and
        .returnValue(Promise.reject({
          status: 404
        }));
      spyOn(alertsService, 'addWarning');
      component.ngOnInit();
      tick();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get subtopic data');
    }));

  it('should check if the view is mobile or not', function() {
    let widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(component.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(component.checkMobileView()).toBe(false);
  });
});
