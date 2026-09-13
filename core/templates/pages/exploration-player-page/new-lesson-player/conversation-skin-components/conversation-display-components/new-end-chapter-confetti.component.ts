// Copyright 2025 The Oppia Authors. All Rights Reserved.
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

import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import {UrlInterpolationService} from 'domain/utilities/url-interpolation.service';

@Component({
  selector: 'oppia-new-end-chapter-confetti',
  templateUrl: './new-end-chapter-confetti.component.html',
  styleUrls: ['./new-end-chapter-confetti.component.css'],
})
export class NewEndChapterConfettiComponent implements OnInit {
  @Input() topOffset: string = '40px';
  @Input() audioIsEnabled: boolean = true;
  @ViewChild('confettiVideo') confettiVideoRef!: ElementRef<HTMLVideoElement>;
  confettiIsShown: boolean = false;
  confettiVideoUrl: string = '';
  endChapterCelebratoryAudio = new Audio();

  constructor(
    private urlInterpolationService: UrlInterpolationService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.endChapterCelebratoryAudio.src =
      this.urlInterpolationService.getStaticAudioUrl(
        '/end_chapter_celebratory_tadaa.mp3'
      );
    this.endChapterCelebratoryAudio.load();

    // NOTE: Oppia's UrlInterpolationService does not currently expose a
    // dedicated getStaticVideoUrl helper, so we reuse getStaticImageUrl to
    // resolve this webm asset. getStaticImageUrl() always resolves paths
    // relative to the top-level `assets/images/` directory (not relative
    // to this component's own folder), so this file MUST physically live
    // at `assets/images/exploration_player/end_chapter_confetti.webm` in
    // the repo root for this to resolve correctly. If a getStaticVideoUrl
    // helper is added
    // to UrlInterpolationService in the future, this call should be
    // updated to use it instead.
    this.confettiVideoUrl = this.urlInterpolationService.getStaticImageUrl(
      '/exploration_player/end_chapter_confetti.webm'
    );
  }

  animateConfetti(): void {
    this.confettiIsShown = true;
    this.cdRef.detectChanges();
    this.endChapterCelebratoryAudio.play();

    const confettiVideo = this.confettiVideoRef?.nativeElement;
    if (confettiVideo) {
      confettiVideo.currentTime = 0;
      confettiVideo.play();
      confettiVideo.onended = () => {
        this.confettiIsShown = false;
        this.cdRef.detectChanges();
      };
    }
  }
}
