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
import { ComponentFixture, fakeAsync, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { APP_BASE_HREF } from '@angular/common';

import { SmartRouterLink, SmartRouterModule } from 'hybrid-router-module-provider';
import { WindowRef } from 'services/contextual/window-ref.service';

@Component({
  selector: 'mock-comp-a',
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a>'
})
class MockCompA {}

@Component({
  selector: 'mock-comp-b',
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a><router-outlet>'
})
class MockCompB {}

@Component({
  selector: 'mock-comp-c',
  template: '<a href="/contact" [smartRouterLink]="\'/contact\'"></a><router-outlet custom="light">'
})
class MockCompC {}

class MockWindowRef {
  nativeWindow = {
    location: {
      href: ''
    },
  };
}

describe('Smart router link directive', () => {
  let componentA: MockCompA;
  let componentB: MockCompB;
  let componentC: MockCompC;
  let mockCompAFixture: ComponentFixture<MockCompA>;
  let mockCompBFixture: ComponentFixture<MockCompB>;
  let mockCompCFixture: ComponentFixture<MockCompC>;
  let mockCompALink;
  let mockCompBLink;
  let mockCompCLink;
  let mockWindowRef: MockWindowRef;

  let smartRouterLink: SmartRouterLink;

  beforeEach(waitForAsync(() => {
    mockWindowRef = new MockWindowRef();
    TestBed.configureTestingModule({
      imports: [
        RouterModule.forRoot([]),
        SmartRouterModule
      ],
      declarations: [
        MockCompA,
        MockCompB,
        MockCompC,
      ],
      providers: [
        {
          provide: WindowRef,
          useClass: mockWindowRef
        },
        {
          provide: APP_BASE_HREF,
          useValue: '/'
        }
      ]
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    smartRouterLink = TestBed.inject(SmartRouterLink);

    mockCompAFixture = TestBed.createComponent(MockCompA);
    mockCompBFixture = TestBed.createComponent(MockCompB);
    mockCompCFixture = TestBed.createComponent(MockCompC);
    mockCompALink = (
      mockCompAFixture.debugElement.nativeElement.querySelector('a'));
    mockCompBLink = (
      mockCompBFixture.debugElement.nativeElement.querySelector('a'));
    mockCompCLink = (
      mockCompCFixture.debugElement.nativeElement.querySelector('a'));
  }));

  it('should navigate by refreshing from non-router page', fakeAsync(() => {
    spyOn(smartRouterLink, 'onClick').and.callThrough();
    mockCompALink.click();
    tick();
    console.log(mockWindowRef.nativeWindow.location.href);
    expect(smartRouterLink.onClick).toHaveBeenCalled();
    expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
  }));

  it(
    'should navigate without refreshing inside normal router',
    fakeAsync(() => {
      //spyOn(smartRouterLink, 'onClick').and.callThrough();
      mockCompBLink.click();
      tick();
      console.log(mockWindowRef.nativeWindow.location.href);
      //expect(smartRouterLink.onClick).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
    })
  );

  it(
    'should navigate by refreshing from lightweight router to normal router',
    fakeAsync(() => {
      //spyOn(smartRouterLink, 'onClick').and.callThrough();
      mockCompCLink.click();
      tick();
      console.log(mockWindowRef.nativeWindow.location.href);
      //expect(smartRouterLink.onClick).toHaveBeenCalled();
      expect(mockWindowRef.nativeWindow.location.href).toBe('/contact');
    })
  );
});
