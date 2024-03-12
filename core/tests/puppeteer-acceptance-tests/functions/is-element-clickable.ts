// Copyright 2024 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Utility function to check if an element is clickable.
 */

export default function isElementClickable(element: Element): boolean {
  const getOverlappingElement = (
    element: Element,
    context: ShadowRoot | Document = document
  ): Element | null => {
    const elementDimensions = element.getBoundingClientRect();
    const x = elementDimensions.left + element.clientWidth / 2;
    const y = elementDimensions.top + element.clientHeight / 2;

    return context.elementFromPoint(x, y);
  };

  const getOverlappingRect = (
    element: Element,
    context: ShadowRoot | Document = document
  ): Element | null => {
    const rects = element.getClientRects();
    const rect = rects[0];
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    return context.elementFromPoint(x, y);
  };

  const getOverlappingElements = (
    element: Element,
    context: ShadowRoot | Document = document
  ): Element[] => {
    const overlappingElement = getOverlappingElement(element, context);
    const overlappingRect = getOverlappingRect(element, context);
    const overlappingElements: Element[] = [];
    if (overlappingElement) {
      overlappingElements.push(overlappingElement);
    }
    if (overlappingRect) {
      overlappingElements.push(overlappingRect);
    }
    return overlappingElements;
  };

  const isOverlappingElementMatch = (
    element: Element,
    elementsFromPoint: Element[]
  ): boolean => {
    if (
      elementsFromPoint.some(
        elementFromPoint =>
          elementFromPoint === element || element.contains(elementFromPoint)
      )
    ) {
      return true;
    }

    let elementsWithShadowRoot = [...new Set(elementsFromPoint)];
    elementsWithShadowRoot = elementsWithShadowRoot.filter(
      e => e && e.shadowRoot && e.shadowRoot.elementFromPoint
    );

    let shadowElementsFromPoint: Element[] = [];
    for (const shadowElement of elementsWithShadowRoot) {
      if (shadowElement.shadowRoot) {
        shadowElementsFromPoint.push(
          ...getOverlappingElements(element, shadowElement.shadowRoot)
        );
      }
    }
    shadowElementsFromPoint = [...new Set(shadowElementsFromPoint)];
    shadowElementsFromPoint = shadowElementsFromPoint.filter(
      e => !elementsFromPoint.includes(e)
    );

    if (shadowElementsFromPoint.length === 0) {
      return false;
    }

    return isOverlappingElementMatch(element, shadowElementsFromPoint);
  };

  const isElementInViewport = (element: Element): boolean => {
    const elementDimensions = element.getBoundingClientRect();

    const windowHeight =
      window.innerHeight || document.documentElement.clientHeight;
    const windowWidth =
      window.innerWidth || document.documentElement.clientWidth;

    const verticalInView =
      elementDimensions.top <= windowHeight &&
      elementDimensions.top + elementDimensions.height > 0;
    const horizontalInView =
      elementDimensions.left <= windowWidth &&
      elementDimensions.left + elementDimensions.width > 0;

    return verticalInView && horizontalInView;
  };

  const isClickable = (element: Element): boolean => {
    return (
      (element as HTMLButtonElement).disabled !== true &&
      isElementInViewport(element) &&
      isOverlappingElementMatch(element, getOverlappingElements(element))
    );
  };

  if (!isClickable(element)) {
    element.scrollIntoView({block: 'nearest', inline: 'nearest'});

    return isClickable(element);
  }

  return true;
}
