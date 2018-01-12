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
 * @fileoverview Tests for ChangeObjectFactory.
 */

describe('SidebarStatusService', function() {
  var SidebarStatusService;

  beforeEach(module('oppia'));
  beforeEach(inject(function($injector) {
    SidebarStatusService = $injector.get('SidebarStatusService');
  }));
  
  it('should open and then toggle the sidebar if it is not open', function() {
    SidebarStatusService.openSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });
  
  it('should close and then toggle the sidebar when it is open', function() {
    SidebarStatusService.openSidebar();
    SidebarStatusService.closeSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
    SidebarStatusService.toggleSidebar();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });
  
  it('should close sidebar if pendingSidebarClick is false', function(){
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(false);
  });
  
  it('should toggle endingSidebarClick', function(){
    SidebarStatusService.openSidebar();
    SidebarStatusService.onDocumentClick();
    expect(SidebarStatusService.isSidebarShown()).toBe(true);
  });
});
