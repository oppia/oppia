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
 * @fileoverview Unit tests for blog post editor.
 */

import {ChangeDetectorRef, ElementRef, NO_ERRORS_SCHEMA} from '@angular/core';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  waitForAsync,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatCardModule} from '@angular/material/card';
import {
  NgbModal,
  NgbModalModule,
  NgbModalRef,
} from '@ng-bootstrap/ng-bootstrap';
import {CapitalizePipe} from 'filters/string-utility-filters/capitalize.pipe';
import {MaterialModule} from 'modules/material.module';
import {BlogDashboardPageService} from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import {BlogPostEditorComponent} from './blog-post-editor.component';
import {BlogPostEditorBackendApiService} from 'domain/blog/blog-post-editor-backend-api.service';
import {LoaderService} from 'services/loader.service';
import {AlertsService} from 'services/alerts.service';
import {MockTranslatePipe, MockCapitalizePipe} from 'tests/unit-test-utils';
import {BlogPostData} from 'domain/blog/blog-post.model';
import {AppConstants} from 'app.constants';
import {UrlService} from 'services/contextual/url.service';
import {BlogPostUpdateService} from 'domain/blog/blog-post-update.service';
import {ImageLocalStorageService} from 'services/image-local-storage.service';
import {FormsModule} from '@angular/forms';
import {WindowDimensionsService} from 'services/contextual/window-dimensions.service';
import {UploadBlogPostThumbnailComponent} from '../modal-templates/upload-blog-post-thumbnail.component';
import {ImageReceiverComponent} from 'components/forms/custom-forms-directives/image-receiver.component';
import {PreventPageUnloadEventService} from 'services/prevent-page-unload-event.service';
import {WindowRef} from 'services/contextual/window-ref.service';
import {UserService} from 'services/user.service';
import {UserInfo} from 'domain/user/user-info.model';

describe('Blog Post Editor Component', () => {
  let fixture: ComponentFixture<BlogPostEditorComponent>;
  let component: BlogPostEditorComponent;
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
  let preventPageUnloadEventService: PreventPageUnloadEventService;
  let userService: UserService;

  let sampleBlogPostBackendDict = {
    id: 'sampleBlogId',
    displayed_author_name: 'test_user',
    title: 'sample title',
    content: '<p>hello</p>',
    thumbnail_filename: 'image.png',
    tags: ['learners', 'news'],
    url_fragment: 'sample#url',
    last_updated: '11/21/2014, 04:52:46:713463',
    published_on: '11/21/2014, 04:52:46:713463',
  };

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        reload: () => {},
      },
      sessionStorage: {
        clear: () => {},
      },
    };
  }

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
        UploadBlogPostThumbnailComponent,
        ImageReceiverComponent,
        MockTranslatePipe,
      ],
      providers: [
        {
          provide: CapitalizePipe,
          useClass: MockCapitalizePipe,
        },
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
        {
          provide: WindowDimensionsService,
          useValue: {
            isWindowNarrow: () => true,
            getResizeEvent() {
              return {
                subscribe: (callb: () => void) => {
                  callb();
                  return {
                    unsubscribe() {},
                  };
                },
              };
            },
          },
        },
        PreventPageUnloadEventService,
        BlogDashboardPageService,
        BlogPostUpdateService,
        BlogPostEditorBackendApiService,
        LoaderService,
        AlertsService,
        UrlService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogPostEditorComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
    loaderService = TestBed.inject(LoaderService);
    blogPostEditorBackendApiService = TestBed.inject(
      BlogPostEditorBackendApiService
    );
    alertsService = TestBed.inject(AlertsService);
    blogPostUpdateService = TestBed.inject(BlogPostUpdateService);
    imageLocalStorageService = TestBed.inject(ImageLocalStorageService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    preventPageUnloadEventService = TestBed.inject(
      PreventPageUnloadEventService
    );
    ngbModal = TestBed.inject(NgbModal);
    userService = TestBed.inject(UserService);
    sampleBlogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict
    );
    spyOn(urlService, 'getBlogPostIdFromUrl').and.returnValue('sampleBlogId');
    spyOn(preventPageUnloadEventService, 'addListener');
    spyOn(preventPageUnloadEventService, 'removeListener');
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue([
      'default-image-url-png',
      'default-image-url-webp',
    ]);
    component.ngOnInit();
    component.titleInput = new ElementRef(document.createElement('div'));
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should initialize', fakeAsync(() => {
    const sampleUserInfoBackendObject = {
      roles: ['USER_ROLE'],
      is_moderator: false,
      is_curriculum_admin: false,
      is_super_admin: false,
      is_topic_manager: false,
      can_create_collections: true,
      preferred_site_language_code: null,
      username: 'tester',
      email: 'test@test.com',
      user_is_logged_in: true,
    };
    const sampleUserInfo = UserInfo.createFromBackendDict(
      sampleUserInfoBackendObject
    );
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(component, 'initEditor');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough();
    spyOn(userService, 'getUserInfoAsync').and.returnValue(
      Promise.resolve(sampleUserInfo)
    );

    component.ngOnInit();
    tick();

    expect(loaderService.showLoadingScreen).toHaveBeenCalled();
    expect(component.blogPostId).toEqual('');
    expect(component.MAX_CHARS_IN_BLOG_POST_TITLE).toBe(
      AppConstants.MAX_CHARS_IN_BLOG_POST_TITLE
    );
    expect(component.initEditor).toHaveBeenCalled;
    expect(component.authorProfilePicPngUrl).toEqual('default-image-url-png');
    expect(component.authorProfilePicWebpUrl).toEqual('default-image-url-webp');
    expect(windowDimensionsService.isWindowNarrow).toHaveBeenCalled();
    expect(component.windowIsNarrow).toBe(true);
    expect(loaderService.hideLoadingScreen).not.toHaveBeenCalled();
  }));

  it('should set default profile pictures when username is null', fakeAsync(() => {
    let userInfo = {
      getUsername: () => null,
      isSuperAdmin: () => true,
    };
    spyOn(component, 'initEditor');
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
    spyOn(windowDimensionsService, 'isWindowNarrow').and.callThrough();
    spyOn(userService, 'getUserInfoAsync').and.resolveTo(userInfo as UserInfo);

    component.ngOnInit();
    tick();

    expect(component.authorProfilePicPngUrl).toEqual(
      '/assets/images/avatar/user_blue_150px.png'
    );
    expect(component.authorProfilePicWebpUrl).toEqual(
      '/assets/images/avatar/user_blue_150px.webp'
    );
  }));

  it('should set image uploader window size', () => {
    component.uploadedImageDataUrl = 'image.png';

    component.ngOnInit();
    windowDimensionsService.getResizeEvent();

    expect(blogDashboardPageService.imageUploaderIsNarrow).toBe(true);
  });

  it('should get schema', () => {
    expect(component.getSchema()).toEqual(component.HTML_SCHEMA);
  });

  it('should successfully fetch blog post editor data', fakeAsync(() => {
    let blogPostEditorData = {
      displayedAuthorName: 'test_user',
      listOfDefaulTags: ['news', 'Learners'],
      maxNumOfTags: 2,
      blogPostDict: sampleBlogPostData,
    };
    component.blogPostId = 'sampleBlogId';
    component.titleEditorIsActive = false;
    spyOn(
      blogPostEditorBackendApiService,
      'fetchBlogPostEditorData'
    ).and.returnValue(Promise.resolve(blogPostEditorData));

    component.initEditor();
    tick();

    expect(
      blogPostEditorBackendApiService.fetchBlogPostEditorData
    ).toHaveBeenCalled();
    expect(component.authorName).toEqual('test_user');
    expect(component.blogPostData).toEqual(sampleBlogPostData);
    expect(component.defaultTagsList).toEqual(['news', 'Learners']);
    expect(component.maxAllowedTags).toEqual(2);
    expect(component.thumbnailDataUrl).toEqual(
      '/assetsdevhandler/blog_post/sampleBlogId/assets/thumbnail' + '/image.png'
    );
    expect(blogDashboardPageService.imageUploaderIsNarrow).toBeTrue();
    expect(component.dateTimeLastSaved).toEqual(
      'November 21, 2014 at 04:52 AM'
    );
    expect(component.title).toEqual('sample title');
    expect(component.contentEditorIsActive).toBeFalse();
    expect(component.lastChangesWerePublished).toBeTrue();
    expect(component.titleEditorIsActive).toBeFalse();
    expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();
  }));

  it(
    'should activate title editor if blog post does not have a title when it' +
      ' loads',
    fakeAsync(() => {
      let sampleBackendDict = {
        id: 'sampleBlogId',
        displayed_author_name: 'test_user',
        title: '',
        content: '',
        thumbnail_filename: null,
        tags: [],
        url_fragment: '',
      };
      let blogPostEditorData = {
        displayedAuthorName: 'test_user',
        listOfDefaulTags: ['news', 'Learners'],
        maxNumOfTags: 2,
        blogPostDict: BlogPostData.createFromBackendDict(sampleBackendDict),
      };
      component.blogPostId = 'sampleBlogId';
      component.titleEditorIsActive = false;
      spyOn(
        blogPostEditorBackendApiService,
        'fetchBlogPostEditorData'
      ).and.returnValue(Promise.resolve(blogPostEditorData));

      component.initEditor();
      tick();

      expect(
        blogPostEditorBackendApiService.fetchBlogPostEditorData
      ).toHaveBeenCalled();
      expect(component.titleEditorIsActive).toBeTrue();
    })
  );

  it('should display alert when unable to fetch blog post editor data', fakeAsync(() => {
    spyOn(
      blogPostEditorBackendApiService,
      'fetchBlogPostEditorData'
    ).and.returnValue(Promise.reject(500));
    spyOn(blogDashboardPageService, 'navigateToMainTab');
    spyOn(alertsService, 'addWarning');

    component.initEditor();
    tick();

    expect(
      blogPostEditorBackendApiService.fetchBlogPostEditorData
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to get Blog Post Data. The Blog Post was either' +
        ' deleted or the Blog Post ID is invalid.'
    );
    expect(blogDashboardPageService.navigateToMainTab).toHaveBeenCalled();
  }));

  it('should update local title value when title is unique and valid', fakeAsync(() => {
    spyOn(
      blogPostEditorBackendApiService,
      'doesPostWithGivenTitleAlreadyExistAsync'
    ).and.returnValue(Promise.resolve(false));
    spyOn(blogPostUpdateService, 'setBlogPostTitle');
    component.title = 'Sample title changed';

    component.blogPostData = sampleBlogPostData;
    component.updateLocalTitleValue();

    expect(blogPostUpdateService.setBlogPostTitle).toHaveBeenCalledWith(
      sampleBlogPostData,
      'Sample title changed'
    );
    expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
    expect(component.blogPostData.titleIsDuplicate).toBeFalse();
  }));

  it(
    'should not update title and should raise error when the title is' +
      ' duplicate',
    fakeAsync(() => {
      spyOn(
        blogPostEditorBackendApiService,
        'doesPostWithGivenTitleAlreadyExistAsync'
      ).and.returnValue(Promise.resolve(true));
      spyOn(alertsService, 'addWarning');
      component.title = 'Sample title changed';

      component.blogPostData = sampleBlogPostData;
      component.updateLocalTitleValue();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Blog Post with the given title exists already. Please use a' +
          ' different title.'
      );
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(component.blogPostData.titleIsDuplicate).toBeTrue();
    })
  );

  it(
    'should not update title and should raise error when the checking for' +
      'uniqueness of the title fails',
    fakeAsync(() => {
      spyOn(
        blogPostEditorBackendApiService,
        'doesPostWithGivenTitleAlreadyExistAsync'
      ).and.returnValue(Promise.reject('Internal Server Error'));
      spyOn(alertsService, 'addWarning');
      component.title = 'Sample title changed';

      component.blogPostData = sampleBlogPostData;
      component.updateLocalTitleValue();
      tick();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to check if title is unique. ' +
          'Internal Error: Internal Server Error'
      );
      expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
      expect(component.blogPostData.titleIsDuplicate).toBeFalse();
    })
  );

  it('should validate title pattern', () => {
    //  A valid title contains words (containing a-zA-Z0-9) separated by spaces,
    // hyphens(-), ampersand(&) and colon(:).
    // Should return true if the title is valid.
    component.title = 'valid & correct: title';

    expect(component.isTitlePatternValid()).toBeTrue();

    // Title contains invalid special characters.
    component.title = 'invalid# character';

    expect(component.isTitlePatternValid()).toBeFalse();

    component.title = 'invalid % character';

    expect(component.isTitlePatternValid()).toBeFalse();
  });

  it('should update local edited content', () => {
    const changeDetectorRef =
      fixture.debugElement.injector.get(ChangeDetectorRef);
    const detectChangesSpy = spyOn(
      changeDetectorRef.constructor.prototype,
      'detectChanges'
    );
    component.localEditedContent = '';
    component.updateLocalEditedContent('<p>Hello Worlds</p>');

    expect(component.localEditedContent).toBe('<p>Hello Worlds</p>');
    expect(detectChangesSpy).toHaveBeenCalled();
  });

  it('should update local content value', fakeAsync(() => {
    spyOn(blogPostUpdateService, 'setBlogPostContent');
    component.localEditedContent = '<p>Sample content changed</p>';

    component.blogPostData = sampleBlogPostData;
    component.updateContentValue();
    tick();

    expect(blogPostUpdateService.setBlogPostContent).toHaveBeenCalledWith(
      sampleBlogPostData,
      '<p>Sample content changed</p>'
    );
    expect(component.contentEditorIsActive).toBe(false);
    expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
  }));

  it('should cancel edit of blog post content and should close RTE', () => {
    component.blogPostData = sampleBlogPostData;
    component.contentEditorIsActive = true;

    component.cancelEdit();

    expect(component.contentEditorIsActive).toBe(false);
  });

  it(
    'should cancel edit of blog post content and should not' +
      ' close RTE if content is empty',
    () => {
      component.blogPostData = sampleBlogPostData;
      component.blogPostData.content = '';
      component.contentEditorIsActive = true;

      component.cancelEdit();

      expect(component.contentEditorIsActive).toBe(true);
    }
  );

  it(
    'should call update blog post if blog post passes validation' +
      'when user saves blog post as draft',
    () => {
      spyOn(component, 'updateBlogPostData');
      spyOn(sampleBlogPostData, 'validate').and.returnValue([]);
      component.blogPostData = sampleBlogPostData;

      component.saveDraft();

      expect(component.saveInProgress).toBeTrue();
      expect(component.updateBlogPostData).toHaveBeenCalledWith(false);
    }
  );

  it(
    'should call raise errors if blog post does not pass validation' +
      'when user saves blog post as draft',
    () => {
      spyOn(component, 'updateBlogPostData');
      spyOn(alertsService, 'addWarning');
      component.blogPostData = sampleBlogPostData;
      component.blogPostData.title = '';
      component.saveInProgress = true;

      component.saveDraft();

      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Please fix the errors.'
      );
      expect(component.saveInProgress).toBe(false);
    }
  );

  it('should update blog post data successfully in the backend', fakeAsync(() => {
    component.blogPostData = sampleBlogPostData;
    component.blogPostId = sampleBlogPostData.id;
    component.saveInProgress = true;
    component.publishingInProgress = true;
    spyOn(blogPostUpdateService, 'getBlogPostChangeDict').and.returnValue({});
    spyOn(blogPostUpdateService, 'setBlogPostTags');
    spyOn(
      blogPostEditorBackendApiService,
      'updateBlogPostDataAsync'
    ).and.returnValue(Promise.resolve({blogPostDict: sampleBlogPostData}));
    spyOn(alertsService, 'addSuccessMessage');

    component.updateBlogPostData(false);
    tick();

    expect(component.saveInProgress).toBe(false);
    expect(blogPostUpdateService.setBlogPostTags).toHaveBeenCalled();
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Blog Post Saved Successfully.'
    );
    expect(preventPageUnloadEventService.removeListener).toHaveBeenCalled();

    component.updateBlogPostData(true);
    tick();

    expect(component.publishingInProgress).toBe(false);
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Blog Post Saved and Published Successfully.'
    );
  }));

  it('should display alert when unable to update blog post data', fakeAsync(() => {
    component.blogPostData = sampleBlogPostData;
    component.blogPostId = sampleBlogPostData.id;
    component.saveInProgress = true;
    component.publishingInProgress = true;
    spyOn(blogPostUpdateService, 'getBlogPostChangeDict').and.returnValue({});
    spyOn(
      blogPostEditorBackendApiService,
      'updateBlogPostDataAsync'
    ).and.returnValue(Promise.reject('status: 500'));
    spyOn(alertsService, 'addWarning');

    component.updateBlogPostData(false);
    tick();

    expect(
      blogPostEditorBackendApiService.updateBlogPostDataAsync
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to save Blog Post. Internal Error: status: 500'
    );
    expect(component.publishingInProgress).toBe(false);
    expect(component.saveInProgress).toBe(false);
  }));

  it('should get formatted date string from the timestamp in milliseconds', () => {
    // This corresponds to Fri, 21 Nov 2014 04:52 AM GMT.
    let DATE = '11/21/2014, 04:52:46:713463';
    expect(component.getDateStringInWords(DATE)).toBe(
      'November 21, 2014 at 04:52 AM'
    );

    DATE = '01/16/2027, 09:45:46:600000';
    expect(component.getDateStringInWords(DATE)).toBe(
      'January 16, 2027 at 09:45 AM'
    );

    DATE = '02/02/2018, 12:30:46:608990';
    expect(component.getDateStringInWords(DATE)).toBe(
      'February 2, 2018 at 12:30 PM'
    );
  });

  it('should cancel delete blog post model', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(blogDashboardPageService, 'deleteBlogPost');

    component.deleteBlogPost();
    tick();

    expect(blogDashboardPageService.deleteBlogPost).not.toHaveBeenCalled();
  }));

  it('should successfully place call to delete blog post model', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(blogDashboardPageService, 'deleteBlogPost');

    component.deleteBlogPost();
    tick();

    expect(blogDashboardPageService.deleteBlogPost).toHaveBeenCalled();
  }));

  it('should open preview of the blog post model', () => {
    spyOn(ngbModal, 'open');
    component.blogPostData = sampleBlogPostData;

    component.showPreview();

    expect(blogDashboardPageService.blogPostData).toEqual(sampleBlogPostData);
    expect(ngbModal.open).toHaveBeenCalled();
  });

  it('should cancel publishing blog post model', fakeAsync(() => {
    component.blogPostData = sampleBlogPostData;
    component.maxAllowedTags = 3;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(component, 'updateBlogPostData');

    component.publishBlogPost();

    expect(component.publishingInProgress).toBe(true);

    tick();

    expect(component.updateBlogPostData).not.toHaveBeenCalled();
    expect(component.publishingInProgress).toBe(false);
  }));

  it('should successfully place call to publish blog post model', fakeAsync(() => {
    component.blogPostData = sampleBlogPostData;
    component.maxAllowedTags = 3;
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve(),
    } as NgbModalRef);
    spyOn(component, 'updateBlogPostData');

    component.publishBlogPost();
    tick();

    expect(component.updateBlogPostData).toHaveBeenCalledWith(true);
  }));

  it('should cancel blog post thumbnail upload', fakeAsync(() => {
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.reject(),
    } as NgbModalRef);
    spyOn(component, 'postImageDataToServer');

    component.showuploadThumbnailModal();
    tick();

    expect(component.postImageDataToServer).not.toHaveBeenCalled();
  }));

  it('should successfully place call to post thumbnail to server', fakeAsync(() => {
    component.thumbnailDataUrl = 'sample.png';
    spyOn(imageLocalStorageService, 'flushStoredImagesData');
    spyOn(ngbModal, 'open').and.returnValue({
      result: Promise.resolve('sample-url-string'),
    } as NgbModalRef);
    spyOn(component, 'postImageDataToServer');

    component.showuploadThumbnailModal();
    tick();

    expect(component.postImageDataToServer).toHaveBeenCalledWith();
    expect(component.thumbnailDataUrl).toEqual('sample-url-string');
    expect(imageLocalStorageService.flushStoredImagesData).toHaveBeenCalled();
  }));

  it('should change tags for blog post successfully', () => {
    component.blogPostData = sampleBlogPostData;
    component.maxAllowedTags = 4;

    component.onTagChange('sampleTag');
    expect(component.blogPostData.tags).toEqual([
      'learners',
      'news',
      'sampleTag',
    ]);

    component.onTagChange('sampleTag');
    expect(component.blogPostData.tags).toEqual(['learners', 'news']);
    expect(preventPageUnloadEventService.addListener).toHaveBeenCalled();
  });

  it('should display alert when unable to post thumbnail data', fakeAsync(() => {
    component.blogPostData = sampleBlogPostData;
    let imagesData = [
      {
        filename: 'imageFilename1',
        imageBlob: new Blob([''], {type: 'image/jpeg'}),
      },
    ];
    spyOn(
      blogPostEditorBackendApiService,
      'postThumbnailDataAsync'
    ).and.returnValue(Promise.reject('status: 500'));
    spyOn(alertsService, 'addWarning');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
      imagesData
    );

    component.postImageDataToServer();
    tick();

    expect(
      blogPostEditorBackendApiService.postThumbnailDataAsync
    ).toHaveBeenCalled();
    expect(alertsService.addWarning).toHaveBeenCalledWith(
      'Failed to save thumbnail data. Internal Error: status: 500'
    );
  }));

  it('should update thumbnail data successfully in the backend', fakeAsync(() => {
    let imagesData = [
      {
        filename: 'imageFilename1',
        imageBlob: new Blob([''], {type: 'image/jpeg'}),
      },
    ];
    spyOn(
      blogPostEditorBackendApiService,
      'postThumbnailDataAsync'
    ).and.returnValue(Promise.resolve());
    spyOn(alertsService, 'addSuccessMessage');
    spyOn(imageLocalStorageService, 'getStoredImagesData').and.returnValue(
      imagesData
    );
    component.blogPostData = sampleBlogPostData;

    component.postImageDataToServer();
    tick();

    expect(
      blogPostEditorBackendApiService.postThumbnailDataAsync
    ).toHaveBeenCalled();
    expect(blogDashboardPageService.imageUploaderIsNarrow).toBe(true);
    expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
      'Thumbnail Saved Successfully.'
    );
  }));

  it('should activate title editor', () => {
    component.titleEditorIsActive = false;
    spyOn(component.titleInput.nativeElement, 'focus');

    component.activateTitleEditor();

    expect(component.titleInput.nativeElement.focus).toHaveBeenCalled();
    expect(component.titleEditorIsActive).toBeTrue();
  });

  it('should correctly return if the publish button is disabled or not', () => {
    component.blogPostData = sampleBlogPostData;
    spyOn(component.blogPostData, 'prepublishValidate').and.returnValues(
      [],
      [],
      [],
      ['some issues']
    );
    component.newChangesAreMade = true;
    component.lastChangesWerePublished = true;

    component.blogPostData.titleIsDuplicate = true;

    expect(component.isPublishButtonDisabled()).toBeTrue();

    component.blogPostData.titleIsDuplicate = false;
    expect(component.isPublishButtonDisabled()).toBe(false);

    component.newChangesAreMade = false;

    expect(component.isPublishButtonDisabled()).toBe(true);

    component.lastChangesWerePublished = false;

    expect(component.isPublishButtonDisabled()).toBe(false);

    // As prepublish validation fails.
    expect(component.isPublishButtonDisabled()).toBe(true);
  });
});
