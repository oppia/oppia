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
 * @fileoverview Unit tests for BlogAdminBackendApiService.
 */

import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks } from '@angular/core/testing';
import { BlogAdminPageData, BlogAdminBackendApiService } from './blog-admin-backend-api.service';
import { CsrfTokenService } from 'services/csrf-token.service';

describe('Blog Admin backend api service', () => {
  let babas: BlogAdminBackendApiService;
  let httpTestingController: HttpTestingController;
  let csrfService: CsrfTokenService = null;
  let successHandler = null;
  let failHandler = null;
  let blogAdminBackendResponse = {
    role_to_actions: {
      blog_post_editor: ['action for editor']
    },
    config_properties: {
      list_of_default_tags_for_blog_post: {
        description: 'List of tags',
        value: ['Learners', 'News'],
        schema: {
          type: 'list',
          items: {
            type: 'unicode'
          },
          validators: [{
            id: 'is_uniquified',
          }],
        }
      }
    },
    updatable_roles: {
      blog_post_editor: 'blog_post_editor'
    }
  };
  let blogAdminDataObject: BlogAdminPageData;
  let configPropertyValues = {
    list_of_default_tags_for_blog_post: ['News', 'Learners'],
    max_number_of_tags_assigned_to_blog_post: 5
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    babas = TestBed.inject(BlogAdminBackendApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
    csrfService = TestBed.inject(CsrfTokenService);
    successHandler = jasmine.createSpy('success');
    failHandler = jasmine.createSpy('fail');
    blogAdminDataObject = {
      updatableRoles: blogAdminBackendResponse.updatable_roles,
      roleToActions: blogAdminBackendResponse.role_to_actions,
      configProperties: blogAdminBackendResponse.config_properties,
    };

    spyOn(csrfService, 'getTokenAsync').and.callFake(async() => {
      return Promise.resolve('sample-csrf-token');
    });
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should fetch the data.', fakeAsync(() => {
    babas.getDataAsync().then((blogAdminData) => {
      expect(blogAdminData).toEqual(blogAdminDataObject);
    });

    let req = httpTestingController.expectOne('/blogadminhandler');
    expect(req.request.method).toEqual('GET');
    req.flush(blogAdminBackendResponse);

    flushMicrotasks();
  }));


  it('should use the rejection handler if the backend request failed.',
    fakeAsync(() => {
      babas.getDataAsync().then(successHandler, failHandler);

      var req = httpTestingController.expectOne(
        '/blogadminhandler');
      expect(req.request.method).toEqual('GET');

      req.flush({
        error: 'Some error in the backend.'
      }, {
        status: 500, statusText: 'Internal Server Error'
      });
      flushMicrotasks();

      expect(successHandler).not.toHaveBeenCalled();
      expect(failHandler).toHaveBeenCalledWith('Some error in the backend.');
    })
  );

  it('should update the role of the user given the name' +
  'when calling updateUserRoleAsync', fakeAsync(() => {
    let newRole = 'BLOG_EDITOR';
    let username = 'validUser';
    let payload = {
      role: newRole,
      username: username,
    };
    babas.updateUserRoleAsync(newRole, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminrolehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to update the role of user when user does' +
    'not exists when calling updateUserRoleAsync', fakeAsync(() => {
    let newRole = 'BLOG_EDITOR';
    let username = 'InvalidUser';
    let payload = {
      role: newRole,
      username: username,
    };
    babas.updateUserRoleAsync(newRole, username)
      .then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminrolehandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(
      { error: 'User with given username does not exist'},
      { status: 500, statusText: 'Internal Server Error'});
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'User with given username does not exist');
  }
  ));

  it('should remove blog editor rights given the username' +
  'when calling removeBlogEditorAsync', fakeAsync(() => {
    let username = 'validUser';
    let payload = {
      username: username,
    };
    babas.removeBlogEditorAsync(username,).then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne(
      '/blogadminrolehandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(
      { status: 200, statusText: 'Success.'});
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should remove blog editor rights when user does' +
  'not exists when calling removeBlogEditorAsync', fakeAsync(() => {
    let username = 'InvalidUser';
    let payload = {
      username: username,
    };
    babas.removeBlogEditorAsync(username).then(
      successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminrolehandler');
    expect(req.request.method).toEqual('PUT');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'User with given username does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalled();
  }
  ));

  it('should revert specified config property to default' +
    'value given the config property ID when calling' +
    'revertConfigPropertyAsync', fakeAsync(() => {
    let action = 'revert_config_property';
    let configPropertyId = 'max_number_of_tags_assigned_to_blog_post';
    let payload = {
      action: action,
      config_property_id: configPropertyId
    };

    babas.revertConfigPropertyAsync(
      configPropertyId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to revert specified config property to default' +
    'value when given config property ID is invalid when calling' +
    'revertConfigPropertyAsync', fakeAsync(() => {
    let action = 'revert_config_property';
    let configPropertyId = 'InvalidId';
    let payload = {
      action: action,
      config_property_id: configPropertyId
    };

    babas.revertConfigPropertyAsync(
      configPropertyId).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'Config property does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Config property does not exist.');
  }
  ));


  it('should save the new config properties given the new' +
    'config property when calling' +
    'saveConfigPropertiesAsync', fakeAsync(() => {
    let action = 'save_config_properties';
    let payload = {
      action: action,
      new_config_property_values: configPropertyValues
    };

    babas.saveConfigPropertiesAsync(
      configPropertyValues).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush(200);
    flushMicrotasks();

    expect(successHandler).toHaveBeenCalled();
    expect(failHandler).not.toHaveBeenCalled();
  }
  ));

  it('should fail to save the new config properties when given new' +
    'config property is invalid when calling' +
    'saveConfigPropertiesAsync', fakeAsync(() => {
    let action = 'save_config_properties';
    let payload = {
      action: action,
      new_config_property_values: configPropertyValues
    };
    babas.saveConfigPropertiesAsync(
      configPropertyValues).then(successHandler, failHandler);

    let req = httpTestingController.expectOne('/blogadminhandler');
    expect(req.request.method).toEqual('POST');
    expect(req.request.body).toEqual(payload);

    req.flush({
      error: 'Config property does not exist.'
    }, {
      status: 500, statusText: 'Internal Server Error'
    });
    flushMicrotasks();

    expect(successHandler).not.toHaveBeenCalled();
    expect(failHandler).toHaveBeenCalledWith(
      'Config property does not exist.');
  }
  ));
});
