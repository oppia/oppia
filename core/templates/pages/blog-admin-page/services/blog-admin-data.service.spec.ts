// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for BlogAdminDataService.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';

import { BlogAdminDataService } from 'pages/blog-admin-page/services/blog-admin-data.service';
import { BlogAdminPageData, BlogAdminPageDataBackendDict } from 'domain/blog-admin/blog-admin-backend-api.service';

describe('Blog Admin Data Service', () => {
  let blogAdminDataService: BlogAdminDataService;
  let httpTestingController: HttpTestingController;
  let sampleBlogAdminData: BlogAdminPageDataBackendDict = {
    role_to_actions: {
      blog_post_editor: ['action for editor']
    },
    platform_parameters: {
      max_number_of_tags_assigned_to_blog_post: {
        description: 'Max number of tags.',
        value: 10,
        schema: {type: 'number'}
      }
    },
    updatable_roles: {
      blog_post_editor: 'blog_post_editor'
    }
  };
  let blogAdminDataResponse: BlogAdminPageData;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BlogAdminDataService]
    });
    blogAdminDataService = TestBed.inject(BlogAdminDataService);
    httpTestingController = TestBed.inject(HttpTestingController);
    blogAdminDataResponse = {
      updatableRoles: sampleBlogAdminData.updatable_roles,
      roleToActions: sampleBlogAdminData.role_to_actions,
      platformParameters: sampleBlogAdminData.platform_parameters,
    };
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should return the correct blog admin data', fakeAsync(() => {
    blogAdminDataService.getDataAsync().then((response) => {
      expect(response).toEqual(blogAdminDataResponse);
    });

    var req = httpTestingController.expectOne(
      '/blogadminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(sampleBlogAdminData);

    flushMicrotasks();
  }));
});
