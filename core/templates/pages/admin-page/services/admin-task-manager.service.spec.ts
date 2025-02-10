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

import {AdminTaskManagerService} from 'pages/admin-page/services/admin-task-manager.service';

describe('Admin task manager service', () => {
  let adminTaskManagerService: AdminTaskManagerService;

  beforeEach(() => {
    adminTaskManagerService = new AdminTaskManagerService();
  });

  it('should initially have no tasks running', () => {
    expect(adminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to start a task and record it as running', () => {
    expect(adminTaskManagerService.isTaskRunning()).toBe(false);
    adminTaskManagerService.startTask();
    expect(adminTaskManagerService.isTaskRunning()).toBe(true);
    adminTaskManagerService.finishTask();
  });

  it('should not change running state when stopping no tasks', () => {
    expect(adminTaskManagerService.isTaskRunning()).toBe(false);
    adminTaskManagerService.finishTask();
    expect(adminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to stop a running task', () => {
    adminTaskManagerService.startTask();

    expect(adminTaskManagerService.isTaskRunning()).toBe(true);
    adminTaskManagerService.finishTask();
    expect(adminTaskManagerService.isTaskRunning()).toBe(false);
  });

  it('should be able to start a task twice and stop it once', () => {
    adminTaskManagerService.startTask();
    adminTaskManagerService.startTask();
    expect(adminTaskManagerService.isTaskRunning()).toBe(true);

    adminTaskManagerService.finishTask();
    expect(adminTaskManagerService.isTaskRunning()).toBe(false);
  });
});
