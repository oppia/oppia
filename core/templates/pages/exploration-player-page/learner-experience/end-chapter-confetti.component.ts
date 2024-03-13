// Copyright 2022 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the end chapter celebration confetti component.
 */

import {Component, OnInit} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-end-chapter-confetti',
  templateUrl: './end-chapter-confetti.component.html',
})
export class EndChapterConfettiComponent implements OnInit {
  confettiIsShown: boolean = false;
  endChapterCelebratoryAudio = new Audio();

  constructor(private urlInterpolationService: UrlInterpolationService) {}

  ngOnInit(): void {
    this.endChapterCelebratoryAudio.src =
      this.urlInterpolationService.getStaticAudioUrl(
        '/end_chapter_celebratory_tadaa.mp3'
      );
    this.endChapterCelebratoryAudio.load();
  }

  animateConfetti(): void {
    this.confettiIsShown = true;
    this.endChapterCelebratoryAudio.play();
  }
}
