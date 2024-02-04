// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the primary buttons displayed on static pages.
 */

import { Component, Input, Output, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import './primary-button.component.css';


@Component({
  selector: 'oppia-primary-button',
  templateUrl: './primary-button.component.html',
  styleUrls: ['./primary-button.component.css']
})
export class PrimaryButtonComponent implements OnInit {
  @Input() buttonText: string = '';
  @Input() customClasses?: string[];
  @Input() disabled?: boolean = false;
  @Input() buttonHref: string = "#";
  @Output() onClickPrimaryButton: EventEmitter<void> = new EventEmitter<void>();
  @Input() isButton?: boolean = false;
  
  openInNewTab: boolean;

  ngOnInit(): void {
    if (this.buttonHref) {
      this.openInNewTab = this.isExternalLink(this.buttonHref);
    }
  }

  getButtonHref(): string {
    return this.buttonHref;
  }

  private isExternalLink(link: string): boolean {
    return link.startsWith('http://') || link.startsWith('https://');
  }

  handleButtonClick(): void {
    if (this.onClickPrimaryButton.observers.length > 0) {
      this.onClickPrimaryButton.emit();
    }
  }
}

angular.module('oppia').directive('oppiaPrimaryButton',
  downgradeComponent({
    component: PrimaryButtonComponent
  }) as angular.IDirectiveFactory);
