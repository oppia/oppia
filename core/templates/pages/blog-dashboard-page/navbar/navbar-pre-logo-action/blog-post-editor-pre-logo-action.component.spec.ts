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
 * @fileoverview Unit tests for the blog post editor navbar pre logo action.
 */

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  waitForAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {BlogPostEditorNavbarPreLogoActionComponent} from 'pages/blog-dashboard-page/navbar/navbar-pre-logo-action/blog-post-editor-pre-logo-action.component';
import {BlogDashboardPageService} from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import {WindowRef} from 'services/contextual/window-ref.service';

describe('Blog Dashboard Page Component', () => {
  let blogDashboardPageService: BlogDashboardPageService;
  let component: BlogPostEditorNavbarPreLogoActionComponent;
  let fixture: ComponentFixture<BlogPostEditorNavbarPreLogoActionComponent>;
  let mockWindowRef: MockWindowRef;

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        _hashChange: null,
      },
      open: (url: string) => {},
      onhashchange() {
        return this.location._hashChange;
      },
    };
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [BlogPostEditorNavbarPreLogoActionComponent],
      providers: [
        BlogDashboardPageService,
        {
          provide: WindowRef,
          useClass: MockWindowRef,
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      BlogPostEditorNavbarPreLogoActionComponent
    );
    component = fixture.componentInstance;
    mockWindowRef = TestBed.inject(WindowRef) as unknown as MockWindowRef;
    blogDashboardPageService = TestBed.inject(BlogDashboardPageService);
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeDefined();
  });

  it('should intialize and set active tab according to url', fakeAsync(() => {
    component.ngOnInit();
    expect(component.activeTab).toBe('main');

    blogDashboardPageService.navigateToEditorTabWithId('123456sample');
    mockWindowRef.nativeWindow.onhashchange();
    tick();

    expect(component.activeTab).toBe('editor_tab');
  }));

  it('should add subscriptions on initialization', () => {
    spyOn(blogDashboardPageService.updateViewEventEmitter, 'subscribe');

    component.ngOnInit();

    expect(
      blogDashboardPageService.updateViewEventEmitter.subscribe
    ).toHaveBeenCalled();
  });
});
