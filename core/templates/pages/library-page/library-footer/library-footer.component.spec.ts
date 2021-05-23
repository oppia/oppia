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

import { LibraryFooterComponent } from 'pages/library-page/library-footer/library-footer.component';
import { ComponentFixture, TestBed}
  from '@angular/core/testing';
import { WindowRef } from 'services/contextual/window-ref.service';
import { SharedComponentsModule } from 'components/shared-component.module';
class MockWindowRef {
  _window = {
    location: {
      _pathname: '',
      _href: '',
      get pathname(): string {
        return this._pathname;
      },
      set pathname(val: string) {
        this._pathname = val;
      },
      get href(): string {
        return this._href;
      },
      set href(val) {
        this._href = val;
      }
    }
  };
  get nativeWindow() {
    return this._window;
  }
}

let component: LibraryFooterComponent;
let fixture: ComponentFixture<LibraryFooterComponent>;

describe('Library Footer Component', () => {
  let windowRef: MockWindowRef;

  beforeEach(() => {
    windowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        SharedComponentsModule
      ],
      declarations: [LibraryFooterComponent],
      providers: [
        { provide: WindowRef, useValue: windowRef }
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LibraryFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show library footer when not searching for explorations', () => {
    windowRef.nativeWindow.location.pathname = '/community-library';
    component.ngOnInit();
    expect(component.footerIsDisplayed).toBe(true);
  });

  it('should hide library footer when searching for explorations', () => {
    windowRef.nativeWindow.location.pathname = '/search/find';
    component.ngOnInit();
    expect(component.footerIsDisplayed).toBe(false);
  });
});
