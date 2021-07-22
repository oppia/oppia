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
 * @fileoverview Unit tests for libraryFooter.
 */

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { LibraryFooterComponent } from './library-footer.component';
import { SharedComponentsModule } from './../../../../templates/components/shared-component.module';
import { WindowRef } from 'services/contextual/window-ref.service';
import { HttpClientModule } from '@angular/common/http';


class MockWindowRef {
  _window = {
    location: {
      _pathname: '/math/ratios',
      _href: '',
      get pathname(): string {
        return this._pathname;
      },
      set pathname(val: string) {
        this._pathname = val;
      },
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

describe('Library Footer Component', () => {
  let windowRef: MockWindowRef;
  let fixture: ComponentFixture<LibraryFooterComponent>;
  let component: LibraryFooterComponent;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      declarations: [
        LibraryFooterComponent
      ],
      providers: [
        {
          provide: WindowRef,
          useValue: windowRef
        },
      ],
      imports: [
        SharedComponentsModule,
        HttpClientModule
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show library footer when not searching for explorations', () => {
    windowRef.nativeWindow.location.pathname = '/community-library';
    fixture.detectChanges();
    component.ngOnInit();
    expect(component.footerIsDisplayed).toBe(true);
  });

  it('should hide library footer when searching for explorations', () => {
    windowRef.nativeWindow.location.pathname = '/search/find';
    fixture.detectChanges();
    component.ngOnInit();
    expect(component.footerIsDisplayed).toBe(false);
  });
});
