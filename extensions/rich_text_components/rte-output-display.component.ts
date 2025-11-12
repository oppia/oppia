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
import {PageContextService} from 'services/page-context.service';
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
import {Voiceover} from 'domain/exploration/voiceover.model';

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
  @ViewChild('workedexample') workedexampleTagPortal: TemplateRef<unknown>;
  @Input() rteString: string;
  @Input() altTextIsDisplayed: boolean = false;
  node: OppiaRteNode | string = '';
  show = false;
  portalTree: PortalTree = [];

  highlightIdToSentenceText = {};
  wrapped = false;
  previousHighlightedElementId!: string | undefined;
  // The background color of the sentence being played in the audio player.
  backgroundColorOfHighlightedSentence = '#f3d140';

  customOppiaTags = [
    'OPPIA-NONINTERACTIVE-COLLAPSIBLE',
    'OPPIA-NONINTERACTIVE-IMAGE',
    'OPPIA-NONINTERACTIVE-LINK',
    'OPPIA-NONINTERACTIVE-MATH',
    'OPPIA-NONINTERACTIVE-VIDEO',
    'OPPIA-NONINTERACTIVE-SKILLREVIEW',
    'OPPIA-NONINTERACTIVE-TABS',
    'OPPIA-NONINTERACTIVE-WORKEDEXAMPLE',
  ];

  // The index is used to assign a unique ID to each sentence of the lesson content.
  index = 1;

  // Parent tags eligible for voiceover highlighting. Text within these tags
  // is split into sentences and wrapped in span tags. Tags like i, strong, etc.,
  // do not require special handling.
  acceptedTagsForVoiceoverHighlighting = ['P', 'LI'];

  constructor(
    private _viewContainerRef: ViewContainerRef,
    private cdRef: ChangeDetectorRef,
    public elementRef: ElementRef,
    private oppiaHtmlParserService: OppiaRteParserService,
    private entityVoiceoversService: EntityVoiceoversService,
    private translationTabActiveContentIdService: TranslationTabActiveContentIdService,
    private audioPlayerService: AudioPlayerService,
    private voiceoverPlayerService: VoiceoverPlayerService,
    private pageContextService: PageContextService,
    private automaticVoiceoverHighlightService: AutomaticVoiceoverHighlightService,
    private localStorageService: LocalStorageService,
    private platformFeatureService: PlatformFeatureService
  ) {}

  // The function decodes the HTML escape characters in the string.
  decodeHtmlEntities(str: string): string {
    const textarea = document.createElement('textarea');
    // eslint-disable-next-line oppia/no-inner-html
    textarea.innerHTML = str;
    return textarea.value;
  }

  /*
  The method below converts LaTeX expressions to a more readable format.
  It replaces LaTeX commands with their corresponding symbols or
  representations. For example, it converts \frac{a}{b} to a/b.
  */
  parseAndConvertLatex(latexExpr: string): string {
    const readable = latexExpr
      .replace(/\\frac{(.+?)}{(.+?)}/g, '$1/$2')
      .replace(/\\times/g, '×')
      .replace(/\\div/g, '÷')
      .replace(/\\cdot/g, '·')
      .replace(/\\sqrt{(.+?)}/g, '√($1)')
      .replace(/\\left|\\right/g, '')
      .replace(/\\[a-zA-Z]+/g, '')
      .replace(/{|}/g, '');
    return readable;
  }

  // The method returns the readable text from the node.
  getReadableTextFromNode(node: Node): string {
    if (
      node.nodeType === Node.TEXT_NODE ||
      node.nodeName === 'STRONG' ||
      node.nodeName === 'EM'
    ) {
      return node.textContent || '';
    } else if (
      node.nodeName === 'OPPIA-NONINTERACTIVE-SKILLREVIEW' ||
      node.nodeName === 'OPPIA-NONINTERACTIVE-LINK'
    ) {
      const encodedText = (node as Element).getAttribute('text-with-value');
      const decodedText = this.decodeHtmlEntities(encodedText);
      return JSON.parse(decodedText);
    } else if (node.nodeName === 'OPPIA-NONINTERACTIVE-MATH') {
      const encodedMathContent = (node as Element).getAttribute(
        'math_content-with-value'
      );
      const decodedMathContent = this.decodeHtmlEntities(encodedMathContent);
      const latexText = JSON.parse(decodedMathContent)?.raw_latex;
      return this.parseAndConvertLatex(latexText);
    }
  }

  // The method recursively traverses the node and wraps span tags around
  // the sentences.
  traverseNodeAndWrapSpanTags(
    node: Node,
    sentenceRegex: RegExp
  ): Node[] | HTMLElement | Text[] | Node {
    const currentNodeName = node.nodeName;

    if (node.nodeType === Node.TEXT_NODE) {
      const textContent = node.textContent || '';
      const sentences = textContent.split(sentenceRegex);
      let textNodesForSentences: Text[] = [];

      for (let sentence of sentences) {
        textNodesForSentences.push(document.createTextNode(sentence));
      }
      return textNodesForSentences;
    } else {
      let updatedChildNodes: Node[] = [];

      node.childNodes.forEach(childNode => {
        updatedChildNodes = updatedChildNodes.concat(
          this.traverseNodeAndWrapSpanTags(childNode, sentenceRegex)
        );
      });

      if (node.nodeName === 'DIV') {
        let wrapper = document.createElement('div');
        updatedChildNodes.forEach(child => {
          wrapper.appendChild(child);
        });
        return wrapper;
      }

      if (
        !this.acceptedTagsForVoiceoverHighlighting.includes(currentNodeName)
      ) {
        // No changes are required for custom Oppia tags.
        if (this.customOppiaTags.includes(currentNodeName)) {
          return [node];
        }

        let currentElementReplicaNodes = [];
        updatedChildNodes.forEach(child => {
          let tempElementNode = document.createElement(currentNodeName);
          tempElementNode.appendChild(child);
          currentElementReplicaNodes.push(tempElementNode);
        });
        return currentElementReplicaNodes;
      } else {
        // The earliest parent tag that contains texts that should be voiceovered.
        let textContent = '';

        for (let tempChildNode of updatedChildNodes) {
          textContent += this.getReadableTextFromNode(tempChildNode) + ' ';
        }

        const sentencesInEarliestParentTag = textContent.split(sentenceRegex);

        let currentSentenceToMatch = sentencesInEarliestParentTag.shift();

        let spanNodeList = [];
        let spanTagElement = document.createElement('span');
        let nextSentenceOffset = '';

        for (let childNode of updatedChildNodes) {
          let currentText = this.getReadableTextFromNode(childNode);

          let sentence = nextSentenceOffset + currentText;

          // Removing spaces to avoid ambiguity in sentence matching.
          sentence = sentence.split(' ').join('').trim();
          currentSentenceToMatch = currentSentenceToMatch
            ?.split(' ')
            ?.join('')
            ?.trim();

          spanTagElement.appendChild(childNode);

          if (sentence === currentSentenceToMatch) {
            if (spanNodeList.length > 0) {
              let spaceElement = document.createElement('span');
              // eslint-disable-next-line oppia/no-inner-html
              spaceElement.innerHTML = ' ';
              spanNodeList.push(spaceElement);
            }
            spanNodeList.push(spanTagElement);
            spanTagElement = document.createElement('span');
            nextSentenceOffset = '';
            currentSentenceToMatch = sentencesInEarliestParentTag.shift();
          } else {
            nextSentenceOffset += currentText;
          }
        }

        let nodeTemp = node.cloneNode();

        for (let spanNode of spanNodeList) {
          let textInsideSpanTag = '';

          for (let tempChildNode of spanNode.childNodes) {
            textInsideSpanTag += this.getReadableTextFromNode(tempChildNode);
          }

          if (textInsideSpanTag === ' ') {
            nodeTemp.appendChild(spanNode);
            continue;
          }

          let elementId = `highlightBlock${this.index}`;
          spanNode.id = elementId;
          this.index++;

          nodeTemp.appendChild(spanNode);
          this.highlightIdToSentenceText[elementId] = textInsideSpanTag;
        }

        return nodeTemp;
      }
    }
  }

  /**
   * This function wraps each sentence in a span tag to highlight the
   * sentence during voiceover playback.
   */
  wrapSentencesInSpansForHighlighting(htmlString: string): string {
    // This prevents wrapping the sentences in spans multiple times.
    if (this.wrapped) {
      return htmlString;
    }
    this.wrapped = true;
    this.index = 1;
    this.highlightIdToSentenceText = {};
    this.previousHighlightedElementId = undefined;

    let languageCode =
      this.localStorageService.getLastSelectedTranslationLanguageCode() ||
      AppConstants.DEFAULT_LANGUAGE_CODE;

    // Sentences in the lesson content are separated using punctuation marks
    // specific to the language.
    // The following line retrieves the punctuation marks for the current language.
    const punctuationsForCurrentLanguage =
      AppConstants.LANGUAGE_CODE_TO_SENTENCE_ENDING_PUNCTUATION_MARKS[
        languageCode
      ];

    // The regex below is used to split sentences from the lesson content.
    const sentenceRegex = new RegExp(
      `(?<=[${punctuationsForCurrentLanguage}]["”']?)\\s+`,
      'g'
    );

    // Create a temporary DOM element.
    const temporaryDivElement = document.createElement('div');
    // eslint-disable-next-line oppia/no-inner-html
    temporaryDivElement.innerHTML = htmlString;

    const finalDivElement = this.traverseNodeAndWrapSpanTags(
      temporaryDivElement,
      sentenceRegex
    ) as HTMLDivElement;
    // eslint-disable-next-line oppia/no-inner-html
    return finalDivElement.innerHTML;
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
    if (this.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()) {
      this.rteString = this.wrapSentencesInSpansForHighlighting(this.rteString);
    }

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

  updateAutomatedVoiceoversAudioOffsets(): void {
    let automatedVoiceoversAudioOffsetsMsecs =
      this.entityVoiceoversService.getActiveEntityVoiceovers()
        ?.automatedVoiceoversAudioOffsetsMsecs || {};

    if (Object.keys(automatedVoiceoversAudioOffsetsMsecs).length === 0) {
      return;
    }

    this.automaticVoiceoverHighlightService.setAutomatedVoiceoversAudioOffsets(
      automatedVoiceoversAudioOffsetsMsecs
    );
    this.automaticVoiceoverHighlightService.getSentencesToHighlightForTimeRanges();
  }

  ngOnInit(): void {
    // If the below feature flag is not enabld then the sentence highlighting
    // feature will not work.
    if (!this.isAutomaticVoiceoverRegenerationFromExpFeatureEnabled()) {
      return;
    }

    this.updateAutomatedVoiceoversAudioOffsets();

    this.entityVoiceoversService.onLanguageAccentCodeChange.subscribe(() => {
      this.updateAutomatedVoiceoversAudioOffsets();
    });

    // The below lines runs on every 200ms to highlight the sentence being
    // played in the audio player.
    setInterval(() => {
      this.highlightSentenceDuringVoiceoverPlay();
    }, 100);
  }

  isManualVoiceoverAvailableForActiveContent(): boolean {
    const activeContentId = this.getActiveContentId();
    const entityVoiceovers =
      this.entityVoiceoversService.getActiveEntityVoiceovers();
    const manualVoiceover = entityVoiceovers?.getManualVoiceover(
      activeContentId
    ) as Voiceover;

    return !!manualVoiceover && manualVoiceover.needsUpdate === false;
  }

  isInPlayerOrPreviewPage(): boolean {
    return (
      this.pageContextService.isInExplorationPlayerPage() ||
      (this.pageContextService.isInExplorationEditorPage() &&
        this.pageContextService.getEditorTabContext() ===
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW)
    );
  }

  highlightSentenceDuringVoiceoverPlay(): void {
    // Manual voiceover should be prioritized over autogenerated voiceover when
    // available, and it does not require sentence highlighting.
    if (
      this.isInPlayerOrPreviewPage() &&
      this.isManualVoiceoverAvailableForActiveContent()
    ) {
      return;
    }

    // Highlight only when the autogenerated audio is playing.
    if (this.audioPlayerService.isPlaying()) {
      // Sentence highlighting is not required when a manual voiceover is played
      // from the exploration editor page.
      if (
        !this.isInPlayerOrPreviewPage() &&
        !this.voiceoverPlayerService.isAutomaticVoiceoverPlaying
      ) {
        return;
      }

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
        this.previousHighlightedElementId === currentElementIdToHighlight &&
        previousHighlightedElement?.textContent ===
          this.highlightIdToSentenceText[currentElementIdToHighlight]
      ) {
        return;
      }

      let currentElementToHighlight = document.getElementById(
        currentElementIdToHighlight
      );

      // Highlights the current sentence being played in the audio player.
      if (currentElementToHighlight) {
        // Removes the highlight background from the previous sentence.
        if (previousHighlightedElement) {
          previousHighlightedElement.style.backgroundColor = '';
        }
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
      this.previousHighlightedElementId = undefined;
    }
  }

  getActiveContentId(): string {
    // The below if-else block is used to get the active content ID based on the
    // current page.
    if (
      this.pageContextService.isInExplorationPlayerPage() ||
      (this.pageContextService.isInExplorationEditorPage() &&
        this.pageContextService.getEditorTabContext() ===
          ServicesConstants.EXPLORATION_EDITOR_TAB_CONTEXT.PREVIEW)
    ) {
      return this.voiceoverPlayerService.getActiveContentId();
    } else {
      return this.translationTabActiveContentIdService.getActiveContentId();
    }
  }

  isSolutionCollapsedForWorkedexample(): boolean {
    return (
      this.pageContextService.getSubtopicPreviewIsOpen() ||
      this.pageContextService.getPageContext() === 'studyguide'
    );
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
        this.automaticVoiceoverHighlightService.languageCode =
          this.localStorageService.getLastSelectedTranslationLanguageCode();
        this.automaticVoiceoverHighlightService.setHighlightIdToSentenceMap(
          this.highlightIdToSentenceText
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
