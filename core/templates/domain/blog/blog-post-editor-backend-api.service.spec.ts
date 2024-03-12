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
 * @fileoverview Unit tests for BlogPostEditorBackendApiService.
 */

import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import {TestBed, fakeAsync, flushMicrotasks} from '@angular/core/testing';
import {
  BlogPostEditorData,
  BlogPostEditorBackendApiService,
} from './blog-post-editor-backend-api.service';
import {BlogPostData} from 'domain/blog/blog-post.model';

describe('Blog Post Editor backend api service', () => {
  let bpebas: BlogPostEditorBackendApiService;
  let httpTestingController: HttpTestingController;
  let blogPostEditorDataObject: BlogPostEditorData;
  let successHandler: jasmine.Spy<jasmine.Func>;
  let failHandler: jasmine.Spy<jasmine.Func>;

  const fakeImage = (): File => {
    const blob = new Blob([''], {type: 'image/jpeg'});
    return blob as File;
  };

  let blogPostEditorBackendResponse = {
    blog_post_dict: {
      id: 'sampleBlogId',
      displayed_author_name: 'test_user',
      title: 'sample_title',
      content: '<p>hello</p>',
      thumbnail_filename: 'image',
      tags: ['learners', 'news'],
      url_fragment: 'sample#url',
    },
    displayed_author_name: 'test_user',
    max_no_of_tags: 2,
    list_of_default_tags: ['learners', 'news'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    bpebas = TestBed.inject(BlogPostEditorBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    blogPostEditorDataObject = {
      displayedAuthorName: blogPostEditorBackendResponse.displayed_author_name,
      maxNumOfTags: blogPostEditorBackendResponse.max_no_of_tags,
      listOfDefaulTags: blogPostEditorBackendResponse.list_of_default_tags,
      blogPostDict: BlogPostData.createFromBackendDict(
        blogPostEditorBackendResponse.blog_post_dict
      ),
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the blog post editor data.', fakeAsync(() => {
    bpebas
      .fetchBlogPostEditorData('sampleBlogId')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('GET');
    req.flush(blogPostEditorBackendResponse);

    flushMicrotasks();
    expect(successHandler).toHaveBeenCalledWith(blogPostEditorDataObject);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    'should use the rejection handler if the backend request for fetching' +
      ' data fails',
    fakeAsync(() => {
      bpebas
        .fetchBlogPostEditorData('sampleBlogId')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/blogeditorhandler/data/sampleBlogId'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(
        {
          error: 'Error loading blog post.',
        },
        {
          status: 500,
          statusText: 'Error loading blog post.',
        }
      );

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(500);
    })
  );

  it('should successfully delete a blog post', fakeAsync(() => {
    bpebas
      .deleteBlogPostAsync('sampleBlogId')
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush({
      status: 200,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith(200);
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when deleting a blog post fails.', fakeAsync(() => {
    bpebas
      .deleteBlogPostAsync('sampleBlogId')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('DELETE');
    req.flush(
      {
        error: 'Error deleting blog post.',
      },
      {
        status: 500,
        statusText: 'Error deleting blog post.',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith('Error deleting blog post.');
  }));

  it('should update a blog post successfully', fakeAsync(() => {
    let changeDict = {
      title: 'title_sample',
      content: '<p>Hello Blog<P>',
    };
    blogPostEditorBackendResponse.blog_post_dict.title = changeDict.title;
    blogPostEditorBackendResponse.blog_post_dict.content = changeDict.content;
    let updatedBlogPost = BlogPostData.createFromBackendDict(
      blogPostEditorBackendResponse.blog_post_dict
    );

    bpebas
      .updateBlogPostDataAsync('sampleBlogId', false, changeDict)
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('PUT');
    req.flush({blog_post: blogPostEditorBackendResponse.blog_post_dict});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalledWith({
      blogPostDict: updatedBlogPost,
    });
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it(
    "should use the rejection handler if the blog post to update doesn't" +
      ' exist',
    fakeAsync(() => {
      let changeDict = {
        title: 'title_sample',
        content: '<p>Hello Blog<P>',
      };

      bpebas
        .updateBlogPostDataAsync('invalidBlog', false, changeDict)
        .then(successHandler, failHandler);
      let req = httpTestingController.expectOne(
        '/blogeditorhandler/data/invalidBlog'
      );
      expect(req.request.method).toEqual('PUT');
      req.flush(
        {
          error: "Blog Post with given id doesn't exist.",
        },
        {
          status: 404,
          statusText: "Blog Post with given id doesn't exist.",
        }
      );

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        "Blog Post with given id doesn't exist."
      );
    })
  );

  it('should post image data successfully to the backend', fakeAsync(() => {
    bpebas
      .postThumbnailDataAsync('sampleBlogId', [
        {
          filename: 'image',
          imageBlob: fakeImage(),
        },
      ])
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('POST');
    req.flush({});

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));

  it('should use the rejection handler when deleting a blog post fails.', fakeAsync(() => {
    bpebas
      .postThumbnailDataAsync('sampleBlogId', [
        {
          filename: 'image',
          imageBlob: fakeImage(),
        },
      ])
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogeditorhandler/data/sampleBlogId'
    );
    expect(req.request.method).toEqual('POST');
    req.flush(
      {
        error: 'Error updating blog post thumbnail.',
      },
      {
        status: 500,
        statusText: 'Error updating blog post thumbnail.',
      }
    );

    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Error updating blog post thumbnail.'
    );
  }));

  it(
    'should use the rejection handler when checking for blog post title' +
      ' uniqueness fails.',
    fakeAsync(() => {
      bpebas
        .doesPostWithGivenTitleAlreadyExistAsync('sampleBlogId', 'sampleTitle')
        .then(successHandler, failHandler);

      let req = httpTestingController.expectOne(
        '/blogtitlehandler/data/sampleBlogId?title=sampleTitle'
      );
      expect(req.request.method).toEqual('GET');
      req.flush(
        {
          error: 'Error checking for blog posts with same title.',
        },
        {
          status: 500,
          statusText: 'Error checking for blog posts with same title.',
        }
      );

      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith(
        'Error checking for blog posts with same title.'
      );
    })
  );

  it('should check for blog post title uniqueness successfully', fakeAsync(() => {
    bpebas
      .doesPostWithGivenTitleAlreadyExistAsync('sampleBlogId', 'sampleTitle')
      .then(successHandler, failHandler);
    let req = httpTestingController.expectOne(
      '/blogtitlehandler/data/sampleBlogId?title=sampleTitle'
    );
    expect(req.request.method).toEqual('GET');
    req.flush({
      blog_post_exists: true,
    });

    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }));
});
