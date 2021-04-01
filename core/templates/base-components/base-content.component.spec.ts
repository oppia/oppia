// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Tests for the Base Transclusion Component.
 */

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BottomNavbarStatusService } from 'services/bottom-navbar-status.service';
import { UrlService } from 'services/contextual/url.service';
import { WindowRef } from 'services/contextual/window-ref.service';
import { KeyboardShortcutService } from 'services/keyboard-shortcut.service';
import { LoaderService } from 'services/loader.service';
import { PageTitleService } from 'services/page-title.service';
import { SidebarStatusService } from 'services/sidebar-status.service';
import { BackgroundMaskService } from 'services/stateful/background-mask.service';
import { BaseContentComponent } from './base-content.component';

fdescribe('Base Content Component', () => {
  let fixture: ComponentFixture<BaseContentComponent>;
  let componentInstance: BaseContentComponent;
  let isIframed: boolean = false;
  let href: string = 'test_href';
  let pathname: string = 'test_pathname';
  let search: string = 'test_search';
  let hash: string = 'test_hash';
  let isMaskActive: boolean;
  let isBottomNavbarEnabled: boolean;

  class MockUrlService {
    isIframed(): boolean {
      return isIframed;
    }
  }

  class MockWindowRef {
    nativeWindow = {
      location: {
        href: href,
        pathname: pathname,
        search: search,
        hash: hash
      }
    };
  }

  class MockBackgroundMaskService {
    isMaskActive(): boolean {
      return isMaskActive;
    }
  }

  class MockBottomNavbarStatusService {
    isBottomNavbarEnabled(): boolean {
      return isBottomNavbarEnabled;
    }
  }

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        BaseContentComponent
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: MockWindowRef
        },
        {
          provide: UrlService,
          useClass: MockUrlService
        },
        {
          provide: BackgroundMaskService,
          useClass: MockBackgroundMaskService
        },
        {
          provide: BottomNavbarStatusService,
          useClass: MockBottomNavbarStatusService
        },
        KeyboardShortcutService,
        LoaderService,
        PageTitleService,
        SidebarStatusService
      ]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BaseContentComponent);
    componentInstance = fixture.componentInstance;
  });

  it('should create', () => {
    expect(componentInstance).toBeDefined();
  });
});
