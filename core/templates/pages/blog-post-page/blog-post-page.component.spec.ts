// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Unit tests for Blog Home Page Component.
 */

import { Pipe } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync} from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MaterialModule } from 'modules/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BlogPostPageComponent } from 'pages/blog-post-page/blog-post-page.component';
import { WindowRef } from 'services/contextual/window-ref.service';
import { WindowDimensionsService } from 'services/contextual/window-dimensions.service';
import { LoaderService } from 'services/loader.service';
import { MockTranslatePipe } from 'tests/unit-test-utils';
import { UrlService } from 'services/contextual/url.service';
import { BlogCardComponent } from 'pages/blog-dashboard-page/blog-card/blog-card.component';
import { UrlInterpolationService } from 'domain/utilities/url-interpolation.service';
import { UserService } from 'services/user.service';

// This throws "TS2307". We need to
// suppress this error because rte-text-components are not strictly typed yet.
// @ts-ignore
import { RichTextComponentsModule } from 'rich_text_components/rich-text-components.module';
import { BlogPostBackendDict, BlogPostData } from 'domain/blog/blog-post.model';
import { SharingLinksComponent } from 'components/common-layout-directives/common-elements/sharing-links.component';
import { BlogPostPageService } from './services/blog-post-page.service';

@Pipe({name: 'truncate'})
class MockTruncatePipe {
  transform(value: string, params: Object | undefined): string {
    return value;
  }
}

class MockWindowRef {
  nativeWindow = {
    location: {
      pathname: 'blog/',
      href: 'http://localhost/blog/blog-test',
      toString() {
        return 'http://localhost/test_path';
      },
      reload: () => { }
    }
  };
}

class MockWindowDimensionsService {
  getWidth(): number {
    return 766;
  }
}

describe('Blog home page component', () => {
  let windowDimensionsService: WindowDimensionsService;
  let urlService: UrlService;
  let loaderService: LoaderService;
  let urlInterpolationService: UrlInterpolationService;
  let blogPostPageService: BlogPostPageService;
  let component: BlogPostPageComponent;
  let mockWindowRef: MockWindowRef;
  let fixture: ComponentFixture<BlogPostPageComponent>;
  let userService: UserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule,
        NgbModule,
        ReactiveFormsModule,
        MaterialModule,
        RichTextComponentsModule,
      ],
      declarations: [
        BlogPostPageComponent,
        BlogCardComponent,
        MockTranslatePipe,
        MockTruncatePipe,
        SharingLinksComponent
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: WindowDimensionsService,
          useClass: MockWindowDimensionsService
        },
        LoaderService,
        BlogPostPageService
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlogPostPageComponent);
    component = fixture.componentInstance;
    urlService = TestBed.inject(UrlService);
    loaderService = TestBed.inject(LoaderService);
    blogPostPageService = TestBed.inject(BlogPostPageService);
    mockWindowRef = TestBed.inject(WindowRef) as MockWindowRef;
    urlInterpolationService = TestBed.inject(UrlInterpolationService);
    windowDimensionsService = TestBed.inject(WindowDimensionsService);
    userService = TestBed.inject(UserService);
    spyOn(loaderService, 'showLoadingScreen');
    spyOn(loaderService, 'hideLoadingScreen');
  });

  it('should get the blog post page url', () => {
    expect(component.getPageUrl()).toBe(
      'http://localhost/blog/blog-test'
    );
  });

  it('should run the copy command successfully', () => {
    let dummyDivElement = document.createElement('div');
    let dummyTextNode = document.createTextNode('Text to be copied');
    dummyDivElement.className = 'class-name';
    dummyDivElement.appendChild(dummyTextNode);
    let dummyDocumentFragment = document.createDocumentFragment();
    dummyDocumentFragment.appendChild(dummyDivElement);
    spyOn(
      document, 'getElementsByClassName'
    ).withArgs('class-name').and.returnValue(dummyDocumentFragment.children);
    spyOn(document, 'execCommand').withArgs('copy');
    spyOn($.fn, 'tooltip');
    component.copyLink('class-name');
    expect(document.execCommand).toHaveBeenCalled();
  });

  it('should get formatted date string from the timestamp in milliseconds',
    () => {
      // This corresponds to Fri, 21 Nov 2014 09:45:00 GMT.
      let DATE = '11/21/2014';
      expect(component.getDateStringInWords(DATE))
        .toBe('November 21, 2014');

      DATE = '01/16/2027';
      expect(component.getDateStringInWords(DATE))
        .toBe('January 16, 2027');

      DATE = '02/02/2018';
      expect(component.getDateStringInWords(DATE))
        .toBe('February 2, 2018');
    });

  it('should determine if small screen view is active', () => {
    const windowWidthSpy =
      spyOn(windowDimensionsService, 'getWidth').and.returnValue(766);
    expect(component.isSmallScreenViewActive()).toBe(true);
    windowWidthSpy.and.returnValue(1028);
    expect(component.isSmallScreenViewActive()).toBe(false);
  });

  it('should initialize correctly', () => {
    let sampleBlogPostBackendDict: BlogPostBackendDict = {
      id: 'sampleBlogId',
      displayed_author_name: 'test_user',
      title: 'sample_title',
      content: '<p>hello</p>',
      thumbnail_filename: 'image.png',
      tags: ['learners', 'news'],
      url_fragment: 'sample-post-url',
      last_updated: '11/21/2014, 09:45:00',
      published_on: '11/21/2014, 09:45:00',
    };
    let blogPostData = BlogPostData.createFromBackendDict(
      sampleBlogPostBackendDict);
    component.blogPostPageData = {
      authorUsername: 'test_username',
      blogPostDict: blogPostData,
      summaryDicts: [],
    };
    spyOn(urlService, 'getBlogPostUrlFromUrl').
      and.returnValue('sample-post-url');
    spyOn(userService, 'getProfileImageDataUrl').and.returnValue(
      ['default-image-url-png', 'default-image-url-webp']);

    component.ngOnInit();

    expect(component.MAX_POSTS_TO_RECOMMEND_AT_END_OF_BLOG_POST).toBe(2);
    expect(component.blogPostUrlFragment).toBe('sample-post-url');
    expect(component.authorProfilePicPngUrl).toEqual('default-image-url-png');
    expect(component.authorProfilePicWebpUrl).toEqual('default-image-url-webp');
    expect(component.blogPost).toEqual(blogPostData);
    expect(component.postsToRecommend.length).toBe(0);
    expect(component.publishedDateString).toBe('November 21, 2014');
    expect(blogPostPageService.blogPostId).toBe(sampleBlogPostBackendDict.id);
  });

  it('should navigate to author profile page', () => {
    spyOn(urlInterpolationService, 'interpolateUrl').and.returnValue(
      '/blog/author/test-username');
    component.authorUsername = 'test-username';

    component.navigateToAuthorProfilePage();

    expect(mockWindowRef.nativeWindow.location.href).toEqual(
      '/blog/author/test-username');
  });
});
