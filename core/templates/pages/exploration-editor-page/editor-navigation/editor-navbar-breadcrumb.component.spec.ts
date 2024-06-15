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
 * @fileoverview Unit tests for editorNavbarBreadcrumb.
 */

import {EventEmitter, NO_ERRORS_SCHEMA} from '@angular/core';
import {
  ComponentFixture,
  waitForAsync,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import {HttpClientTestingModule} from '@angular/common/http/testing';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {FocusManagerService} from 'services/stateful/focus-manager.service';
import {ExplorationTitleService} from '../services/exploration-title.service';
import {RouterService} from '../services/router.service';
import {EditorNavbarBreadcrumbComponent} from './editor-navbar-breadcrumb.component';

class MockNgbModal {
  open(): {result: Promise<void>} {
    return {
      result: Promise.resolve(),
    };
  }
}

describe('Editor Navbar Breadcrumb component', () => {
  let component: EditorNavbarBreadcrumbComponent;
  let fixture: ComponentFixture<EditorNavbarBreadcrumbComponent>;
  let explorationTitleService: ExplorationTitleService;
  let focusManagerService: FocusManagerService;
  let routerService: RouterService;
  let mockExplorationPropertyChangedEventEmitter = new EventEmitter();

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      declarations: [EditorNavbarBreadcrumbComponent],
      providers: [
        {
          provide: NgbModal,
          useClass: MockNgbModal,
        },
        ExplorationTitleService,
        FocusManagerService,
        RouterService,
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditorNavbarBreadcrumbComponent);
    component = fixture.componentInstance;

    explorationTitleService = TestBed.inject(ExplorationTitleService);
    focusManagerService = TestBed.inject(FocusManagerService);
    routerService = TestBed.inject(RouterService);

    explorationTitleService.init('Exploration Title Example Very Long');

    spyOnProperty(
      explorationTitleService,
      'onExplorationPropertyChanged'
    ).and.returnValue(mockExplorationPropertyChangedEventEmitter);

    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should initialize component properties after controller is initialized', () => {
    expect(component.navbarTitle).toBeUndefined();
  });

  it(
    'should go to settings tabs and focus on exploration title input' +
      ' when editing title',
    () => {
      spyOn(routerService, 'navigateToSettingsTab');
      spyOn(focusManagerService, 'setFocus');

      component.editTitle();

      expect(routerService.navigateToSettingsTab).toHaveBeenCalled();
      expect(focusManagerService.setFocus).toHaveBeenCalledWith(
        'explorationTitleInputFocusLabel'
      );
    }
  );

  it('should get an empty current tab name when there is no active tab', () => {
    spyOn(routerService, 'getActiveTabName').and.returnValue('');
    expect(component.getCurrentTabName()).toBe('');
  });

  it('should get current tab name when there is an active tab', () => {
    spyOn(routerService, 'getActiveTabName').and.returnValue('settings');
    expect(component.getCurrentTabName()).toBe('Settings');
  });

  it('should update nav bar title when exploration property changes', fakeAsync(() => {
    mockExplorationPropertyChangedEventEmitter.emit('title');
    tick();

    expect(component.navbarTitle).toBe('Exploration Title...');
  }));
});
