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
 * @fileoverview Spec for service that parses rich text string.
 */

import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { OppiaRteNode, OppiaRteParserService, TextNode } from './oppia-rte-parser.service';

describe('RTE parser service', () => {
  let rteParserService: OppiaRteParserService;

  const compareRteNodeToObject = (node: OppiaRteNode, dom) => {
    const dfs = (n: OppiaRteNode | TextNode, d) => {
      if ('value' in n) {
        if (!d.value) {
          return false;
        }
        if (n.value !== d.value) {
          return false;
        }
        return true;
      }
      if (d.value) {
        return false;
      }
      if (n.selector !== d.tag) {
        return false;
      }
      if ((n.attrs && !d.attrs) || (!n.attrs && d.attrs)) {
        return false;
      }
      if (n.attrs && d.attrs) {
        if (Object.keys(n.attrs).length !== Object.keys(d.attrs).length) {
          return false;
        }
        for (let key of Object.keys(n.attrs)) {
          if (n.attrs[key] !== d.attrs[key]) {
            return false;
          }
        }
        if (n.selector.startsWith(rteParserService.NON_INTERACTIVE_PREFIX)) {
          return true;
        }
      }

      if (n.children.length !== d.children.length) {
        return false;
      }
      for (let childIndex = 0; childIndex < n.children.length; childIndex++) {
        if (!dfs(n.children[childIndex], d.children[childIndex])) {
          return false;
        }
      }
      return true;
    };
    return dfs(node, dom);
  };

  beforeEach(() => {
    rteParserService = TestBed.inject(OppiaRteParserService);
  });

  it('should generate a custom representation of the rte string', () => {
    let testCases = [{
      rteString: '<p>Hi<em>Hello</em>Hello</p>' +
                 '<oppia-noninteractive-link url-with-value="url"' +
                                            'link-with-value="link">' +
                 '</oppia-noninteractive-link>',
      representation: {
        tag: 'body',
        attrs: {},
        children: [
          {
            tag: 'p',
            attrs: {},
            children: [
              new TextNode('Hi'),
              {
                tag: 'em',
                attrs: {},
                children: [new TextNode('Hello')]
              },
              new TextNode('Hello')
            ]
          },
          {
            tag: 'oppia-noninteractive-link',
            attrs: {
              urlWithValue: 'url',
              linkWithValue: 'link'
            }
          }
        ]
      }
    }];
    testCases.forEach(testCase => {
      let node = rteParserService.constructFromRteString(testCase.rteString);
      expect(
        compareRteNodeToObject(node, testCase.representation)
      ).toBe(true, testCase.rteString);
    });
  });

  it('should throw an error if parsing fails', () => {
    class DummyHtmlElement extends HTMLElement {
      constructor() {
        super();
      }

      get tagName() {
        return undefined;
      }
    }
    customElements.define('dummy-element', DummyHtmlElement);

    expect(() => {
      rteParserService.constructFromDomParser(new DummyHtmlElement());
    }).toThrowError(
      'tagName is undefined.\n' +
      'body: <dummy-element></dummy-element>\n ' +
      'node: <dummy-element></dummy-element>');
  });

  it('should parse a simple element', () => {
    const document = TestBed.inject(DOCUMENT);
    const dummyElement = document.createElement('div');
    expect(
      rteParserService.constructFromDomParser(dummyElement).selector
    ).toEqual('div');
  });

  // Noninteractive components are easily identified by the oppia-noninteractive
  // prefix. Some would try and fool this by using custom selectors that start
  // by the prefix. In that case, the code will throw an error.
  it(
    'should throw an error when a noninteractive component is not valid rte ' +
    'component',
    () => {
      let testCases = [{
        rteString: '<oppia-noninteractive-lin url-with-value="url"' +
                                            'link-with-value="link">' +
                 '</oppia-noninteractive-lin>',
        errorString: 'Unexpected tag encountered: oppia-noninteractive-lin'
      }];
      testCases.forEach(testCase => {
        expect(
          () => rteParserService.constructFromRteString(testCase.rteString)
        ).toThrowError(testCase.errorString);
      });
    });
});
