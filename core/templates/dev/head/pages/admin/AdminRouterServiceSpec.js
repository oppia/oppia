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

describe('Admin router service', function() {
  var AdminRouterService = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    AdminRouterService = $injector.get('AdminRouterService');
  }));

  it('should initially be routed to the activities tab', function() {
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(true);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the activities tab', function() {
    // Navigate away from the activities tab (relying on other tests to verify
    // this works correctly) in order to navigate back.
    AdminRouterService.showTab('#jobs');

    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    AdminRouterService.showTab('#activities');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(true);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the config tab', function() {
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    AdminRouterService.showTab('#config');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(true);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the jobs tab', function() {
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    AdminRouterService.showTab('#jobs');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should be able to navigate to the misc tab', function() {
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
    AdminRouterService.showTab('#misc');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);
    expect(AdminRouterService.isMiscTabOpen()).toBe(true);
  });

  it('should be able to navigate to the same tab twice', function() {
    expect(AdminRouterService.isJobsTabOpen()).toBe(false);

    AdminRouterService.showTab('#jobs');
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);

    AdminRouterService.showTab('#jobs');
    expect(AdminRouterService.isActivitiesTabOpen()).toBe(false);
    expect(AdminRouterService.isConfigTabOpen()).toBe(false);
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
    expect(AdminRouterService.isMiscTabOpen()).toBe(false);
  });

  it('should stay on the current tab if an invalid tab is shown', function() {
    AdminRouterService.showTab('#jobs');

    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
    AdminRouterService.showTab('#unknown');
    expect(AdminRouterService.isJobsTabOpen()).toBe(true);
  });
});
