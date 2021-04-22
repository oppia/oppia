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

import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, waitForAsync } from '@angular/core/testing';

import { PageTitleService } from 'services/page-title.service';
import { ReadOnlySubtopicPageData } from 'domain/subtopic_viewer/read-only-subtopic-page-data.model';
import { SubtopicViewerPageComponent } from './subtopic-viewer-page.component';
import { Injectable, NO_ERRORS_SCHEMA, Pipe } from '@angular/core';
import { AlertsService } from 'services/alerts.service';
import { ContextService } from 'services/context.service';
import { LoaderService } from 'services/loader.service';
import { SubtopicViewerBackendApiService } from 'domain/subtopic_viewer/subtopic-viewer-backend-api.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';


describe('Subtopic viewer page', function() {
  let component: SubtopicViewerPageComponent;
  let fixture: ComponentFixture<SubtopicViewerPageComponent>;
  let pageTitleService: PageTitleService;
  let contextService: ContextService;
  let alertsService: AlertsService;
  let windowDimensionsService: WindowDimensionsService;
  let subtopicViewerBackendApiService: SubtopicViewerBackendApiService;

  let topicName = 'Topic Name';
  let abbreviatedTopicName = 'abbrev';
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
      }
    }));

  @Pipe({name: 'translate'})
  class MockTranslatePipe {
    transform(value: string, params: Object | undefined): string {
      return value;
    }
  }

  @Injectable({providedIn: 'root'})
  class MockAlertsService {
    addWarning(message: string): void {}
  }

  @Injectable({providedIn: 'root'})
  class MockContextService {
    hideLoadingScreen(): void {}
    setCustomEntityContext(entityType: string, entityId: string): void {}
    removeCustomEntityContext(): void {}
  }

  @Injectable({providedIn: 'root'})
  class MockLoaderService {
    showLoadingScreen(message: string): void {}
    hideLoadingScreen(): void {}
  }

  @Injectable({providedIn: 'root'})
  class MockPageTitleService {
    updateMetaTag(message: string): void {}
    setPageTitle(message: string): void {}
  }

  @Injectable({providedIn: 'root'})
  class MockSubtopicViewerBackendApiService {
    fetchSubtopicDataAsync(
        topicUrlFragment: string,
        classroomUrlFragment: string,
        subtopicUrlFragment: string): Promise<ReadOnlySubtopicPageData> {
      return new Promise<ReadOnlySubtopicPageData>((resolve, reject) => {
        resolve(subtopicDataObject);
      });
    }
  }

  @Injectable({providedIn: 'root'})
  class MockUrlService {
    getTopicUrlFragmentFromLearnerUrl(): string {
      return abbreviatedTopicName;
    }

    getClassroomUrlFragmentFromLearnerUrl(): string {
      return 'math';
    }

    getSubtopicUrlFragmentFromLearnerUrl(): string {
      return subtopicUrlFragment;
    }
  }

  @Injectable({providedIn: 'root'})
  class MockWindowDimensionsService {
    getWidth(): number {
      return 100;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [SubtopicViewerPageComponent, MockTranslatePipe],
      providers: [
        {
          provide: AlertsService,
          useClass: MockAlertsService
        },
        {
          provide: ContextService,
          useClass: MockContextService
        },
        {
          provide: LoaderService,
          useClass: MockLoaderService
        },
        {
          provide: PageTitleService,
          useClass: MockPageTitleService
        },
        {
          provide: SubtopicViewerBackendApiService,
          useClass: MockSubtopicViewerBackendApiService
        },
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    fixture = TestBed.createComponent(SubtopicViewerPageComponent);
    component = fixture.componentInstance;
    pageTitleService = TestBed.inject(PageTitleService);
    contextService = TestBed.inject(ContextService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    alertsService = TestBed.inject(AlertsService);
    subtopicViewerBackendApiService = TestBed.inject(
      SubtopicViewerBackendApiService);
  }));

  it('should succesfully get subtopic data and set context', fakeAsync(() => {
    spyOn(pageTitleService, 'setPageTitle').and.callThrough();
    spyOn(pageTitleService, 'updateMetaTag').and.callThrough();
    spyOn(contextService, 'setCustomEntityContext').and.callThrough();
    spyOn(contextService, 'removeCustomEntityContext').and.callThrough();

    expect(component.nextSubtopicSummaryIsShown).toBe(false);

    component.ngOnInit();
    flushMicrotasks();

    expect(component.pageContents.getHtml()).toBe('This is a html');
    expect(component.subtopicTitle).toBe(subtopicTitle);
    expect(pageTitleService.setPageTitle).toHaveBeenCalledWith(
      `Review ${subtopicTitle} | Oppia`);
    expect(pageTitleService.updateMetaTag).toHaveBeenCalledWith(
      `Review the skill of ${subtopicTitle.toLowerCase()}.`);
    expect(contextService.setCustomEntityContext).toHaveBeenCalledWith(
      'topic', topicId);

    expect(component.parentTopicId).toBe(topicId);
    expect(component.nextSubtopic).toEqual(
      subtopicDataObject.getNextSubtopic());
    expect(component.nextSubtopicSummaryIsShown).toBe(true);

    component.ngOnDestroy();
    expect(contextService.removeCustomEntityContext).toHaveBeenCalled();
  }));

  it(
    'should use reject handler when fetching subtopic data fails',
    fakeAsync(() => {
      spyOn(subtopicViewerBackendApiService, 'fetchSubtopicDataAsync').and
        .returnValue(
          new Promise((resolve, reject) => reject({
            status: 404
          })));
      spyOn(alertsService, 'addWarning').and.callThrough();

      expect(component.nextSubtopicSummaryIsShown).toBe(false);

      component.ngOnInit();
      flushMicrotasks();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get subtopic data');
      expect(component.nextSubtopicSummaryIsShown).toBe(false);
    }));

  it('should check if the view is mobile or not', function() {
    let widthSpy = spyOn(windowDimensionsService, 'getWidth');
    widthSpy.and.returnValue(400);
    expect(component.checkMobileView()).toBe(true);

    widthSpy.and.returnValue(700);
    expect(component.checkMobileView()).toBe(false);
  });
});
