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
 * @fileoverview Component for the showing rich text.
 */

import { TemplatePortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectorRef, Component, Input, SimpleChanges, TemplateRef, ViewChild, ViewContainerRef } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { OppiaRteParserService, OppiaRteNode, TextNode } from 'services/oppia-rte-parser.service';

type PortalTree = (TemplatePortal<unknown> | PortalTree) [];

@Component({
  selector: 'oppia-rte-output-display',
  templateUrl: './rte-output-display.component.html',
  styleUrls: []
})
export class RteOutputDisplayComponent implements AfterViewInit {
  // Native HTML elements.
  @ViewChild('p') pTagPortal: TemplateRef<unknown>;
  @ViewChild('span') spanTagPortal: TemplateRef<unknown>;
  @ViewChild('ol') olTagPortal: TemplateRef<unknown>;
  @ViewChild('li') liTagPortal: TemplateRef<unknown>;
  @ViewChild('ul') ulTagPortal: TemplateRef<unknown>;
  @ViewChild('pre') preTagPortal: TemplateRef<unknown>;
  @ViewChild('strong') strongTagPortal: TemplateRef<unknown>;
  @ViewChild('blockquote') blockquoteTagPortal: TemplateRef<unknown>;
  @ViewChild('em') emTagPortal: TemplateRef<unknown>;
  @ViewChild('text') textTagPortal: TemplateRef<unknown>;
  // Oppia Non interactive.
  @ViewChild('collapsible') collapsibleTagPortal: TemplateRef<unknown>;
  @ViewChild('image') imageTagPortal: TemplateRef<unknown>;
  @ViewChild('link') linkTagPortal: TemplateRef<unknown>;
  @ViewChild('math') mathTagPortal: TemplateRef<unknown>;
  @ViewChild('skillreview') skillreviewTagPortal: TemplateRef<unknown>;
  @ViewChild('svgdiagram') svgdiagramTagPortal: TemplateRef<unknown>;
  @ViewChild('tabs') tabsTagPortal: TemplateRef<unknown>;
  @ViewChild('video') videoTagPortal: TemplateRef<unknown>;
  @Input() rteString: string;
  node: OppiaRteNode | string = '';
  show = false;
  portalTree: PortalTree = [];

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private cdRef: ChangeDetectorRef,
    private oppiaHtmlParserService: OppiaRteParserService
  ) {}

  private _updateNode(): void {
    if (this.rteString === undefined || this.rteString === null) {
      return;
    }
    // When there are trailing spaces in the HTML, CKEditor adds &nbsp;
    // to the HTML (eg: '<p> Text &nbsp; &nbsp; %nbsp;</p>'), which can
    // lead to UI issues when displaying it. Hence, the following block
    // replaces the trailing ' &nbsp; &nbsp; %nbsp;</p>' with just '</p>'.
    // We can't just find and replace '&nbsp;' here since, those in the
    // middle may actually be required. Only the trailing ones need to be
    // replaced.
    this.rteString = this.rteString.replace(/(&nbsp;(\s)?)*(<\/p>)/g, '</p>');
    // The following line is required since blank newlines in between
    // paragraphs are treated as <p>&nbsp;</p> by ckedior. So, these
    // have to be restored, as this will get reduced to <p></p> above.
    // There is no other via user input to get <p></p>, so this wouldn't
    // affect any other data.
    this.rteString = this.rteString.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
    let domparser = new DOMParser();
    let dom = domparser.parseFromString(this.rteString, 'text/html').body;
    this.node = this.oppiaHtmlParserService.constructFromDomParser(dom);
    const dfs = (node: OppiaRteNode | TextNode | string) => {
      if (typeof node === 'string') {
        return;
      }
      node.portal = this.getTemplatePortal(node);
      if (!('children' in node)) {
        return;
      }
      for (const child of node.children) {
        dfs(child);
      }
    };
    dfs(this.node);
    this.cdRef.detectChanges();
  }

  isLeaf(node: OppiaRteNode | string): boolean {
    return typeof node === 'string';
  }

  ngAfterViewInit(): void {
    this._updateNode();
    this.show = true;
    this.cdRef.detectChanges();
  }

  getTemplatePortal(node: OppiaRteNode | TextNode): TemplatePortal<unknown> {
    if ('value' in node) {
      return new TemplatePortal(
        this.textTagPortal,
        this._viewContainerRef,
        { $implicit: node }
      );
    }
    if (node.nodeType === 'component') {
      return new TemplatePortal(
        this[node.selector.split('oppia-noninteractive-')[1] + 'TagPortal'],
        this._viewContainerRef,
        { $implicit: node.attrs }
      );
    }
    if (this[node.selector + 'TagPortal'] !== undefined) {
      return new TemplatePortal(
        this[node.selector + 'TagPortal'],
        this._viewContainerRef,
        { $implicit: node }
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.rteString &&
        changes.rteString.previousValue !== changes.rteString.currentValue) {
      this._updateNode();
    }
  }
}

angular.module('oppia').directive('oppiaRteOutputDisplay', downgradeComponent({
  component: RteOutputDisplayComponent
}));
