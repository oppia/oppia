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
 * @fileoverview Tests for roles-and-actions-visualizer component.
 */

import {HttpClientTestingModule} from '@angular/common/http/testing';
import {FormsModule} from '@angular/forms';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
} from '@angular/core/testing';

import {RolesAndActionsVisualizerComponent} from './roles-and-actions-visualizer.component';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';
import {MaterialModule} from 'modules/material.module';
import {AdminBackendApiService} from 'domain/admin/admin-backend-api.service';

describe('Roles and actions visualizer component', function () {
  let component: RolesAndActionsVisualizerComponent;
  let fixture: ComponentFixture<RolesAndActionsVisualizerComponent>;
  let adminBackendApiService: AdminBackendApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, FormsModule, MaterialModule],
      declarations: [RolesAndActionsVisualizerComponent],
      providers: [UrlInterpolationService],
    }).compileComponents();
    fixture = TestBed.createComponent(RolesAndActionsVisualizerComponent);
    adminBackendApiService = TestBed.get(AdminBackendApiService);
    component = fixture.componentInstance;
    component.viewableRoles = ['MODERATOR', 'TRANSLATION_ADMIN'];
    component.humanReadableRoles = {
      MODERATOR: 'moderator',
      FULL_USER: 'full user',
      MOBILE_LEARNER: 'mobile learner',
    };
    component.roleToActions = {
      MODERATOR: ['allowed action 1', 'allowed action 2'],
      MOBILE_LEARNER: ['allowed action 3', 'allowed action 4'],
      TRANSLATION_ADMIN: ['allowed action 5', 'allowed action 6'],
      FULL_USER: ['allowed action 7', 'allowed action 8'],
    };
  });

  it('should intialize correct active role', function () {
    component.ngOnInit();

    expect(component.activeRole).toEqual('TRANSLATION_ADMIN');
  });

  it('should intialize roles with all the roles', function () {
    component.ngOnInit();

    expect(component.roles).toEqual([
      'FULL_USER',
      'MOBILE_LEARNER',
      'MODERATOR',
      'TRANSLATION_ADMIN',
    ]);
  });

  it('should intialize roleToReadableActions correctly', function () {
    component.ngOnInit();

    expect(component.roleToReadableActions).toEqual({
      MODERATOR: ['Allowed action 1', 'Allowed action 2'],
      MOBILE_LEARNER: ['Allowed action 3', 'Allowed action 4'],
      TRANSLATION_ADMIN: ['Allowed action 5', 'Allowed action 6'],
      FULL_USER: ['Allowed action 7', 'Allowed action 8'],
    });
  });

  it('should set active role correctly', function () {
    component.ngOnInit();

    component.activeRole = 'MOBILE_LEARNER';
    component.activeTab = component.TAB_ASSIGNED_USERS;

    component.setActiveRole('MODERATOR');
    expect(component.activeRole).toEqual('MODERATOR');
    expect(component.activeTab).toEqual(component.TAB_ACTIONS);
  });

  it('should update assignUsersToActiveRole when calling showAssignedUsers', fakeAsync(() => {
    spyOn(
      adminBackendApiService,
      'fetchUsersAssignedToRoleAsync'
    ).and.resolveTo({
      usernames: ['userA', 'userB'],
    });
    component.activeRole = 'MOBILE_LEARNER';
    component.assignUsersToActiveRole = [];

    component.showAssignedUsers();
    tick();

    expect(component.assignUsersToActiveRole).toEqual(['userA', 'userB']);
  }));
});
