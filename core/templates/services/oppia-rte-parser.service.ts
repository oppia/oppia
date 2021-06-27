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
import { NoninteractiveSvgdiagram } from 'rich_text_components/Svgdiagram/directives/oppia-noninteractive-svgdiagram.component';
import { NoninteractiveTabs } from 'rich_text_components/Tabs/directives/oppia-noninteractive-tabs.component';
import { NoninteractiveVideo } from 'rich_text_components/Video/directives/oppia-noninteractive-video.component';

const selectorToComponentClassMap = {
  'oppia-noninteractive-collapsible': NoninteractiveCollapsible,
  'oppia-noninteractive-image': NoninteractiveImage,
  'oppia-noninteractive-link': NoninteractiveLink,
  'oppia-noninteractive-math': NoninteractiveMath,
  'oppia-noninteractive-skillreview': NoninteractiveSkillreview,
  'oppia-noninteractive-svgdiagram': NoninteractiveSvgdiagram,
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
        throw Error('Unexpected tag encountered: ' + selector);
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

      // Continue Recursion.
      /**
       * Case: <p>Hi <em> This is tricky </em> Can't <b>with</b> DOM parser </p>
       * Problem: We don't get the text nodes as children. It isn't stored in
       *   DomParsers representation separately but only as a part of innerHTML.
       * Solution: The innerHTML of the case is:
       *   "Hi <em> This is tricky </em> Can't <b>with</b> DOM parser ". There
       *   are two children (em, b). That means there are three zones for texts:
       *   "Zone 1 <em>...</em> Zone 2 <b>...</b> Zone 3".
       *   Zone 1 = From start to the first index of <em.
       *   Zone 2 = From index of first </em> to first indexOf <b>
       *   Zone 3 = From index of first </b> to end.
       *   As we can see that this can get very complicated soon when there are
       *   multiple child elements having the same tag. Fortunately, the fix for
       *   this is easy. We can remove children that have already been parsed.
       *   That will mean we only need to look at the first indexOf of tag and
       *   keep a track of the text we have already loaded. Here is a dry run of
       *   the algorithm on the sample case listed above:
       *   ------------------------------- Data --------------------------------
       *   node.children = [Node: em, Node: b]
       *   node.innerHTML = ("Hi <em> This is tricky </em> Can't <b>with</b> DOM
       *     parser ")
       *   max = 2
       *   ---------------------------- Iteration 0 ----------------------------
       *   prevPointer = 0
       *   child = 0
       *   t = "em"
       *   node.innerHTML.indexOf('<' + t) = 3
       *   text = node.innerHTML.substring(
       *     prevPointer, node.innerHTML.indexOf('<' + t)) = "Hi ";
       *   node.removeChild(em)
       *   ---------------------------- Iteration 1 ----------------------------
       *   prevPointer = 3
       *   child = 1
       *   t = "b"
       *   node.innerHTML = "Hi  Can't <b>with</b> DOM parser "
       *   node.innerHTML.indexOf('<' + t) = 10
       *   text = node.innerHTML.substring(
       *     prevPointer, node.innerHTML.indexOf('<' + t)) = " Can't ";
       *   node.removeChild(b)
       *  ------------------------- Outside for loop ---------------------------
       *  prevPointer = 10
       *  node.innerHTML = "Hi  Can't  DOM parser "
       *  text = " DOM parser "
       *  -------------------------- End of Dry Run ----------------------------
       * Note that the text extracted are trimmed.
       */
      let prevPointer = 0;
      const max = Object.keys(node.children).length;
      const childNode = new OppiaRteNode(tagName, attrs);
      for (let child = 0; child < max; child++) {
        const temp = dfs(node.children[0] as HTMLElement);
        const t = node.children[0].tagName.toLowerCase();
        const text = node.innerHTML.substring(
          prevPointer, node.innerHTML.indexOf('<' + t)
        ).replace(/[\t\n]/g, '').trim();
        if (text !== '') {
          childNode.children.push(new TextNode(text));
        }
        prevPointer = node.innerHTML.indexOf('<' + t);
        node.removeChild(node.children[0]);
        childNode.children.push(temp);
      }
      if (prevPointer + 1 < node.innerHTML.length) {
        const text = node.innerHTML.substring(
          prevPointer, node.innerHTML.length
        ).replace(/[\t\n]/g, '').trim();
        if (text !== '') {
          childNode.children.push(new TextNode(text));
        }
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
