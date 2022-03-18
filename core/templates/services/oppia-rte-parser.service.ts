// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for parsing rich text string.
 */

import { TemplatePortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { NoninteractiveCollapsible } from 'rich_text_components/Collapsible/directives/oppia-noninteractive-collapsible.component';
import { NoninteractiveImage } from 'rich_text_components/Image/directives/oppia-noninteractive-image.component';
import { NoninteractiveLink } from 'rich_text_components/Link/directives/oppia-noninteractive-link.component';
import { NoninteractiveMath } from 'rich_text_components/Math/directives/oppia-noninteractive-math.component';
import { NoninteractiveSkillreview } from 'rich_text_components/Skillreview/directives/oppia-noninteractive-skillreview.component';
import { NoninteractiveTabs } from 'rich_text_components/Tabs/directives/oppia-noninteractive-tabs.component';
import { NoninteractiveVideo } from 'rich_text_components/Video/directives/oppia-noninteractive-video.component';

const selectorToComponentClassMap = {
  'oppia-noninteractive-collapsible': NoninteractiveCollapsible,
  'oppia-noninteractive-image': NoninteractiveImage,
  'oppia-noninteractive-link': NoninteractiveLink,
  'oppia-noninteractive-math': NoninteractiveMath,
  'oppia-noninteractive-skillreview': NoninteractiveSkillreview,
  'oppia-noninteractive-tabs': NoninteractiveTabs,
  'oppia-noninteractive-video': NoninteractiveVideo
};

export class TextNode {
  portal: undefined | TemplatePortal;
  constructor(public value: string) {}
}


export class OppiaRteNode {
  children: (OppiaRteNode | TextNode)[] = [];
  parent: OppiaRteNode | null = null;
  nodeType: '' | 'component';
  portal: TemplatePortal;
  constructor(
    public readonly selector: string,
    public attrs: Record<string, string> = {}
  ) {
    let t: '' | 'component' = '';
    if (this.selector.startsWith('oppia-noninteractive-')) {
      t = 'component';
      if (selectorToComponentClassMap[this.selector] === undefined) {
        throw new Error('Unexpected tag encountered: ' + selector);
      }
    }
    this.nodeType = t;
  }
}

@Injectable({
  providedIn: 'root'
})
export class OppiaRteParserService {
  NON_INTERACTIVE_PREFIX = 'oppia-noninteractive-';
  domparser = new DOMParser();
  private _convertKebabCaseToCamelCase(key: string): string {
    let arr = key.replace(/_/g, '-').split('-');
    let capital = arr.map((item, index) => {
      // eslint-disable-next-line max-len
      return index ? item.charAt(0).toUpperCase() + item.slice(1).toLowerCase() : item.toLowerCase();
    }
    );
    return capital.join('');
  }

  constructFromDomParser(body: HTMLElement): OppiaRteNode {
    const dfs = (node: HTMLElement): OppiaRteNode => {
      if (!node.tagName) {
        throw new Error(
          'tagName is undefined.\n' +
          `body: ${ body.outerHTML }\n node: ${ node.outerHTML }`);
      }
      const tagName = node.tagName.toLowerCase();
      const attrs: Record<string, string> = {};

      // Create attributes Object from NamedNodeMap.
      for (let i = 0; i < node.attributes.length; i++) {
        attrs[this._convertKebabCaseToCamelCase(node.attributes[i].nodeName)] =
          node.attributes[i].nodeValue;
      }

      // Check if it an RTE component.
      if (tagName.startsWith(this.NON_INTERACTIVE_PREFIX)) {
        return new OppiaRteNode(tagName, attrs);
      }

      // Check if it is a text node.
      if (Object.keys(node.children).length === 0) {
        const childNode = new OppiaRteNode(tagName, attrs);
        childNode.children.push(new TextNode(node.textContent));
        return childNode;
      }

      const max = Object.keys(node.childNodes).length;
      const childNode = new OppiaRteNode(tagName, attrs);
      for (let child = 0; child < max; child++) {
        if (node.childNodes[child].nodeType === 3) {
          const text = node.childNodes[child].nodeValue.replace(
            /[\t\n]/g, '');
          childNode.children.push(new TextNode(text));
          continue;
        }
        const temp = dfs(node.childNodes[child] as HTMLElement);
        childNode.children.push(temp);
      }
      return childNode;
    };

    // Return dfs of body.
    return dfs(body);
  }

  constructFromRteString(rteString: string): OppiaRteNode {
    return this.constructFromDomParser(
      this.domparser.parseFromString(rteString, 'text/html').body
    );
  }
}
