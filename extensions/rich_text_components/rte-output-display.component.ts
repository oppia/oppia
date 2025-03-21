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

import {TemplatePortal} from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Directive,
  ElementRef,
  Input,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import {AppConstants} from 'app.constants';
import {TranslationTabActiveContentIdService} from 'pages/exploration-editor-page/translation-tab/services/translation-tab-active-content-id.service';
import {VoiceoverPlayerService} from 'pages/exploration-player-page/services/voiceover-player.service';
import {AudioPlayerService} from 'services/audio-player.service';
import {ContextService} from 'services/context.service';
import {EntityVoiceoversService} from 'services/entity-voiceovers.services';
import {AutomaticVoiceoverHighlightService} from 'services/automatic-voiceover-highlight-service';
import {
  OppiaRteParserService,
  OppiaRteNode,
  TextNode,
} from 'services/oppia-rte-parser.service';
import {ServicesConstants} from 'services/services.constants';
import {LocalStorageService} from 'services/local-storage.service';
import {PlatformFeatureService} from 'services/platform-feature.service';

type PortalTree = (TemplatePortal<unknown> | PortalTree)[];

@Component({
  selector: 'oppia-rte-output-display',
  templateUrl: './rte-output-display.component.html',
  styleUrls: [],
})
export class RteOutputDisplayComponent implements OnInit, AfterViewInit {
  // Native HTML elements.
  @ViewChild('p') pTagPortal: TemplateRef<unknown>;
  @ViewChild('h1') h1TagPortal: TemplateRef<unknown>;
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
  // Remove this
  @ViewChild('treeContainer', {static: false}) treeContainer: ElementRef;
  @ViewChild('highlight') highlightTagPortal: ElementRef;
  @Input() rteString: string;
  @Input() altTextIsDisplayed: boolean = false;
  node: OppiaRteNode | string = '';
  show = false;
  portalTree: PortalTree = [];

  highlighIdToSentenceText = {};
  wrapped = false;
  previousHighlightedElementId!: string;
  // The background color of the sentence being played in the audio player.
  backgroundColorOfHighlightedSentence = '#f3d140';

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private cdRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    private oppiaHtmlParserService: OppiaRteParserService,
    private entityVoiceoversService: EntityVoiceoversService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
    private audioPlayerService: AudioPlayerService,
    private voiceoverPlayerService: VoiceoverPlayerService,
    private contextService: ContextService,
    private automaticVoiceoverHighlightService: AutomaticVoiceoverHighlightService,
    private localStorageService: LocalStorageService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  wrapSentencesInSpansForHighlighting(htmlString: string): string {
    // This prevents wrapping the sentences in spans multiple times.
    if (this.wrapped) {
      return htmlString;
    }
    this.wrapped = true;

    let languageCode =
      this.localStorageService.getLastSelectedTranslationLanguageCode();

    // To split sentences from the lesson content, we need to use
    // language-specific punctuation marks.
    const punctuationsForCurrentLanguage =
      AppConstants.LANGUAGE_CODE_TO_SENTENCE_ENDING_PUNCTUATION_MARKS[
        languageCode
      ];

    // The regex below is used to split sentences from the lesson content.
    const sentenceRegex = new RegExp(
      `(?<=[${punctuationsForCurrentLanguage}])(?<!\\.\\.)["']?\\s*(?=[A-Z”])`,
      'g'
    );

    // Create a temporary DOM element.
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;

    // The index is used to assign a unique id to each sentence of the
    // lesson content.
    let index = 1;

    let highlighIdToSentenceText = {};

    function traverse(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent || '';
        const sentences = textContent.split(sentenceRegex);
        const fragment = document.createDocumentFragment();

        sentences.forEach(sentence => {
          if (sentence.trim()) {
            // Create a span element for each sentence to be highlighted during
            // voiceover playback.
            const wordsToHighlight = document.createElement('span');

            let elementId = `highlightBlock${index}`;
            wordsToHighlight.id = elementId;
            wordsToHighlight.textContent = sentence;

            fragment.appendChild(wordsToHighlight);

            highlighIdToSentenceText[elementId] = sentence;
            index++;
          }
        });
        node.parentNode?.replaceChild(fragment, node);
      } else {
        node.childNodes.forEach(traverse);
      }
    }

    traverse(tempDiv);
    this.highlighIdToSentenceText = highlighIdToSentenceText;

    return tempDiv.innerHTML;
  }

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
    this.rteString = this.rteString.replace(/\n/g, '');

    // The following line wraps each sentence in a span tag to highlight
    // the sentence during voiceover playback.
    this.rteString = this.wrapSentencesInSpansForHighlighting(this.rteString);

    let domparser = new DOMParser();
    let dom = domparser.parseFromString(this.rteString, 'text/html').body;
    try {
      this.node = this.oppiaHtmlParserService.constructFromDomParser(dom);
    } catch (e) {
      const additionalInfo = '\nRTE String: ' + this.rteString;
      e.message += additionalInfo;
      throw e;
    }
    const dfs = (node: OppiaRteNode | TextNode) => {
      node.portal = this._getTemplatePortal(node);
      if (!('children' in node)) {
        return;
      }
      for (const child of node.children) {
        dfs(child);
      }
    };
    dfs(this.node);
    this.cdRef.detectChanges();
    // The following logic is to remove comment tags (used by angular for
    // bindings). New lines and spaces inside the pre-tags are treated
    // differently when compared to other tags. So with the comments come new
    // line inside pre tags. These cause the rte output to look differently than
    // what it was shown in ck-editor. So we remove all the comments and empty
    // TextNode. Am empty TextNode is a TextNode whose nodeValue only consists
    // of whiteSpace characters and new lines. The setTimeout is needed to run
    // it in the next clock cycle so that the view has been rendered.
    setTimeout(() => {
      (this.elementRef.nativeElement as HTMLElement)
        .querySelectorAll('pre')
        .forEach(preNode => {
          for (let i = 0; i < preNode.childNodes.length; i++) {
            if (preNode.childNodes[i].nodeType === 8) {
              preNode.removeChild(preNode.childNodes[i]);
              i--;
              continue;
            }
            if (preNode.childNodes[i].nodeType === 3) {
              if (preNode.childNodes[i].nodeValue.replace(/\s/g, '') === '') {
                preNode.removeChild(preNode.childNodes[i]);
                i--;
              }
            }
          }
        });
    });
  }

  isAutomaticVoiceoverRegenerationFromExpFeatureEnabled(): boolean {
    return this.platformFeatureService.status
      .AutomaticVoiceoverRegenerationFromExp.isEnabled;
  }

  ngOnInit(): void {
    // If the below feature flag is not enabld then the sentence highlighting
    // feature will not work.
    if (!this.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()) {
      return;
    }

    this.automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets(
      this.entityVoiceoversService.getActiveEntityVoiceovers()
        ?.automatedVoiceoversAudioOffsetsMsecs || {}
    );
    this.automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges();

    // The below lines runs on every 200ms to highlight the sentence being
    // played in the audio player.
    setInterval(() => {
      // Highlight only when the audio is playing.
      if (this.audioPlayerService.isPlaying()) {
        let previousHighlightedElement = document.getElementById(
          this.previousHighlightedElementId
        );

        let currentElementIdToHighlight =
          this.automaticVoiceoverHighlightService.getCurrentSentenceIdToHighlight(
            this.audioPlayerService.getCurrentTimeInSecs()
          );

        // If previous highlighted sentence and current sentence are same, then
        // do not highlight the sentence again.
        if (
          previousHighlightedElement?.textContent ===
          this.highlighIdToSentenceText[currentElementIdToHighlight]
        ) {
          return;
        }

        // Removes the highlight background from the previous sentence.
        if (previousHighlightedElement) {
          previousHighlightedElement.style.backgroundColor = '';
        }

        let currentElementToHighlight = document.getElementById(
          currentElementIdToHighlight
        );

        // Highlights the current sentence being played in the audio player.
        if (currentElementToHighlight) {
          // Apply CSS for smooth transition
          currentElementToHighlight.style.backgroundColor =
            this.backgroundColorOfHighlightedSentence;

          this.previousHighlightedElementId = currentElementIdToHighlight;
        }
      } else {
        // Removes the highlight from the previous sentence when the audio is
        // paused.
        let previousHighlightedElement = document.getElementById(
          this.previousHighlightedElementId
        );
        if (previousHighlightedElement) {
          previousHighlightedElement.style.backgroundColor = '';
        }
      }
    }, 200);
  }

  getActiveContentId(): string {
    // The below if-else block is used to get the active content ID based on the
    // current page.
    if (
      this.contextService.isInExplorationPlayerPage() ||
      (this.contextService.isInExplorationEditorPage() &&
        this.contextService.getEditorTabContext() ===
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW)
    ) {
      return this.voiceoverPlayerService.getActiveContentId();
    } else {
      return this.translationTabActiveContentIdService.getActiveContentId();
    }
  }

  ngAfterViewInit(): void {
    this._updateNode();
    this.show = true;
    this.cdRef.detectChanges();
  }

  private _getTemplatePortal(
    node: OppiaRteNode | TextNode
  ): TemplatePortal<unknown> {
    if ('value' in node) {
      return new TemplatePortal(this.textTagPortal, this._viewContainerRef, {
        $implicit: node,
      });
    }
    if (node.nodeType === 'component') {
      return new TemplatePortal(
        this[node.selector.split('oppia-noninteractive-')[1] + 'TagPortal'],
        this._viewContainerRef,
        {$implicit: node.attrs}
      );
    }
    if (this[node.selector + 'TagPortal'] !== undefined) {
      return new TemplatePortal(
        this[node.selector + 'TagPortal'],
        this._viewContainerRef,
        {$implicit: node}
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.rteString &&
      changes.rteString.previousValue !== changes.rteString.currentValue
    ) {
      /**
       * The following serves as an excellent example of why we shouldn't use
       * js and elementRef.nativeElement to manipulate the DOM. When doing so
       * angular has no reference to the node we create and attach to the DOM.
       * So angular won't be able to clear the nodes out during change detection
       * runs. And since we were relying on angular to do so and not manually
       * deleting, this creates a memory leak. We will still have stale elements
       * in the dom. To get around this, there is variable called show, that is
       * used as an expression of ngIf. Whenever this is false, all the children
       * inside it will be destroyed (irrespective of whether angular created it
       * or us). The setTimeout is to make sure that a changeDetection cycle
       * runs and we only start showing the content after it. If the setTimeout
       * is removed, angular won't register a change in this.show as this.show
       * is set to false and then back to true on the same change detection
       * cycle and hence, we will still have the problem.
       */
      this.show = false;
      this.wrapped = false;
      // The rte text node is inserted outside the bounds of ng container.
      // Hence, it needs to be removed manually otherwise resdiual text will
      // appear when rte text changes.
      const textNodes: Text[] = [];

      for (const node of this.elementRef.nativeElement.childNodes) {
        if ((node as Node).nodeType === Node.TEXT_NODE) {
          textNodes.push(node);
        }
      }

      textNodes.forEach(node => node.parentElement.removeChild(node));

      this._updateNode();

      // If the below feature flag is not enabld then the sentence highlighting
      // feature will not work.
      if (this.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()) {
        const activeContentId = this.getActiveContentId();
        this.automaticVoiceoverHighlightService.setActiveContentId(
          activeContentId
        );
        this.automaticVoiceoverHighlightService.setHighlightIdToSenetnceMap(
          this.highlighIdToSentenceText
        );
        this.automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges();
      }
      setTimeout(() => (this.show = true), 0);
    }
  }
}

/**
 * The directive below is required because we have &nbsp; in the string. String
 * interpolation is a very safe operation in angular and these values are
 * changed to show the characters &nbsp; (they actually show &#160, the machine
 * code for &nbsp;) instead of whitespace. In order to get around this, the
 * directive is used instead of `{{}}` and `[innerHtml]`. This is a very safe
 * operation because of TextNodes. It should prevent all HTML injection attacks
 * including XSS attacks.
 */
@Directive({selector: '[oppiaRteTextNode]'})
export class OppiaRteTextNodeDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef) {}

  @Input() oppiaRteTextNode: string = '';
  ngAfterViewInit(): void {
    // Creating a text node makes it safe from any XSS attacks.
    const node = document.createTextNode(this.oppiaRteTextNode);
    const parentNode = this.elementRef.nativeElement.parentNode;
    parentNode.insertBefore(node, this.elementRef.nativeElement);
  }
}
