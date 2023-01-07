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
 * @fileoverview Unit tests for the blog dashboard navbar breadcrumb.
 */

import { ComponentFixture, TestBed, fakeAsync, waitForAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { BlogDashboardNavbarBreadcrumbComponent } from 'pages/blog-dashboard-page/navbar/navbar-breadcrumb/blog-dashboard-navbar-breadcrumb.component';
import { BlogDashboardPageService } from 'pages/blog-dashboard-page/services/blog-dashboard-page.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { EventEmitter } from '@angular/core';


describe('Blog Dashboard Page Component', () => {
  let blogDashboardPageService: BlogDashboardPageService;
  let component: BlogDashboardNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<BlogDashboardNavbarBreadcrumbComponent>;
  let mockWindowRef: MockWindowRef;

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: '',
        hash: '/',
        _hashChange: null
      },
      open: (url: string) => { },
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
      declarations: [
        BlogDashboardNavbarBreadcrumbComponent,
      ],
      providers: [
        BlogDashboardPageService,
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(
      BlogDashboardNavbarBreadcrumbComponent);
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

  it('should set title when title change event is emitted', fakeAsync(() => {
    spyOn(blogDashboardPageService, 'updateNavTitleEventEmitter')
      .and.returnValue(new EventEmitter());

    component.ngOnInit();
    blogDashboardPageService.updateNavTitleEventEmitter.emit('new title');
    tick();

    expect(component.title).toEqual('new title');
  }));

  it('should add subscriptions on initialization', () => {
    spyOn(blogDashboardPageService.updateViewEventEmitter, 'subscribe');
    spyOn(blogDashboardPageService.updateNavTitleEventEmitter, 'subscribe');

    component.ngOnInit();

    expect(blogDashboardPageService.updateViewEventEmitter.subscribe)
      .toHaveBeenCalled();
    expect(blogDashboardPageService.updateNavTitleEventEmitter.subscribe)
      .toHaveBeenCalled();
  });
});
