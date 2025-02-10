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
 * @fileoverview Spec for rte output component.
 */

import {DebugElement, SimpleChanges} from '@angular/core';
import {
  ComponentFixture,
  fakeAsync,
  TestBed,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import {OppiaRteParserService} from 'services/oppia-rte-parser.service';
import {RichTextComponentsModule} from './rich-text-components.module';
import {RteOutputDisplayComponent} from './rte-output-display.component';

describe('RTE display component', () => {
  let fixture: ComponentFixture<RteOutputDisplayComponent>;
  let component: RteOutputDisplayComponent;
  let rteParserService: OppiaRteParserService;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RichTextComponentsModule],
    }).compileComponents();
    rteParserService = TestBed.inject(OppiaRteParserService);
    fixture = TestBed.createComponent(RteOutputDisplayComponent);
    component = fixture.componentInstance;
  }));

  // NOTE: Debugging might be a bit confusing sometimes, especially if this the
  // first time you are looking at component tests that test html. To access
  // the html of the component, you can do so by using
  // fixture.nativeElement.innerHTML. fixture.nativeElement is of type any
  // because angular supports multiple platforms including DOM. You can typecast
  // it to HTMLElement to get autocomplete and intellisense.
  it('should display a rte string', () => {
    let rteString =
      '<p>Hi<em>Hello</em>Hello</p>' +
      '<pre> Hello </pre>' +
      '<oppia-noninteractive-link ' +
      'url-with-value="&quot;https://oppia.org&quot;" ' +
      'text-with-value="&quot;Oppia&quot;">' +
      '</oppia-noninteractive-link>';
    let rteComponentDe: DebugElement = fixture.debugElement;

    // eslint-disable-next-line oppia/no-inner-html
    let html = fixture.nativeElement.innerHTML.replace(/<!--[^>]*-->/g, '');
    expect(html).toBe('');

    fixture.detectChanges();
    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };
    component.rteString = rteString;
    component.ngOnChanges(changes);
    component.ngAfterViewInit();
    fixture.detectChanges();

    const attrs = rteComponentDe.query(
      By.css('oppia-noninteractive-link')
    ).attributes;
    expect(attrs['url-with-value']).toBe('"https://oppia.org"');
    expect(attrs['text-with-value']).toBe('"Oppia"');
    const link = rteComponentDe.query(By.css('a')).nativeElement;
    expect(link.attributes.href.nodeValue).toEqual('https://oppia.org');
    // eslint-disable-next-line oppia/no-inner-html
    expect(link.innerHTML.replace(/\s/g, '')).toEqual('Oppia');
  });

  it('should report errors when parsing', fakeAsync(() => {
    spyOn(rteParserService, 'constructFromDomParser').and.throwError('error');
    let rteString =
      '<p>Hi<em>Hello</em>Hello</p>' +
      '<pre> Hello </pre>' +
      '<oppia-noninteractive-link ' +
      'url-with-value="&quot;https://oppia.org&quot;" ' +
      'text-with-value="&quot;Oppia&quot;">' +
      '</oppia-noninteractive-link>';

    expect(() => {
      // eslint-disable-next-line oppia/no-inner-html
      let html = fixture.nativeElement.innerHTML.replace(/<!--[^>]*-->/g, '');
      expect(html).toBe('');

      fixture.detectChanges();
      let changes: SimpleChanges = {
        rteString: {
          previousValue: '',
          currentValue: rteString,
          firstChange: true,
          isFirstChange: () => true,
        },
      };
      component.rteString = rteString;
      component.ngOnChanges(changes);
      component.ngAfterViewInit();
    }).toThrowError();
  }));

  it('should not display type 3 nodes', fakeAsync(() => {
    const removeChildSpy = jasmine.createSpy('Remove child node');

    component.elementRef = {
      nativeElement: {
        childNodes: [
          {
            nodeType: 3,
            parentElement: {
              removeChild: removeChildSpy,
            },
          },
        ],
      },
    };
    let rteString = '<p>Hi<em>Hello</em>Hello</p>' + '<pre> Hello </pre>';

    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    component.ngOnChanges(changes);
    tick(100);

    expect(removeChildSpy).toHaveBeenCalled();
  }));

  it('should remove text nodes which are outside ng container bounds', fakeAsync(() => {
    let rteString = '<p>Hi<em>Hello</em>Hello</p>';

    let changes: SimpleChanges = {
      rteString: {
        previousValue: '',
        currentValue: rteString,
        firstChange: true,
        isFirstChange: () => true,
      },
    };

    const node = document.createTextNode('Congratulations! You have finished');
    component.elementRef.nativeElement.parentNode.insertBefore(
      node,
      component.elementRef.nativeElement
    );
    component.rteString = rteString;

    fixture.detectChanges();

    component.ngOnChanges(changes);

    tick(100);
    fixture.detectChanges();

    expect(component.elementRef.nativeElement.innerText).toEqual(
      'HiHelloHello'
    );
  }));
});
