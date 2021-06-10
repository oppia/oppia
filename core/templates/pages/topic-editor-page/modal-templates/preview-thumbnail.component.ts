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
 * @fileoverview Component for previewing thumbnails.
 */

import { Component, Input } from '@angular/core';
import { downgradeComponent } from '@angular/upgrade/static';
import { ContextService } from 'services/context.service';
import { ImageUploadHelperService } from 'services/image-upload-helper.service';

@Component({
  selector: 'oppia-preview-thumbnail',
  templateUrl: './preview-thumbnail.component.html'
})
export class PreviewThumbnailComponent {
  @Input() bgColor: string;
  @Input() filename: string;
  @Input() name: string;
  @Input() aspectRatio: string;
  @Input() description: string;
  @Input() previewFooter: string;
  @Input() thumbnailBgColor: string;
  @Input() previewTitle: string;
  editableThumbnailDataUrl: string;

  constructor(
    private contextService: ContextService,
    private imageUploadHelperService: ImageUploadHelperService
  ) {}

  ngOnInit(): void {
    this.editableThumbnailDataUrl = (
      this.imageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
        this.filename,
        this.contextService.getEntityType(),
        this.contextService.getEntityId()));
  }
}

angular.module('oppia').directive('oppiaPreviewThumbnail',
  downgradeComponent({
    component: PreviewThumbnailComponent
  }) as angular.IDirectiveFactory);
