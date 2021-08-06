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
 * @fileoverview Unit Tests for Blog Dashboard Page service.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick, waitForAsync} from '@angular/core/testing';
import { BlogPostEditorBackendApiService } from 'domain/blog/blog-post-editor-backend-api.service';
import { AlertsService } from 'services/alerts.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { BlogDashboardPageService } from './blog-dashboard-page.service';

describe('Blog Post Page service', () => {
  let alertsService: AlertsService;
  let blogDashboardPageService: BlogDashboardPageService;
  let blogPostEditorBackendApiService: BlogPostEditorBackendApiService;
  let mockWindowRef: MockWindowRef;
  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/'
      },
      open: (url) => {},
      onhashchange() {
        return this.location._hashChange;
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
      ],
      providers: [
        BlogPostEditorBackendApiService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    blogPostEditorBackendApiService = TestBed.inject(
      BlogPostEditorBackendApiService);
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    alertsService = TestBed.inject(AlertsService);
  });

  it('should set the default active tab name', () => {
    expect(blogDashboardPageService.activeTab).toEqual('main');
  });

  it('should navigate to different tabs', function() {
    expect(blogDashboardPageService.activeTab).toEqual('main');

    blogDashboardPageService.navigateToEditorTabWithId('sampleId1234');
    mockWindowRef.nativeWindow.onhashchange();

    expect(blogDashboardPageService.activeTab).toEqual('editor_tab');

    blogDashboardPageService.navigateToMainTab();
    mockWindowRef.nativeWindow.onhashchange();

    expect(blogDashboardPageService.activeTab).toEqual('main');
  });


  it('should handle calls with unexpect paths', () => {
    expect(blogDashboardPageService.activeTab).toEqual('main');

    mockWindowRef.nativeWindow.location.hash = '';
    expect(blogDashboardPageService.activeTab).toEqual('main');
  });

  it('should set and retrieve blog post action correctly', () => {
    blogDashboardPageService.blogPostAction = 'delete';

    expect(blogDashboardPageService.blogPostAction).toEqual('delete');
  });

  it('should set and retrieve imageUploaderIsNarrow property', () => {
    blogDashboardPageService.imageUploaderIsNarrow = true;

    expect(blogDashboardPageService.imageUploaderIsNarrow).toEqual(true);

    blogDashboardPageService.imageUploaderIsNarrow = false;

    expect(blogDashboardPageService.imageUploaderIsNarrow).toEqual(false);
  });

  it('should display alert when unable to delete blog post data',
    fakeAsync(() => {
      spyOn(blogPostEditorBackendApiService, 'deleteBlogPostAsync')
        .and.returnValue(Promise.reject({status: 500}));
      spyOn(alertsService, 'addWarning');

      blogDashboardPageService.deleteBlogPost();
      tick();

      expect(blogPostEditorBackendApiService.deleteBlogPostAsync)
        .toHaveBeenCalled();
      expect(alertsService.addWarning).toHaveBeenCalledWith(
        'Failed to delete blog post.');
    }));

  it('should successfully delete blog post data',
    fakeAsync(() => {
      spyOn(blogPostEditorBackendApiService, 'deleteBlogPostAsync')
        .and.returnValue(Promise.resolve(200));
      spyOn(alertsService, 'addSuccessMessage');

      blogDashboardPageService.deleteBlogPost();
      tick();

      expect(blogPostEditorBackendApiService.deleteBlogPostAsync)
        .toHaveBeenCalled();
      expect(alertsService.addSuccessMessage).toHaveBeenCalledWith(
        'Blog Post Deleted Successfully.', 5000);
      expect(blogDashboardPageService.activeTab).toBe('main');
    }));
});
