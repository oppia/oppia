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
 * @fileoverview Component for resetting image regions editor.
 */

import { ChangeDetectorRef } from '@angular/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, waitForAsync, fakeAsync, tick } from '@angular/core/testing';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MaterialModule } from 'modules/material.module';
import { MatCardModule } from '@angular/material/card';
import { CapitalizePipe } from 'filters/string-utility-filters/capitalize.pipe';
import { AngularHtmlBindWrapperDirective } from 'components/angular-html-bind/angular-html-bind-wrapper.directive';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { SchemaBasedEditorDirective } from 'components/forms/schema-based-editors/schema-based-editor.directive';
import { BlogPostEditorComponent } from './blog-post-editor.component';
import { NgbModal, NgbModalModule, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { LoaderService } from 'services/loader.service';
import { AlertsService } from 'services/alerts.service';
import { MockTranslatePipe, MockCapitalizePipe } from 'tests/unit-test-utils';
import { BlogPostData } from 'domain/blog/blog-post.model';
import { AppConstants } from 'app.constants';
import { UrlService } from 'services/contextual/url.service';
import { BlogPostUpdateService } from 'domain/blog/blog-post-update.service';
import { ImageLocalStorageService } from 'services/image-local-storage.service';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';


describe('Blog Post Editor Component', () => {
  let fixture: ComponentFixture<BlogPostEditorComponent>;
  let component: BlogPostEditorComponent;
  let urlInterpolationService: UrlInterpolationService;
  let blogDashboardPageService: BlogDashboardPageService;
  let blogPostUpdateService: BlogPostUpdateService;
  let loaderService: LoaderService;
  let ngbModal: NgbModal;
  let blogPostEditorBackendApiService: BlogPostEditorBackendApiService;
  let alertsService: AlertsService;
  let urlService: UrlService;
  let sampleBlogPostData: BlogPostData;
  let imageLocalStorageService: ImageLocalStorageService;
  let windowDimensionsService: WindowDimensionsService;
  let resizeEvent = new Event('resize');

  let sampleBlogPostBackendDict = {
    id: 'sampleBlogId',
    author_username: 'test_user',
    title: 'sample_title',
    content: '<p>hello</p>',
    thumbnail_filename: 'image',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '11/21/2014, 09:45:00',
  };

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        MatButtonToggleModule,
        NgbModalModule,
        MaterialModule,
        MatCardModule,
        FormsModule,
      ],
      declarations: [
        BlogPostEditorComponent,
        SchemaBasedEditorDirective,
        AngularHtmlBindWrapperDirective,
        MockTranslatePipe
      ],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent: () => of(resizeEvent)
          }
        },
        BlogDashboardPageService,
        BlogPostUpdateService,
        BlogPostEditorBackendApiService,
        ChangeDetectorRef,
        LoaderService,
        UrlInterpolationService,
        AlertsService,
        UrlService,
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogPostEditorComponent);
    component = fixture.componentInstance;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
    blogPostEditorBackendApiService = TestBed.inject(
      BlogPostEditorBackendApiService);
    alertsService = TestBed.inject(AlertsService);
    blogPostUpdateService = TestBed.inject(BlogPostUpdateService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    sampleBlogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
    spyOn(urlService, 'getBlogPostIdFromUrl').and.returnValue('sampleBlogId');
    component.ngOnInit();
  });

  beforeEach(() => {
    component.defaultTagsList = [];
    component.maxAllowedTags = null;
    component.thumbnailDataUrl = null;
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', () => {
    let expectedBlogPost = BlogPostData.createInterstitialBlogPost();
    let defaultImageUrl = 'banner_image_url';
    spyOn(urlInterpolationService, 'getStaticImageUrl')
      .and.returnValue(defaultImageUrl);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(component, 'initEditor');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough;

    component.ngOnInit();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.blogPostData).toEqual(expectedBlogPost);
    expect(component.blogPostId).toEqual(undefined);
    expect(component.MAX_CHARS_IN_BLOG_POST_TITLE).toBe(
      AppConstants.MAX_CHARS_IN_BLOG_POST_TITLE);
    expect(component.initEditor).toHaveBeenCalled;
    expect(loaderService.hideLoadingScreen).toHaveBeenCalled();
    expect(component.DEFAULT_PROFILE_PICTURE_URL).toEqual(defaultImageUrl);
    expect(windowDimensionsService.isWindowNarrow()).toHaveBeenCalled;
    expect(component.windowIsNarrow).toBe(true);
  });

  it('should get schema', () => {
    expect(component.getSchema())
      .toEqual(component.HTML_SCHEMA);
  });

  it('should return true for header enabled callback', () => {
    expect(component.headersAreEnabledCallBack()).toEqual(true);
  });

  it('should successfully fetch blog post editor data', fakeAsync(() => {
    let blogPostEditorData = {
      username: 'test_user',
      profilePictureDataUrl: 'sample_url',
      listOfDefaulTags: ['news', 'Learners'],
      maxNumOfTags: 2,
      blogPostDict: sampleBlogPostData,
    };
    spyOn(blogPostEditorBackendApiService, 'fetchBlogPostEditorData')
      .and.returnValue(Promise.resolve(blogPostEditorData));

    component.initEditor();
    tick();

    expect(blogPostEditorBackendApiService.fetchBlogPostEditorData)
      .toHaveBeenCalled();
    expect(component.authorUsername).toEqual('test_user');
    expect(component.blogPostData).toEqual(sampleBlogPostData);
    expect(component.authorProfilePictureUrl).toEqual('sample_url');
    expect(component.defaultTagsList).toEqual(['news', 'Learners']);
    expect(component.maxAllowedTags).toEqual(2);
    expect(component.thumbnailDataUrl).toEqual(
      '/assetsdevhandler/blog_post/sampleId/assets/blog_post_thumbnail' +
      '/image.png');
    expect(component.dateTimeLastSaved).toEqual(
      'November 21, 2014 at 12:00 AM');
    expect(component.title).toEqual('sample_title');
    expect(component.contentEditorIsActive).toEqual(false);
  }));

  it('should display alert when unable to fetch blog post editor data',
    fakeAsync(() => {
      spyOn(blogPostEditorBackendApiService, 'fetchBlogPostEditorData')
        .and.returnValue(Promise.reject('status: 500'));
      spyOn(alertsService, 'addWarning');

      component.initEditor();
      tick();

      expect(blogPostEditorBackendApiService.fetchBlogPostEditorData)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to get blog post data');
    }));

  it('should update local title value', () => {
    spyOn(blogPostUpdateService, 'setBlogPostTitle');
    component.title = 'Sample title changed';

    component.blogPostData = sampleBlogPostData;
    component.updateLocalTitleValue();

    expect(blogPostUpdateService.setBlogPostTitle).toHaveBeenCalled();
    expect(component.blogPostData.title).toBe('Sample title changed');
  });

  it('should update local content value', () => {
    spyOn(blogPostUpdateService, 'setBlogPostContent');
    component.localEdittedContent = '<p>Sample content changed</p>';

    component.blogPostData = sampleBlogPostData;
    component.updateContentValue();

    expect(blogPostUpdateService.setBlogPostContent).toHaveBeenCalled();
    expect(component.blogPostData.content).toBe(
      '<p>Sample content changed</p>');
    expect(component.contentEditorIsActive).toBe(false);
  });

  it('should cancel edit of blog post content and should close RTE', () => {
    component.blogPostData = sampleBlogPostData;
    component.contentEditorIsActive = true;

    component.cancelEdit();

    expect(component.contentEditorIsActive).toBe(false);
  });

  it('should cancel edit of blog post content and should not' +
  ' close RTE if content is empty', () => {
    component.blogPostData = sampleBlogPostData;
    component.blogPostData.content = '';
    component.contentEditorIsActive = true;

    component.cancelEdit();

    expect(component.contentEditorIsActive).toBe(true);
  });

  it('should call update blog post if blog post passes validation' +
  'when user saves blog post as draft', () => {
    spyOn(component, 'updateBlogPostData');
    component.blogPostData = sampleBlogPostData;

    component.saveDraft();

    expect(component.updateBlogPostData).toHaveBeenCalledWith(false);
  });

  it('should call raise errors if blog post does not pass validation' +
  'when user saves blog post as draft', () => {
    spyOn(component, 'updateBlogPostData');
    spyOn(alertsService, 'addWarning');
    component.blogPostData = sampleBlogPostData;
    component.blogPostData.title = '';

    component.saveDraft();

    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Please fix the errors.');
  });

  it('should update blog post data successfully in the backend',
    fakeAsync(() => {
      component.blogPostData = sampleBlogPostData;
      component.blogPostId = sampleBlogPostData.id;
      spyOn(blogPostUpdateService, 'getBlogPostChangeDict')
        .and.returnValue({});
      spyOn(blogPostUpdateService, 'setBlogPostTags');
      spyOn(blogPostEditorBackendApiService, 'updateBlogPostDataAsync')
        .and.returnValue(Promise.resolve({blogPostDict: sampleBlogPostData}));
      spyOn(alertsService, 'addSuccessMessage');

      component.updateBlogPostData(false);
      tick();

      expect(blogPostUpdateService.setBlogPostTags).toHaveBeenCalled();
      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Blog Post Saved Succesfully.');

      component.updateBlogPostData(true);
      tick();

      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Blog Post Saved and Published Succesfully.');
    }));

  it('should display alert when unable to update blog post data',
    fakeAsync(() => {
      component.blogPostData = sampleBlogPostData;
      component.blogPostId = sampleBlogPostData.id;
      spyOn(blogPostUpdateService, 'getBlogPostChangeDict')
        .and.returnValue({});
      spyOn(blogPostEditorBackendApiService, 'updateBlogPostDataAsync')
        .and.returnValue(Promise.reject({ status: 500 }));
      spyOn(alertsService, 'addWarning');

      component.updateBlogPostData(false);
      tick();

      expect(blogPostEditorBackendApiService.updateBlogPostDataAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to save Blog Post. Internal Error: { status: 500}');
    }));

  it('should get formatted date string from the timestamp in milliseconds',
    () => {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      let DATE = '11/21/2014';
      expect(component.getDateStringInWords(DATE))
        .toBe('November 21, 2014 at 12:00 AM');

      DATE = '01/16/2027';
      expect(component.getDateStringInWords(DATE))
        .toBe('January 16, 2027 at 12:00 AM');

      DATE = '02/02/2018';
      expect(component.getDateStringInWords(DATE))
        .toBe('February 2, 2018 at 12:00 AM');
    });

  it('should cancel delete blog post model', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(blogDashboardPageService, 'deleteBlogPost');

    component.deleteBlogPost();
    expect(blogDashboardPageService.deleteBlogPost)
      .not.toHaveBeenCalled();
  });

  it('should successfully place call to delete blog post model', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);
    spyOn(blogDashboardPageService, 'deleteBlogPost');

    component.deleteBlogPost();
    expect(blogDashboardPageService.deleteBlogPost).toHaveBeenCalled();
  });

  it('should cancel publishing blog post model', () => {
    component.blogPostData = sampleBlogPostData;
    component.maxAllowedTags = 3;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(component, 'updateBlogPostData');

    component.publishBlogPost();
    expect(component.updateBlogPostData).not.toHaveBeenCalled();
  });

  it('should successfully place call to publish blog post model', () => {
    component.blogPostData = sampleBlogPostData;
    component.maxAllowedTags = 3;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve()
    } as NgbModalRef);
    spyOn(component, 'updateBlogPostData');

    component.publishBlogPost();
    expect(component.updateBlogPostData).toHaveBeenCalledWith(true);
  });

  it('should cancel blog post thumbnail upload', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject()
    } as NgbModalRef);
    spyOn(component, 'postImageDataToServer');

    component.showuploadThumbnailModal();
    expect(component.postImageDataToServer).not.toHaveBeenCalled();
  });

  it('should successfully place call to post thumbnail to server', () => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve('sample-url-string')
    } as NgbModalRef);
    spyOn(component, 'postImageDataToServer');

    component.showuploadThumbnailModal();
    expect(component.postImageDataToServer).toHaveBeenCalledWith();
    expect(component.thumbnailDataUrl).toEqual('sample-url-string');
  });

  it('should change tags for blog post successfully', () => {
    component.blogPostData = sampleBlogPostData;

    component.onTagChange('sampleTag');
    expect(component.blogPostData.tags).toEqual(
      ['learners', 'news', 'sampleTag']);

    component.onTagChange('sampleTag');
    expect(component.blogPostData.tags).toEqual(
      ['learners', 'news']);
  });

  it('should display alert when unable to post thumbnail data',
    fakeAsync(() => {
      let imagesData = [{
        filename: 'imageFilename1',
        imageBlob: new Blob([''], { type: 'image/jpeg' })
      }];
      spyOn(blogPostEditorBackendApiService, 'postThumbnailDataAsync')
        .and.returnValue(Promise.reject({ status: 500 }));
      spyOn(alertsService, 'addWarning');
      spyOn(imageLocalStorageService, 'getStoredImagesData')
        .and.returnValue(imagesData);

      component.postImageDataToServer();
      tick();

      expect(blogPostEditorBackendApiService.postThumbnailDataAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to save thumbnail data. Internal Error: { status: 500}');
    }));


  it('should update thumbnail data successfully in the backend',
    fakeAsync(() => {
      let imagesData = [{
        filename: 'imageFilename1',
        imageBlob: new Blob([''], { type: 'image/jpeg' })
      }];
      spyOn(blogPostEditorBackendApiService, 'postThumbnailDataAsync')
        .and.returnValue(Promise.resolve());
      spyOn(alertsService, 'addSuccessMessage');
      spyOn(imageLocalStorageService, 'getStoredImagesData')
        .and.returnValue(imagesData);

      component.postImageDataToServer();
      tick();

      expect(blogPostEditorBackendApiService.postThumbnailDataAsync)
        .toHaveBeenCalled();
      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Thumbnail Saved Successfully.');
    }));
});
