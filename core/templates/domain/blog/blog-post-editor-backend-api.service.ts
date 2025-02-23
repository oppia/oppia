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
 * @fileoverview Service to send changes to a blog post to the backend.
 */

import {Injectable} from '@angular/core';
import {BlogPostBackendDict, BlogPostData} from 'domain/blog/blog-post.model';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {HttpClient} from '@angular/common/http';
import {BlogDashboardPageConstants} from 'pages/blog-dashboard-page/blog-dashboard-page.constants';
import {BlogPostChangeDict} from 'domain/blog/blog-post-update.service';
import {ImagesData} from 'services/image-local-storage.service';

interface BlogPostUpdateBackendDict {
  blog_post: BlogPostBackendDict;
}

interface BlogPostUpdatedData {
  blogPostDict: BlogPostData;
}

interface DeleteBlogPostBackendResponse {
  status: number;
}

interface BlogPostEditorBackendResponse {
  blog_post_dict: BlogPostBackendDict;
  displayed_author_name: string;
  max_no_of_tags: number;
  list_of_default_tags: string[];
}

interface DoesBlogPostWithTitleExistBackendResponse {
  blog_post_exists: boolean;
}

export interface BlogPostEditorData {
  blogPostDict: BlogPostData;
  displayedAuthorName: string;
  maxNumOfTags: number;
  listOfDefaulTags: string[];
}

@Injectable({
  providedIn: 'root',
})
export class BlogPostEditorBackendApiService {
  constructor(
    private http: HttpClient,
    private urlInterpolationService: UrlInterpolationService
  ) {}

  async fetchBlogPostEditorData(
    blogPostId: string
  ): Promise<BlogPostEditorData> {
    return new Promise((resolve, reject) => {
      const blogPostDataUrl = this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_EDITOR_DATA_URL_TEMPLATE,
        {
          blog_post_id: blogPostId,
        }
      );
      this.http
        .get<BlogPostEditorBackendResponse>(blogPostDataUrl)
        .toPromise()
        .then(
          response => {
            resolve({
              displayedAuthorName: response.displayed_author_name,
              blogPostDict: BlogPostData.createFromBackendDict(
                response.blog_post_dict
              ),
              maxNumOfTags: response.max_no_of_tags,
              listOfDefaulTags: response.list_of_default_tags,
            });
          },
          errorResponse => {
            reject(errorResponse.status);
          }
        );
    });
  }

  async deleteBlogPostAsync(blogPostId: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const blogPostDataUrl = this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_EDITOR_DATA_URL_TEMPLATE,
        {
          blog_post_id: blogPostId,
        }
      );

      this.http
        .delete<DeleteBlogPostBackendResponse>(blogPostDataUrl)
        .toPromise()
        .then(
          response => {
            resolve(response.status);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async updateBlogPostDataAsync(
    blogPostId: string,
    newPublishStatus: boolean,
    changeDict: BlogPostChangeDict
  ): Promise<BlogPostUpdatedData> {
    return new Promise((resolve, reject) => {
      const blogPostDataUrl = this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_EDITOR_DATA_URL_TEMPLATE,
        {
          blog_post_id: blogPostId,
        }
      );

      const putData = {
        new_publish_status: newPublishStatus,
        change_dict: changeDict,
      };

      this.http
        .put<BlogPostUpdateBackendDict>(blogPostDataUrl, putData)
        .toPromise()
        .then(
          response => {
            resolve({
              blogPostDict: BlogPostData.createFromBackendDict(
                response.blog_post
              ),
            });
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async postThumbnailDataAsync(
    blogPostId: string,
    imagesData: ImagesData[]
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const blogPostDataUrl = this.urlInterpolationService.interpolateUrl(
        BlogDashboardPageConstants.BLOG_EDITOR_DATA_URL_TEMPLATE,
        {
          blog_post_id: blogPostId,
        }
      );
      let body = new FormData();
      let payload = {
        thumbnail_filename: imagesData[0].filename,
      };
      let imageBlob = imagesData[0].imageBlob;
      if (imageBlob) {
        body.append('image', imageBlob);
      }
      body.append('payload', JSON.stringify(payload));
      this.http
        .post(blogPostDataUrl, body)
        .toPromise()
        .then(
          () => {
            resolve();
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }

  async doesPostWithGivenTitleAlreadyExistAsync(
    blogPostId: string,
    title: string
  ): Promise<boolean> {
    const blogPostDataUrl = this.urlInterpolationService.interpolateUrl(
      BlogDashboardPageConstants.BLOG_POST_TITLE_HANDLER_URL_TEMPLATE,
      {
        blog_post_id: blogPostId,
      }
    );
    return new Promise((resolve, reject) => {
      this.http
        .get<DoesBlogPostWithTitleExistBackendResponse>(blogPostDataUrl, {
          params: {
            title: title,
          },
        })
        .toPromise()
        .then(
          response => {
            resolve(response.blog_post_exists);
          },
          errorResponse => {
            reject(errorResponse.error.error);
          }
        );
    });
  }
}
