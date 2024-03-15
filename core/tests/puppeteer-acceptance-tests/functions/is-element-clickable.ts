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
  /**
   * This function gets the the overlapping element if any by checking the
   * element that is present in the center of the target element's position.
   */
  const getOverlappingElement = (
    element: Element,
    parent: ShadowRoot | Document = document
  ): Element | null => {
    const elementDimensions = element.getBoundingClientRect();
    const x = elementDimensions.left + element.clientWidth / 2;
    const y = elementDimensions.top + element.clientHeight / 2;

    return parent.elementFromPoint(x, y);
  };

  /**
   * This function also gets the overlapping element if any at the center
   * of the given element. However this uses the client rect, which
   * is applicable in special cases where the text is multiline. This
   * applies to special cases like the span.
   */
  const getOverlappingRect = (
    element: Element,
    parent: ShadowRoot | Document = document
  ): Element | null => {
    const rects = element.getClientRects();
    const rect = rects[0];
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    return parent.elementFromPoint(x, y);
  };

  /**
   * This function combines the overlapping element and overlapping rect
   * to get the element or elements that are overlapping the given
   * element.
   */
  const getOverlappingElements = (
    element: Element,
    parent: ShadowRoot | Document = document
  ): Element[] => {
    const overlappingElement = getOverlappingElement(element, parent);
    const overlappingRect = getOverlappingRect(element, parent);
    const overlappingElements: Element[] = [];
    if (overlappingElement) {
      overlappingElements.push(overlappingElement);
    }
    if (overlappingRect) {
      overlappingElements.push(overlappingRect);
    }
    return overlappingElements;
  };

  /**
   * This function is recursive and checks if the target element is the only
   * overlapping element meaning there are no other elements blocking
   * the target element.
   *
   * @param {Element} targetElement - The element to compare with the other
   * overlapping elements.
   * @param {Element[]} overlappingElements - The overlapping elements to compare
   * against the target element.
   */
  const isOverlappingElementsMatching = (
    targetElement: Element,
    overlappingElements: Element[]
  ): boolean => {
    if (
      overlappingElements.some(
        el => el === targetElement || targetElement.contains(el)
      )
    ) {
      return true;
    }

    let elementsWithShadow = [...new Set(overlappingElements)];
    elementsWithShadow = elementsWithShadow.filter(
      el => el && el.shadowRoot && el.shadowRoot.elementFromPoint
    );

    let shadowElements: Element[] = [];
    for (const shadowEl of elementsWithShadow) {
      if (shadowEl.shadowRoot) {
        shadowElements.push(
          ...getOverlappingElements(targetElement, shadowEl.shadowRoot)
        );
      }
    }
    shadowElements = [...new Set(shadowElements)];
    shadowElements = shadowElements.filter(
      el => !overlappingElements.includes(el)
    );

    if (shadowElements.length === 0) {
      return false;
    }

    return isOverlappingElementsMatching(targetElement, shadowElements);
  };

  /**
   * This function checks if the given element is in the viewport.
   */
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

  /**
   * This function checks if the element is clickable, by checking if it is
   * in the viewport and not blocked by any other element. This function also
   * checks if the element is disabled, applicable for elements like buttons
   * and form elements.
   */
  const isClickable = (element: Element): boolean => {
    return (
      (element as HTMLFormElement).disabled !== true &&
      isElementInViewport(element) &&
      isOverlappingElementsMatching(element, getOverlappingElements(element))
    );
  };

  // Here we check if the element is clickable and if not, we scroll it into view
  // and check again. We do this twice to ensure that the element is centered and
  // not blocked.
  if (!isClickable(element)) {
    element.scrollIntoView({block: 'center', inline: 'center'});

    if (!isClickable(element)) {
      element.scrollIntoView({block: 'center', inline: 'center'});

      return isClickable(element);
    }
  }

  return true;
}
