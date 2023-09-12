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
 * @fileoverview Tests for Blog Admin tab component.
 */

import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';

import { BlogAdminBackendApiService, BlogAdminPageData } from 'domain/blog-admin/blog-admin-backend-api.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { AdminTaskManagerService } from 'pages/admin-page/services/admin-task-manager.service';
import { BlogAdminPageComponent } from 'pages/blog-admin-page/blog-admin-page.component';
class MockWindowRef {
  nativeWindow = {
    confirm() {
      return true;
    },
    location: {
      hostname: 'hostname',
      href: 'href',
      pathname: 'pathname',
      search: 'search',
      hash: 'hash'
    },
    open() {
      return;
    }
  };
}

describe('Blog Admin Page component ', () => {
  let component: BlogAdminPageComponent;
  let fixture: ComponentFixture<BlogAdminPageComponent>;

  let blogAdminBackendApiService: BlogAdminBackendApiService;
  let adminTaskManagerService: AdminTaskManagerService;
  let mockWindowRef: MockWindowRef;

  let confirmSpy: jasmine.Spy;
  let startTaskSpy: jasmine.Spy;
  let finishTaskSpy: jasmine.Spy;

  const blogAdminPageData: BlogAdminPageData = {
    roleToActions: {
      blog_post_editor: ['action for editor']
    },
    platformParameters: {
      max_number_of_tags_assigned_to_blog_post: {
        description: 'Max number of tags.',
        value: 10,
        schema: {type: 'number'}
      }
    },
    updatableRoles: {
      blog_post_editor: 'blog_post_editor'
    }
  };

  beforeEach(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        FormsModule
      ],
      declarations: [BlogAdminPageComponent],
      providers: [
        BlogAdminBackendApiService,
        AdminTaskManagerService,
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(BlogAdminPageComponent);
    component = fixture.componentInstance;
  });

  beforeEach(() => {
    blogAdminBackendApiService = TestBed.inject(BlogAdminBackendApiService);
    adminTaskManagerService = TestBed.inject(AdminTaskManagerService);

    startTaskSpy = spyOn(adminTaskManagerService, 'startTask');
    finishTaskSpy = spyOn(adminTaskManagerService, 'finishTask');
    spyOn(blogAdminBackendApiService, 'getDataAsync')
      .and.resolveTo(blogAdminPageData);
    confirmSpy = spyOn(mockWindowRef.nativeWindow, 'confirm');
  });

  it('should refresh roles form data when initialized', fakeAsync(() => {
    expect(component.formData).toBe(undefined);

    component.ngOnInit();
    tick();

    expect(component.formData.updateRole.newRole).toBe(null);
    expect(component.formData.updateRole.username).toBe('');
    expect(component.formData.removeEditorRole.username).toBe('');
  }));

  it('should set correct values for properties when initialized',
    fakeAsync(() => {
      expect(component.UPDATABLE_ROLES).toEqual({});
      expect(component.roleToActions).toBe(undefined);

      component.ngOnInit();
      tick();

      expect(component.UPDATABLE_ROLES).toEqual(
        blogAdminPageData.updatableRoles);
      expect(component.roleToActions).toEqual(
        blogAdminPageData.roleToActions);
    }));

  it('should reload platform parameters when initialized', fakeAsync(() => {
    expect(component.platformParameters).toEqual({});

    component.ngOnInit();
    tick();

    expect(component.platformParameters).toEqual(
      blogAdminPageData.platformParameters);
  }));

  it('should return schema callback when calling ' +
  '\'getSchemaCallback\'', () => {
    let result = component.getSchemaCallback({type: 'bool'});
    expect(result()).toEqual({type: 'bool'});
  });

  describe('when updating role of user ', () => {
    it('should submit update role form successfully', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.formData.updateRole.newRole = 'BLOG_ADMIN';
      component.formData.updateRole.username = 'username';
      spyOn(blogAdminBackendApiService, 'updateUserRoleAsync')
        .and.returnValue(Promise.resolve());
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      component.submitUpdateRoleForm(component.formData.updateRole);

      expect(startTaskSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe('Updating User Role');

      flushMicrotasks();

      expect(component.statusMessage).toBe(
        'Role of username successfully updated to BLOG_ADMIN');
      expect(finishTaskSpy).toHaveBeenCalled();
    }));

    it('should not submit update role form if already a task is in queue',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.updateRole.newRole = 'BLOG_ADMIN';
        component.formData.updateRole.username = 'username';
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

        component.submitUpdateRoleForm(component.formData.updateRole);

        expect(startTaskSpy).not.toHaveBeenCalled();
        expect(finishTaskSpy).not.toHaveBeenCalled();
      }));

    it('should not submit update role form in case of backend error',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.updateRole.newRole = 'BLOG_ADMIN';
        component.formData.updateRole.username = 'username';
        spyOn(blogAdminBackendApiService, 'updateUserRoleAsync')
          .and.returnValue(Promise.reject('The user already has this role.'));
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
        component.submitUpdateRoleForm(component.formData.updateRole);

        expect(startTaskSpy).toHaveBeenCalled();
        expect(component.statusMessage).toBe('Updating User Role');

        flushMicrotasks();

        expect(component.statusMessage).toBe(
          'The user already has this role.');
        expect(finishTaskSpy).toHaveBeenCalled();
      }));

    it('should not enable update role button if the input values are invalid',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.updateRole.newRole = 'BLOG_ADMIN';
        component.formData.updateRole.username = '';

        expect(component.formData.updateRole.isValid()).toBe(false);

        component.formData.updateRole.newRole = 'BLOG';
        component.formData.updateRole.username = 'username';

        expect(component.formData.updateRole.isValid()).toBe(false);

        component.formData.updateRole.newRole = 'ADMIN';
        component.formData.updateRole.newRole = '';

        expect(component.formData.updateRole.isValid()).toBe(false);

        component.formData.updateRole.newRole = null;
        component.formData.updateRole.username = 'username';

        expect(component.formData.updateRole.isValid()).toBe(false);
      }));

    it('should enable update role button if the input values are valid',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.updateRole.newRole = 'BLOG_POST_EDITOR';
        component.formData.updateRole.username = 'username';

        expect(component.formData.updateRole.isValid()).toBe(true);
      }));
  });

  describe('when removing a blog editor', () => {
    it('should submit remove editor role form successfully', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.formData.removeEditorRole.username = 'username';
      spyOn(blogAdminBackendApiService, 'removeBlogEditorAsync')
        .and.returnValue(Promise.resolve(Object));
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);
      component.submitRemoveEditorRoleForm(component.formData.updateRole);

      expect(startTaskSpy).toHaveBeenCalled();
      expect(component.statusMessage).toBe('Processing query...');

      flushMicrotasks();

      expect(component.statusMessage).toBe('Success.');
      expect(finishTaskSpy).toHaveBeenCalled();
    }));

    it('should not submit remove editor role form if already' +
      'a task is in queue', fakeAsync(() => {
      component.ngOnInit();
      tick();
      component.formData.removeEditorRole.username = 'username';
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);

      component.submitRemoveEditorRoleForm(component.formData.updateRole);

      expect(startTaskSpy).not.toHaveBeenCalled();
      expect(finishTaskSpy).not.toHaveBeenCalled();
    }));

    it('should not submit remove editor role form in case of backend error',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.removeEditorRole.username = 'username';
        spyOn(blogAdminBackendApiService, 'removeBlogEditorAsync')
          .and.returnValue(Promise.reject({
            error: { error: 'Internal Server Error.'}
          }));
        spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(false);

        component.submitRemoveEditorRoleForm(component.formData.updateRole);

        expect(startTaskSpy).toHaveBeenCalled();
        expect(component.statusMessage).toBe('Processing query...');

        flushMicrotasks();

        expect(component.statusMessage).toBe(
          'Server error: Internal Server Error.');
        expect(finishTaskSpy).toHaveBeenCalled();
      }));

    it('should not enable remove role button if the input values are invalid',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.removeEditorRole.username = '';

        expect(component.formData.removeEditorRole.isValid()).toBe(false);
      }));

    it('should enable remove role button if the input values are valid',
      fakeAsync(() => {
        component.ngOnInit();
        tick();
        component.formData.removeEditorRole.username = 'username';

        expect(component.formData.removeEditorRole.isValid()).toBe(true);
      }));
  });

  describe('when clicking on save button ', () => {
    it('should save platform parameters successfully', fakeAsync(() => {
      // Setting confirm button clicked to be true.
      confirmSpy.and.returnValue(true);
      spyOn(blogAdminBackendApiService, 'savePlatformParametersAsync')
        .and.returnValue(Promise.resolve());

      component.platformParameters = blogAdminPageData.platformParameters;
      component.savePlatformParameters();
      tick();

      expect(component.statusMessage).toBe(
        'Data saved successfully.');
    }));

    it('should not save platform parameters ' +
      'in case of backend error', fakeAsync(() => {
      // Setting confirm button clicked to be true.
      confirmSpy.and.returnValue(true);
      spyOn(blogAdminBackendApiService, 'savePlatformParametersAsync')
        .and.returnValue(Promise.reject('Internal Server Error.'));

      component.savePlatformParameters();
      tick();

      expect(component.statusMessage).toBe(
        'Server error: Internal Server Error.');
    }));

    it('should not save platform parameters ' +
      'if a task is still running in the queue', fakeAsync(() => {
      // Setting task is still running to be true.
      spyOn(adminTaskManagerService, 'isTaskRunning').and.returnValue(true);
      let saveConfigSpy = spyOn(
        blogAdminBackendApiService, 'savePlatformParametersAsync');

      component.savePlatformParameters();
      tick();

      expect(saveConfigSpy).not.toHaveBeenCalled();
    }));

    it('should not request backend to save platform parameters ' +
      'if cancel button is clicked in the alert', fakeAsync(() => {
      // Setting confirm button clicked to be false.
      confirmSpy.and.returnValue(false);
      let saveConfigSpy = spyOn(
        blogAdminBackendApiService, 'savePlatformParametersAsync');

      component.savePlatformParameters();
      tick();

      expect(saveConfigSpy).not.toHaveBeenCalled();
    }));
  });
});
