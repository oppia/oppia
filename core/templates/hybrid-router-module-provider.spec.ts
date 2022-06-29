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
 * @fileoverview Unit tests for hybrid router module provider.
 */

import { Component } from '@angular/core';
import { fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { SmartRouterLink } from 'hybrid-router-module-provider';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'mock-comp-a',
  // As template is only used for testing we ignore the lint check, otherwise,
  // we would have to create HTML files for each mock component.
  // eslint-disable-next-line angular/no-inline-template
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a>'
})
class MockCompA {}

@Component({
  selector: 'mock-comp-b',
  // As template is only used for testing we ignore the lint check, otherwise,
  // we would have to create HTML files for each mock component.
  // eslint-disable-next-line angular/no-inline-template
  template: (
    '<a href="/contact" [smartRouterLink]="\'/contact\'"></a><router-outlet>'
  )
})
class MockCompB {}

@Component({
  selector: 'mock-comp-c',
  // As template is only used for testing we ignore the lint check, otherwise,
  // we would have to create HTML files for each mock component.
  // eslint-disable-next-line angular/no-inline-template
  template: (
    '<a href="/contact" [smartRouterLink]="\'/contact\'"></a>' +
    '<router-outlet custom="light">'
  )
})
class MockCompC {}

@Component({
  selector: 'mock-comp-d',
  // As template is only used for testing we ignore the lint check, otherwise,
  // we would have to create HTML files for each mock component.
  // eslint-disable-next-line angular/no-inline-template
  template: '<a href="/" [smartRouterLink]="\'/\'"></a><router-outlet>'
})
class MockCompD {}

@Component({
  selector: 'mock-comp-e',
  // As template is only used for testing we ignore the lint check, otherwise,
  // we would have to create HTML files for each mock component.
  // eslint-disable-next-line angular/no-inline-template
  template: (
    '<a href="/" [smartRouterLink]="\'/\'"></a><router-outlet custom="light">'
  )
})
class MockCompE {}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: ''
    },
  };
}

describe('Smart router link directive', () => {
  let mockWindowRef: MockWindowRef;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule.withRoutes([
          { path: 'contact', component: MockCompA },
          { path: 'contact', component: MockCompB },
          { path: 'contact', component: MockCompC },
          { path: '', component: MockCompD },
          { path: '', component: MockCompE },
        ]),
      ],
      declarations: [
        MockCompA,
        MockCompB,
        MockCompC,
        MockCompD,
        MockCompE,
        SmartRouterLink,
      ],
      providers: [
        {
          provide: WindowRef,
          useValue: mockWindowRef
        }
      ]
    }).compileComponents();
  }));

  it('should navigate by refreshing from non-router page', fakeAsync(() => {
    let mockCompAFixture = TestBed.createComponent(MockCompA);
    let mockCompALink = (
      mockCompAFixture.debugElement.nativeElement.querySelector('a'));

    mockCompAFixture.detectChanges();
    tick();
    expect(mockWindowRef.nativeWindow.location.href).toBe('');

    mockCompALink.click();
    mockCompAFixture.detectChanges();
    tick();

    expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
  }));

  it(
    'should navigate without refreshing inside normal router',
    fakeAsync(() => {
      let mockCompBFixture = TestBed.createComponent(MockCompB);
      let mockCompBLink = (
        mockCompBFixture.debugElement.nativeElement.querySelector('a'));

      mockCompBFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompBLink.click();
      mockCompBFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('');
    })
  );

  it(
    'should navigate by refreshing from lightweight router to normal router',
    fakeAsync(() => {
      let mockCompCFixture = TestBed.createComponent(MockCompC);
      let mockCompCLink = (
        mockCompCFixture.debugElement.nativeElement.querySelector('a'));
      mockCompCFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompCLink.click();
      mockCompCFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
    })
  );

  it(
    'should navigate by refreshing from normal router to lightweight router',
    fakeAsync(() => {
      let mockCompDFixture = TestBed.createComponent(MockCompD);
      let mockCompDLink = (
        mockCompDFixture.debugElement.nativeElement.querySelector('a'));

      mockCompDFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompDLink.click();
      mockCompDFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('/');
    })
  );


  it(
    'should navigate without refreshing inside lightweight router',
    fakeAsync(() => {
      let mockCompEFixture = TestBed.createComponent(MockCompE);
      let mockCompELink = (
        mockCompEFixture.debugElement.nativeElement.querySelector('a'));

      mockCompEFixture.detectChanges();
      tick();
      expect(mockWindowRef.nativeWindow.location.href).toBe('');

      mockCompELink.click();
      mockCompEFixture.detectChanges();
      tick();

      expect(mockWindowRef.nativeWindow.location.href).toBe('');
    })
  );
});
