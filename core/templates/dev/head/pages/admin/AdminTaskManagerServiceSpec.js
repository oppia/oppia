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
 * @fileoverview Tests for AdminTaskManagerService.
 */

describe('Admin task manager service', function() {
  var AdminTaskManagerService = null;

  beforeEach(module('oppia'));

  beforeEach(inject(function($injector) {
    AdminTaskManagerService = $injector.get('AdminTaskManagerService');
  }));

  it('should initially have no tasks running', function() {
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to start a task and record it as running', function() {
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
    AdminTaskManagerService.startTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(true);
  });

  it('should not change running state when stopping no tasks', function() {
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
    AdminTaskManagerService.finishTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to stop a running task', function() {
    AdminTaskManagerService.startTask();

    expect(AdminTaskManagerService.isTaskRunning()).toBe(true);
    AdminTaskManagerService.finishTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to start a task twice and stop it once', function() {
    AdminTaskManagerService.startTask();
    AdminTaskManagerService.startTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(true);

    AdminTaskManagerService.finishTask();
    expect(AdminTaskManagerService.isTaskRunning()).toBe(false);
  });
});
