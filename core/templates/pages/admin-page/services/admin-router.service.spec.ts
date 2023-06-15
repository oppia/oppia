// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for AdminRouterService.
 */

import { AdminRouterService } from 'pages/admin-page/services/admin-router.service';

describe('Admin router service', () => {
  let ars: AdminRouterService;

  beforeEach(() => {
    ars = new AdminRouterService();
  });

  it('should initially be routed to the activities tab', () => {
    expect(ars.isActivitiesTabOpen()).toBe(true);
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isPlatformParamsTabOpen()).toBe(false);
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the activities tab', () => {
    // Navigate away from the activities tab (relying on other tests to verify
    // this works correctly) in order to navigate back.
    expect(ars.isActivitiesTabOpen()).toBe(true);
    ars.showTab('#/config');

    expect(ars.isActivitiesTabOpen()).toBe(false);
    ars.showTab('#/activities');
    expect(ars.isActivitiesTabOpen()).toBe(true);
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isPlatformParamsTabOpen()).toBe(false);
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the config tab', () => {
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isActivitiesTabOpen()).toBe(true);

    ars.showTab('#/config');

    expect(ars.isActivitiesTabOpen()).toBe(false);
    expect(ars.isConfigTabOpen()).toBe(true);
    expect(ars.isPlatformParamsTabOpen()).toBe(false);
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the roles tab', () => {
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isActivitiesTabOpen()).toBe(true);

    ars.showTab('#/roles');

    expect(ars.isActivitiesTabOpen()).toBe(false);
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isPlatformParamsTabOpen()).toBe(false);
    expect(ars.isRolesTabOpen()).toBe(true);
    expect(ars.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the misc tab', () => {
    expect(ars.isMiscTabOpen()).toBe(false);
    expect(ars.isActivitiesTabOpen()).toBe(true);

    ars.showTab('#/misc');

    expect(ars.isActivitiesTabOpen()).toBe(false);
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isPlatformParamsTabOpen()).toBe(false);
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isMiscTabOpen()).toBe(true);
  });

  it('should be able to navigate to the platform params tab', () => {
    expect(ars.isPlatformParamsTabOpen()).toBe(false);
    expect(ars.isActivitiesTabOpen()).toBe(true);

    ars.showTab('#/platform-parameters');

    expect(ars.isActivitiesTabOpen()).toBe(false);
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isPlatformParamsTabOpen()).toBe(true);
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the same tab twice', () => {
    expect(ars.isMiscTabOpen()).toBe(false);

    ars.showTab('#/misc');
    expect(ars.isMiscTabOpen()).toBe(true);

    ars.showTab('#/misc');
    expect(ars.isActivitiesTabOpen()).toBe(false);
    expect(ars.isConfigTabOpen()).toBe(false);
    expect(ars.isRolesTabOpen()).toBe(false);
    expect(ars.isMiscTabOpen()).toBe(true);
  });

  it('should stay on the current tab if an invalid tab is shown', () => {
    ars.showTab('#/misc');
    expect(ars.isMiscTabOpen()).toBe(true);

    ars.showTab('#/unknown');
    expect(ars.isMiscTabOpen()).toBe(true);
  });
});
