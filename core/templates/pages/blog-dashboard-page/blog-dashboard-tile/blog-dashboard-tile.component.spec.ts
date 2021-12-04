// Copyright 2021 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Blog Dashboard Tile component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { MockTranslatePipe, MockCapitalizePipe } from 'tests/unit-test-utils';
import { BlogDashboardTileComponent } from './blog-dashboard-tile.component';
import { BlogPostSummaryBackendDict, BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { BlogDashboardPageService } from '../services/blog-dashboard-page.service';
import { BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { AlertsService } from 'services/alerts.service';

describe('Blog Dashboard Tile Component', () => {
  let component: BlogDashboardTileComponent;
  let fixture: ComponentFixture<BlogDashboardTileComponent>;
  let ngbModal: NgbModal;
  let sampleBlogPostSummary: BlogPostSummaryBackendDict;
  let blogPostEditorBackendApiService: BlogPostEditorBackendApiService;
  let blogDashboardPageService: BlogDashboardPageService;
  let sampleBlogPostData: BlogPostData;
  let alertsService: AlertsService;
  let sampleBlogPostBackendDict = {
    id: 'sampleId',
    author_username: 'test_user',
    title: 'Title',
    content: '<p>hello</p>',
    thumbnail_filename: 'image.png',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '11/21/2014, 04:52:46:713463',
  };
  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatCardModule,
        MatMenuModule,
        NgbModalModule
      ],
      declarations: [
        BlogDashboardTileComponent,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
        BlogDashboardPageService,
        BlogPostEditorBackendApiService,
        AlertsService
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogDashboardTileComponent);
    component = fixture.componentInstance;
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
    blogPostEditorBackendApiService = TestBed.inject(
      BlogPostEditorBackendApiService);
    ngbModal = TestBed.inject(NgbModal);
    sampleBlogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
    alertsService = TestBed.inject(AlertsService);
    sampleBlogPostSummary = {
      id: 'sampleId',
      author_username: 'test_user',
      title: 'Title',
      summary: 'Hello World',
      tags: ['news'],
      thumbnail_filename: 'image.png',
      url_fragment: 'title',
      last_updated: '11/21/2014',
      published_on: '11/21/2014',
    };
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);

    component.ngOnInit();

    expect(component.lastUpdatedDateString).toEqual('Nov 21, 2014');
  });

  it('should get formatted date string from the timestamp in milliseconds',
    () => {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      let DATE = '11/21/2014';
      expect(component.getDateStringInWords(DATE))
        .toBe('Nov 21, 2014');

      DATE = '01/16/2027';
      expect(component.getDateStringInWords(DATE))
        .toBe('Jan 16, 2027');

      DATE = '02/02/2018';
      expect(component.getDateStringInWords(DATE))
        .toBe('Feb 2, 2018');
    });

  it('should navigate to blog post editor interface on clicking edit', () => {
    spyOn(blogDashboardPageService, 'navigateToEditorTabWithId');
    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);

    component.editBlogPost();

    expect(blogDashboardPageService.navigateToEditorTabWithId)
      .toHaveBeenCalledWith('sampleId');
  });

  it('should successfully place call to delete blog post model', fakeAsync(
    () => {
      spyOn(ngbModal, 'open').and.returnValue({
        result: Promise.resolve()
      } as NgbModalRef);
      spyOn(blogDashboardPageService, 'deleteBlogPost');
      component.blogPostSummary = BlogPostSummary.createFromBackendDict(
        sampleBlogPostSummary);

      component.deleteBlogPost();
      tick();

      expect(blogDashboardPageService.deleteBlogPost).toHaveBeenCalled();
    }));

  it('should cancel delete blog post model', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(blogDashboardPageService, 'deleteBlogPost');

    component.deleteBlogPost();
    tick();

    expect(blogDashboardPageService.deleteBlogPost)
      .not.toHaveBeenCalled();
  }));

  it('should unpublish blog post data successfully.', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);

    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);
    spyOn(blogPostEditorBackendApiService, 'updateBlogPostDataAsync')
      .and.returnValue(Promise.resolve({blogPostDict: sampleBlogPostData}));
    spyOn(component.unpublisedBlogPost, 'emit');

    component.unpublishBlogPost();
    tick();

    expect(blogPostEditorBackendApiService.updateBlogPostDataAsync)
      .toHaveBeenCalled();

    tick();

    expect(component.unpublisedBlogPost.emit).toHaveBeenCalled();
  }));


  it('should display error when unable to unpublish blog post data' +
  ' successfully.', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);

    component.blogPostSummary = BlogPostSummary.createFromBackendDict(
      sampleBlogPostSummary);
    spyOn(blogPostEditorBackendApiService, 'updateBlogPostDataAsync')
      .and.returnValue(Promise.reject('status: 500'));
    spyOn(component, 'unpublisedBlogPost');
    spyOn(alertsService, 'addWarning');

    component.unpublishBlogPost();
    tick();

    expect(blogPostEditorBackendApiService.updateBlogPostDataAsync)
      .toHaveBeenCalled();

    tick();

    expect(component.unpublisedBlogPost).not.toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to unpublish Blog Post. Internal Error: status: 500');
  }));

  it('should not unpublish blog post data if cancelled.', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(blogPostEditorBackendApiService, 'updateBlogPostDataAsync');
    component.unpublishBlogPost();
    tick();

    expect(blogPostEditorBackendApiService.updateBlogPostDataAsync)
      .not.toHaveBeenCalled();
  }));
});
