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
 * @fileoverview Unit tests for Blog Dashboard page component.
 */

import { NO_ERRORS_SCHEMA } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatTabsModule } from '@angular/material/tabs';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { MockTranslatePipe, MockCapitalizePipe } from 'tests/unit-test-utils';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { BlogAuthorDetailsEditorComponent } from './modal-templates/author-detail-editor-modal.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { LoaderService } from 'services/loader.service';
import { AlertsService } from 'services/alerts.service';
import { BlogDashboardBackendApiService } from 'domain/blog/blog-dashboard-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { BlogDashboardPageService } from './services/blog-dashboard-page.service';
import { BlogDashboardPageComponent } from './blog-dashboard-page.component';
import { BlogPostSummary } from 'domain/blog/blog-post-summary.model';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { of } from 'rxjs';

describe('Blog Dashboard Page Component', () => {
  let alertsService: AlertsService;
  let blogDashboardBackendApiService: BlogDashboardBackendApiService;
  let blogDashboardPageService: BlogDashboardPageService;
  let component: BlogDashboardPageComponent;
  let fixture: ComponentFixture<BlogDashboardPageComponent>;
  let loaderService: LoaderService;
  let mockWindowRef: MockWindowRef;
  let urlInterpolationService: UrlInterpolationService;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');
  let ngbModal: NgbModal;

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        _hashChange: null,
        reload: () => {}
      },
      open: (url: string) => {},
      onhashchange() {
        return this.location._hashChange;
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatTabsModule,
        NgbModalModule,
      ],
      declarations: [
        BlogDashboardPageComponent,
        BlogAuthorDetailsEditorComponent,
        MockTranslatePipe
      ],
      providers: [
        AlertsService,
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        },
        BlogDashboardBackendApiService,
        BlogDashboardPageService,
        LoaderService,
        UrlInterpolationService,
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogDashboardPageComponent);
    component = fixture.componentInstance;
    ngbModal = TestBed.inject(NgbModal);
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
    loaderService = TestBed.inject(LoaderService);
    blogDashboardBackendApiService = TestBed.inject(
      BlogDashboardBackendApiService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    alertsService = TestBed.inject(AlertsService);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should add subscriptions on initialization', () => {
    spyOn(blogDashboardPageService.updateViewEventEmitter, 'subscribe');

    component.ngOnInit();

    expect(blogDashboardPageService.updateViewEventEmitter.subscribe)
      .toHaveBeenCalled();
  });

  it('should set correct activeTab value when update view ' +
  'event is emitted.', fakeAsync(() => {
    component.ngOnInit();

    expect(component.activeTab).toBe('main');

    // Changing active tab to blog post editor.
    blogDashboardPageService.navigateToEditorTabWithId('123456sample');
    mockWindowRef.nativeWindow.onhashchange();
    tick();

    expect(component.activeTab).toBe('editor_tab');

    // Changing active tab back to main tab.
    mockWindowRef.nativeWindow.location.hash = '/';
    mockWindowRef.nativeWindow.onhashchange();
    tick();

    expect(component.activeTab).toBe('main');
  }));

  it('should call initMainTab if active tab is main', () => {
    spyOn(component, 'initMainTab');
    component.ngOnInit();

    expect(component.activeTab).toBe('main');
    expect(component.initMainTab).toHaveBeenCalled();
  });

  it('should not call initMainTab if active tab is editor_tab',
    fakeAsync(() => {
      spyOn(component, 'initMainTab');
      // Changing active tab to blog post editor.
      blogDashboardPageService.navigateToEditorTabWithId('123456sample');
      mockWindowRef.nativeWindow.onhashchange();

      component.ngOnInit();
      tick();

      expect(component.activeTab).toBe('editor_tab');
      expect(component.initMainTab).not.toHaveBeenCalled();
    }));

  it('should initialize main tab', fakeAsync(() => {
    let defaultImageUrl = 'banner_image_url';
    let blogDashboardData = {
      displayedAuthorName: 'test_user',
      authorBio: '',
      profilePictureDataUrl: 'sample_url',
      numOfPublishedBlogPosts: 0,
      numOfDraftBlogPosts: 0,
      publishedBlogPostSummaryDicts: [],
      draftBlogPostSummaryDicts: [],
    };
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue(defaultImageUrl);
    spyOn(component, 'showAuthorDetailsEditor');
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(blogDashboardBackendApiService, 'fetchBlogDashboardDataAsync')
      .and.returnValue(Promise.resolve(blogDashboardData));

    component.initMainTab();
    // As loading screen should be shown irrespective of the response
    // of the async call, expect statement is before tick().
    expect(loaderService.showLoadingScreen).toHaveBeenCalled();

    tick();

    expect(component.blogDashboardData).toEqual(blogDashboardData);
    expect(component.DEFAULT_PROFILE_PICTURE_URL).toEqual(defaultImageUrl);
    expect(blogDashboardBackendApiService.fetchBlogDashboardDataAsync)
      .toHaveBeenCalled();
    expect(component.authorProfilePictureUrl).toEqual('sample_url');
    expect(component.showAuthorDetailsEditor).toHaveBeenCalled();
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(windowDimensionsService.isWindowNarrow()).toHaveBeenCalled;
    expect(component.windowIsNarrow).toBe(true);
  }));

  it('should display alert when unable to fetch blog dashboard data',
    fakeAsync(() => {
      let defaultImageUrl = 'banner_image_url';
      spyOn(urlInterpolationService, 'getStaticImageUrl')
        .and.returnValue(defaultImageUrl);
      spyOn(loaderService, 'showLoadingScreen');
      spyOn(blogDashboardBackendApiService, 'fetchBlogDashboardDataAsync')
        .and.returnValue(Promise.reject(500));
      spyOn(alertsService, 'addWarning');

      component.ngOnInit();
      tick();

      expect(component.DEFAULT_PROFILE_PICTURE_URL).toEqual(defaultImageUrl);
      expect(loaderService.showLoadingScreen).toHaveBeenCalled();
      expect(blogDashboardBackendApiService.fetchBlogDashboardDataAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get blog dashboard data');
    }));

  it('should succesfully create new blog post', fakeAsync(() => {
    spyOn(blogDashboardBackendApiService, 'createBlogPostAsync')
      .and.returnValue(Promise.resolve('123456abcdef'));
    spyOn(blogDashboardPageService, 'navigateToEditorTabWithId');

    component.createNewBlogPost();
    tick();

    expect(blogDashboardBackendApiService.createBlogPostAsync)
      .toHaveBeenCalled();
    expect(blogDashboardPageService.navigateToEditorTabWithId)
      .toHaveBeenCalledWith('123456abcdef');
  }));

  it('should display alert when unable to create new blog post.',
    fakeAsync(() => {
      spyOn(blogDashboardBackendApiService, 'createBlogPostAsync')
        .and.returnValue(Promise.reject(
          'To many collisions with existing blog post ids.'));
      spyOn(blogDashboardPageService, 'navigateToEditorTabWithId');
      spyOn(alertsService, 'addWarning');

      component.createNewBlogPost();
      tick();

      expect(blogDashboardBackendApiService.createBlogPostAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Unable to create new blog post.Error: ' +
        'To many collisions with existing blog post ids.');
    }));

  it('should remove unpublish blog post from published list and' +
  ' add it to drafts list', () => {
    let summaryObject = BlogPostSummary.createFromBackendDict(
      { id: 'sampleId',
        author_username: 'test_username',
        displayed_author_name: 'test_user',
        title: 'Title',
        summary: 'Hello World',
        tags: ['news'],
        thumbnail_filename: 'image.png',
        url_fragment: 'title',
        last_updated: '3232323',
        published_on: '3232323',
      });
    let blogDashboardData = {
      displayedAuthorName: 'test_user',
      authorBio: 'bio',
      profilePictureDataUrl: 'sample_url',
      numOfPublishedBlogPosts: 1,
      numOfDraftBlogPosts: 0,
      publishedBlogPostSummaryDicts: [summaryObject],
      draftBlogPostSummaryDicts: [],
    };
    component.blogDashboardData = blogDashboardData;

    component.unpublishedBlogPost(summaryObject);

    // BlogPostSummary should now be a part of draft list whereas
    // publish blogPostSummary list should be empty.
    expect(component.blogDashboardData.draftBlogPostSummaryDicts)
      .toEqual([summaryObject]);
    expect(component.blogDashboardData.publishedBlogPostSummaryDicts)
      .toEqual([]);
    expect(component.blogDashboardData.numOfPublishedBlogPosts).toEqual(0);
    expect(component.blogDashboardData.numOfDraftBlogPosts).toEqual(1);
  });

  it('should successfully remove blog post summary when blog post' +
  'published blog post is deleted', () => {
    let summaryObject = BlogPostSummary.createFromBackendDict(
      { id: 'sampleId',
        author_username: 'test_username',
        displayed_author_name: 'test_user',
        title: 'Title',
        summary: 'Hello World',
        tags: ['news'],
        thumbnail_filename: 'image.png',
        url_fragment: 'title',
        last_updated: '3232323',
        published_on: '3232323',
      });
    let blogDashboardData = {
      displayedAuthorName: 'test_user',
      authorBio: 'Bio',
      profilePictureDataUrl: 'sample_url',
      numOfPublishedBlogPosts: 0,
      numOfDraftBlogPosts: 0,
      publishedBlogPostSummaryDicts: [summaryObject],
      draftBlogPostSummaryDicts: [],
    };
    component.blogDashboardData = blogDashboardData;
    component.blogDashboardData.publishedBlogPostSummaryDicts = [summaryObject];

    component.removeBlogPost(summaryObject, true);

    expect(component.blogDashboardData.publishedBlogPostSummaryDicts).toEqual(
      []);
  });

  it('should successfully remove blog post summary when blog post' +
  'draft blog post is deleted', () => {
    let summaryObject = BlogPostSummary.createFromBackendDict(
      { id: 'sampleId',
        author_username: 'test_username',
        displayed_author_name: 'test_user',
        title: 'Title',
        summary: 'Hello World',
        tags: ['news'],
        thumbnail_filename: 'image.png',
        url_fragment: 'title',
        last_updated: '3232323',
        published_on: '3232323',
      });
    let blogDashboardData = {
      displayedAuthorName: 'test_user',
      authorBio: 'Bio',
      profilePictureDataUrl: 'sample_url',
      numOfPublishedBlogPosts: 0,
      numOfDraftBlogPosts: 0,
      publishedBlogPostSummaryDicts: [],
      draftBlogPostSummaryDicts: [summaryObject],
    };
    component.blogDashboardData = blogDashboardData;

    component.removeBlogPost(summaryObject, false);

    expect(component.blogDashboardData.draftBlogPostSummaryDicts).toEqual(
      []);
  });

  it('should display alert when unable to update author details', fakeAsync(
    () => {
      component.authorName = 'new username';
      component.authorBio = 'Oppia Blog Author';
      spyOn(blogDashboardBackendApiService, 'updateAuthorDetailsAsync')
        .and.returnValue(Promise.reject(
          'Server responded with backend error.'));
      spyOn(alertsService, 'addWarning');

      component.updateAuthorDetails();
      tick();

      expect(blogDashboardBackendApiService.updateAuthorDetailsAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Unable to update author details. Error: Server responded with' +
        ' backend error.');
    })
  );

  it('should successfully update author details', fakeAsync(() => {
    component.authorName = 'new username';
    component.authorBio = 'Oppia Blog Author';
    let BlogAuthorDetails = {
      displayedAuthorName: 'new username',
      authorBio: 'Oppia Blog Author'
    };
    spyOn(blogDashboardBackendApiService, 'updateAuthorDetailsAsync')
      .and.returnValue(Promise.resolve(BlogAuthorDetails));
    spyOn(alertsService, 'addSuccessMessage');

    component.updateAuthorDetails();
    tick();

    expect(blogDashboardBackendApiService.updateAuthorDetailsAsync)
      .toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Author Details saved successfully.');
  }));

  it('should cancel updating author details', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      componentInstance: {
        authorName: '',
        authorBio: ''
      },
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(component, 'updateAuthorDetails');
    component.authorBio = '';
    component.authorName = 'test username';

    component.showAuthorDetailsEditor();
    tick();

    expect(component.updateAuthorDetails).not.toHaveBeenCalled();
  }));

  it('should successfully place call to update author details', fakeAsync(
    () => {
      component.authorBio = '';
      component.authorName = 'test username';
      let updatedAuthorDetails = {
        authorName: 'username',
        authorBio: 'general bio'
      };
      spyOn(ngbModal, 'open').and.returnValue({
        componentInstance: {
          authorName: '',
          authorBio: ''
        },
        result: Promise.resolve(updatedAuthorDetails)
      } as NgbModalRef);
      spyOn(component, 'updateAuthorDetails');

      component.showAuthorDetailsEditor();
      tick();

      expect(component.updateAuthorDetails).toHaveBeenCalled();
      expect(component.authorBio).toBe('general bio');
      expect(component.authorName).toBe('username');
    })
  );
});
