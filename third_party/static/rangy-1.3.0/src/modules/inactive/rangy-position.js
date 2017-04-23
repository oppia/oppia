/**
 * Position module for Rangy.
 * Extensions to Range and Selection objects to provide access to pixel positions relative to the viewport or document.
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * https://github.com/timdown/rangy
 *
 * Depends on Rangy core.
 *
 * Copyright %%build:year%%, Tim Down
 * Licensed under the MIT license.
 * Version: %%build:version%%
 * Build date: %%build:date%%
 */
rangy.createModule("Position", ["WrappedSelection"], function(api, module) {
    //var log = log4javascript.getLogger("rangy.position");

    var NUMBER = "number", UNDEF = "undefined";
    var WrappedRange = api.WrappedRange;
    var WrappedTextRange = api.WrappedTextRange;
    var dom = api.dom, util = api.util, DomPosition = dom.DomPosition;
    
    // Feature detection

    //var caretPositionFromPointSupported = (typeof document.caretPositionFromPoint != UNDEF);

    // Since Rangy can deal with multiple documents which could be in different modes, we have to do the checks every
    // time, unless we cache a getScrollPosition function in each document. This would necessarily pollute the
    // document's global namespace, which I'm choosing to view as a greater evil than a slight performance hit.
    function getScrollPosition(win) {
        var x = 0, y = 0;
        if (typeof win.pageXOffset == NUMBER && typeof win.pageYOffset == NUMBER) {
            x = win.pageXOffset;
            y = win.pageYOffset;
        } else {
            var doc = win.document;
            var docEl = doc.documentElement;
            var compatMode = doc.compatMode;
            var scrollEl = (typeof compatMode == "string" && compatMode.indexOf("CSS") >= 0 && docEl)
                ? docEl : dom.getBody(doc);

            if (scrollEl && typeof scrollEl.scrollLeft == NUMBER && typeof scrollEl.scrollTop == NUMBER) {
                try {
                    x = scrollEl.scrollLeft;
                    y = scrollEl.scrollTop;
                } catch (ex) {}
            }
        }
        return { x: x, y: y };
    }

    function getAncestorElement(node, tagName) {
        tagName = tagName.toLowerCase();
        while (node) {
            if (node.nodeType == 1 && node.tagName.toLowerCase() == tagName) {
                return node;
            }
            node = node.parentNode;
        }
        return null;
    }

    function Rect(top, right, bottom, left) {
        this.top = top;
        this.right = right;
        this.bottom = bottom;
        this.left = left;
        this.width = right - left;
        this.height = bottom - top;
    }

    function createRelativeRect(rect, dx, dy) {
        return new Rect(rect.top + dy, rect.right + dx, rect.bottom + dy, rect.left + dx);
    }

    function adjustClientRect(rect, doc) {
        // Older IEs have an issue with a two pixel margin on the body element
        var dx = 0, dy = 0;
        var docEl = doc.documentElement, body = dom.getBody(doc);
        var container = (docEl.clientWidth === 0 && typeof body.clientTop == NUMBER) ? body : docEl;
        var clientLeft = container.clientLeft, clientTop = container.clientTop;
        if (clientLeft) {
            dx = -clientLeft;
        }
        if (clientTop) {
            dy = -clientTop;
        }
        return createRelativeRect(rect, dx, dy);
    }

    function mergeRects(rects) {
        var tops = [], bottoms = [], lefts = [], rights = [];
        for (var i = 0, len = rects.length, rect; i < len; ++i) {
            rect = rects[i];
            if (rect) {
                tops.push(rect.top);
                bottoms.push(rect.bottom);
                lefts.push(rect.left);
                rights.push(rect.right);
            }
        }
        return new Rect(
            Math.min.apply(Math, tops),
            Math.max.apply(Math, rights),
            Math.max.apply(Math, bottoms),
            Math.min.apply(Math, lefts)
        );
    }
    
    function getTextRangePosition(doc, x, y) {
        var textRange = dom.getBody(doc).createTextRange();
        textRange.moveToPoint(x, y);
        var range = new api.WrappedTextRange(textRange);
        return new DomPosition(range.startContainer, range.startOffset);
    }

    function caretPositionFromPoint(doc, x, y) {
        var pos = doc.caretPositionFromPoint(x, y);
        return new DomPosition(pos.offsetNode, pos.offset);
    }

    function caretRangeFromPoint(doc, x, y) {
        var range = doc.caretRangeFromPoint(x, y);
        return new DomPosition(range.startContainer, range.startOffset);
    }

    function getLastRangeRect(range) {
        var rects = (range.nativeRange || range).getClientRects();
        return (rects.length > 0) ? rects[rects.length - 1] : null;
    }

    function pointIsInOrAboveRect(x, y, rect) {
        console.log("pointIsInOrAboveRect", x, y, Math.floor(rect.top), Math.floor(rect.right), Math.floor(rect.bottom), Math.floor(rect.left))
        return y < rect.bottom && x >= rect.left && x <= rect.right;
    }

    function positionFromPoint(doc, x, y, favourPrecedingPosition) {
        var el = doc.elementFromPoint(x, y);
        
        console.log("elementFromPoint is ", el);

        var range = api.createRange(doc);
        range.selectNodeContents(el);
        range.collapse(true);

        var node = el.firstChild, offset, rect, textLen;

        if (!node) {
            node = el.parentNode;
            offset = dom.getNodeIndex(el);
            if (!favourPrecedingPosition) {
                ++offset;
            }
        } else {
            // Search through the text node children of el
            main: while (node) {
                console.log(node);
                if (node.nodeType == 3) {
                    // Go through the text node character by character
                    for (offset = 0, textLen = node.length; offset <= textLen; ++offset) {
                        range.setEnd(node, offset);
                        rect = getLastRangeRect(range);
                        if (rect && pointIsInOrAboveRect(x, y, rect)) {
                            // We've gone past the point. Now we check which side (left or right) of the character the point is nearer to
                            if (rect.right - x > x - rect.left) {
                                --offset;
                            }
                            break main;
                        }
                    }
                } else {
                    // Handle elements
                    range.setEndAfter(node);
                    rect = getLastRangeRect(range);
                    if (rect && pointIsInOrAboveRect(x, y, rect)) {
                        offset = dom.getNodeIndex(node);
                        node = el.parentNode;
                        if (!favourPrecedingPosition) {
                            ++offset;
                        }
                        break;
                    }
                }

                node = node.nextSibling;
            }
            if (!node) {
                node = el;
                offset = el.childNodes.length;
            }
        }

        return new DomPosition(node, offset);
    }

    function createCaretPositionFromPointGetter(doc) {
        if (api.features.implementsTextRange) {
            return getTextRangePosition;
        } else if (typeof doc.caretPositionFromPoint != UNDEF) {
            return caretPositionFromPoint;
        } else if (typeof doc.caretRangeFromPoint != UNDEF) {
            return caretRangeFromPoint;
        } else if (typeof doc.elementFromPoint != UNDEF && rangeSupportsGetClientRects) {
            return positionFromPoint;
        } else {
            throw module.createError("createCaretPositionFromPointGetter(): Browser does not provide a recognised method to create a selection from pixel coordinates");
        }
    }
    
    function createRangeFromPoints(startX, startY, endX, endY, doc) {
        doc = dom.getContentDocument(doc, module, "createRangeFromPoints");
        var positionFinder = createCaretPositionFromPointGetter(doc);
        var startPos = positionFinder(doc, startX, startY, false);
        var endPos = positionFinder(doc, endX, endY, true);
        console.log(startPos.node, startPos.offset, endPos.node, endPos.offset);
        var range = api.createRange(doc);
        range.setStartAndEnd(startPos.node, startPos.offset, endPos.node, endPos.offset);
        return range;
    }

    function moveSelectionToPoints(anchorX, anchorY, focusX, focusY, doc) {
        var startX, startY, endX, endY;

        // Detect backward selection for coordinates and flip start and end coordinates if necessary
        var backward = focusY < anchorY || (anchorY == focusY && focusX < anchorX);

        if (backward) {
            startX = focusX;
            startY = focusY;
            endX = anchorX;
            endY = anchorY;
        } else {
            startX = anchorX;
            startY = anchorY;
            endX = focusX;
            endY = focusY;
        }

        var sel = rangy.getSelection(doc);
        var range = createRangeFromPoints(startX, startY, endX, endY, doc);
        sel.setSingleRange(range);
        return sel;
    }
    
    // Test that <span> elements support getBoundingClientRect
    var span = document.createElement("span");
    var elementSupportsGetBoundingClientRect = util.isHostMethod(span, "getBoundingClientRect");
    span = null;

    // Test for getBoundingClientRect support in Range
    var rangeSupportsGetClientRects = false, rangeSupportsGetBoundingClientRect = false;
    if (api.features.implementsDomRange) {
        var testRange = api.createNativeRange();
        rangeSupportsGetClientRects = util.isHostMethod(testRange, "getClientRects");
        rangeSupportsGetBoundingClientRect = util.isHostMethod(testRange, "getBoundingClientRect");
    }

    util.extend(api.features, {
        rangeSupportsGetBoundingClientRect: rangeSupportsGetBoundingClientRect,
        rangeSupportsGetClientRects: rangeSupportsGetClientRects,
        elementSupportsGetBoundingClientRect: elementSupportsGetBoundingClientRect
    });

    var createClientBoundaryPosGetter = function(isStart) {
        return function() {
            var boundaryRange = this.cloneRange();
            boundaryRange.collapse(isStart);
            var rect = boundaryRange.getBoundingClientRect();
            return {
                x: rect[isStart ? "left" : "right"],
                y: rect[isStart ? "top" : "bottom"]
            };
        };
    };

    var rangeProto = api.rangePrototype;

    if (api.features.implementsTextRange && elementSupportsGetBoundingClientRect) {
        rangeProto.getBoundingClientRect = function() {
            // We need a TextRange
            var textRange = WrappedTextRange.rangeToTextRange(this);

            // Work around table problems (table cell bounding rects seem not to count if TextRange spans cells)
            var cells = this.getNodes([1], function(el) {
                return /^t[dh]$/i.test(el.tagName);
            });

            // Merge rects for each cell selected by the range into overall rect
            var rect, rects = [];
            if (cells.length > 0) {
                var lastTable = getAncestorElement(this.startContainer, "table");

                for (var i = 0, cell, tempTextRange, table, subRange, subRect; cell = cells[i]; ++i) {
                    // Handle non-table sections of the range
                    table = getAncestorElement(cell, "table");
                    if (!lastTable || table != lastTable) {
                        // There is a section of the range prior to the current table, or lying between tables.
                        // Merge in its rect
                        subRange = this.cloneRange();
                        if (lastTable) {
                            subRange.setStartAfter(lastTable);
                        }
                        subRange.setEndBefore(table);
                        rects.push(WrappedTextRange.rangeToTextRange(subRange).getBoundingClientRect());
                    }

                    if (this.containsNode(cell)) {
                        rects.push(cell.getBoundingClientRect());
                    } else {
                        tempTextRange = textRange.duplicate();
                        tempTextRange.moveToElementText(cell);
                        if (tempTextRange.compareEndPoints("StartToStart", textRange) == -1) {
                            tempTextRange.setEndPoint("StartToStart", textRange);
                        } else if (tempTextRange.compareEndPoints("EndToEnd", textRange) == 1) {
                            tempTextRange.setEndPoint("EndToEnd", textRange);
                        }
                        rects.push(tempTextRange.getBoundingClientRect());
                    }
                    lastTable = table;
                }

                // Merge in the rect for any content lying after the final table
                var endTable = getAncestorElement(this.endContainer, "table");
                if (!endTable && lastTable) {
                    subRange = this.cloneRange();
                    subRange.setStartAfter(lastTable);
                    rects.push(WrappedTextRange.rangeToTextRange(subRange).getBoundingClientRect());
                }
                rect = mergeRects(rects);
            } else {
                rect = textRange.getBoundingClientRect();
            }

            return adjustClientRect(rect, dom.getDocument(this.startContainer));
        };
    } else if (api.features.implementsDomRange) {
        var createWrappedRange = function(range) {
            return (range instanceof WrappedRange) ? range : new WrappedRange(range);
        };

        if (rangeSupportsGetBoundingClientRect) {
            rangeProto.getBoundingClientRect = function() {
                var nativeRange = createWrappedRange(this).nativeRange;
                // Test for WebKit getBoundingClientRect bug (https://bugs.webkit.org/show_bug.cgi?id=65324)
                var rect = nativeRange.getBoundingClientRect() || nativeRange.getClientRects()[0];
                return adjustClientRect(rect, dom.getDocument(this.startContainer));
            };

            if (rangeSupportsGetClientRects) {
                var getElementRectsForPosition = function(node, offset) {
                    var children = node.childNodes;
                    //if (offset < children.length)
                };

                createClientBoundaryPosGetter = function(isStart) {
                    return function() {
                        var rect, nativeRange = createWrappedRange(this).nativeRange;
                        var rects = nativeRange.getClientRects();

                        if (rects.length == 0 && elementSupportsGetBoundingClientRect) {
                            if (isStart) {


                            }

                            console.log(nativeRange, nativeRange.getClientRects(), nativeRange.getBoundingClientRect());
                            if (this.collapsed
                                    && this.startContainer.nodeType == 1
                                    && this.startOffset < this.startContainer.childNodes.length) {
                                var n = this.startContainer.childNodes[this.startOffset];
                                if (n.getClientRects) {
                                    console.log(n, n.getClientRects(), this.startContainer.getClientRects())
                                }

                            }
                        }

                        if (rects.length > 0) {
                            if (isStart) {
                                rect = rects[0];
                                return { x: rect.left, y: rect.top };
                            } else {
                                rect = rects[rects.length - 1];
                                return { x: rect.right, y: rect.bottom };
                            }
                        } else {
                            throw module.createError("Cannot get position for range " + this.inspect());
                        }
                    };
                }
            }
        } else {
            var getElementBoundingClientRect = elementSupportsGetBoundingClientRect ?
                function(el) {
                    return adjustClientRect(el.getBoundingClientRect(), dom.getDocument(el));
                } :

                // This implementation is very naive. There are many browser quirks that make it extremely
                // difficult to get accurate element coordinates in all situations
                function(el) {
                    var x = 0, y = 0, offsetEl = el, width = el.offsetWidth, height = el.offsetHeight;
                    while (offsetEl) {
                        x += offsetEl.offsetLeft;
                        y += offsetEl.offsetTop;
                        offsetEl = offsetEl.offsetParent;
                    }

                    return adjustClientRect(new Rect(y, x + width, y + height, x), dom.getDocument(el));
                };

            var getRectFromBoundaries = function(range) {
                var rect;
                range.splitBoundaries();
                var span = document.createElement("span");

                if (range.collapsed) {
                    range.insertNode(span);
                    rect = getElementBoundingClientRect(span);
                    span.parentNode.removeChild(span);
                } else {
                    // TODO: This isn't right. I'm not sure it can be made right sensibly. Consider what to do.
                    // This doesn't consider all the line boxes it needs to consider.
                    var workingRange = range.cloneRange();

                    // Get the start rectangle
                    workingRange.collapse(true);
                    workingRange.insertNode(span);
                    var startRect = getElementBoundingClientRect(span);
                    span.parentNode.removeChild(span);

                    // Get the end rectangle
                    workingRange.collapseToPoint(range.endContainer, range.endOffset);
                    workingRange.insertNode(span);
                    var endRect = getElementBoundingClientRect(span);
                    span.parentNode.removeChild(span);

                    // Merge the start and end rects
                    var rects = [startRect, endRect];

                    // Merge in rectangles for all elements in the range
                    var elements = range.getNodes([1], function(el) {
                        return range.containsNode(el);
                    });

                    for (var i = 0, len = elements.length; i < len; ++i) {
                        rects.push(getElementBoundingClientRect(elements[i]));
                    }
                    rect = mergeRects(rects)
                }

                // Clean up
                range.normalizeBoundaries();
                return rect;
            };

            rangeProto.getBoundingClientRect = function(range) {
                return getRectFromBoundaries(createWrappedRange(range));
            };
        }

        function createDocumentBoundaryPosGetter(isStart) {
            return function() {
                var pos = this["get" + (isStart ? "Start" : "End") + "ClientPos"]();
                var scrollPos = getScrollPosition( dom.getWindow(this.startContainer) );
                return { x: pos.x + scrollPos.x, y: pos.y + scrollPos.y };
            };
        }
    }

    util.extend(rangeProto, {
        getBoundingDocumentRect: function() {
            var scrollPos = getScrollPosition( dom.getWindow(this.startContainer) );
            return createRelativeRect(this.getBoundingClientRect(), scrollPos.x, scrollPos.y);
        },

        getStartClientPos: createClientBoundaryPosGetter(true),
        getEndClientPos: createClientBoundaryPosGetter(false),

        getStartDocumentPos: createDocumentBoundaryPosGetter(true),
        getEndDocumentPos: createDocumentBoundaryPosGetter(false)
    });

    // Add Selection methods
    function compareRanges(r1, r2) {
        return r1.compareBoundaryPoints(r2.START_TO_START, r2);
    }

    function createSelectionRectGetter(isDocument) {
        return function() {
            var rangeMethodName = "getBounding" + (isDocument ? "Document" : "Client") + "Rect";
            var rects = [];
            for (var i = 0, rect = null, rangeRect; i < this.rangeCount; ++i) {
                rects.push(this.getRangeAt(i)[rangeMethodName]());
            }
            return mergeRects(rects);
        };
    }

    function createSelectionBoundaryPosGetter(isStart, isDocument) {
        return function() {
            if (this.rangeCount == 0) {
                return null;
            }

            var posType = isDocument ? "Document" : "Client";

            var ranges = this.getAllRanges();
            if (ranges.length > 1) {
                // Order the ranges by position within the DOM
                ranges.sort(compareRanges);
            }

            return isStart ?
                ranges[0]["getStart" + posType + "Pos"]() :
                ranges[ranges.length - 1]["getEnd" + posType + "Pos"]();
        };
    }

    util.extend(api.selectionPrototype, {
        getBoundingClientRect: createSelectionRectGetter(false),
        getBoundingDocumentRect: createSelectionRectGetter(true),

        getStartClientPos: createSelectionBoundaryPosGetter(true, false),
        getEndClientPos: createSelectionBoundaryPosGetter(false, false),

        getStartDocumentPos: createSelectionBoundaryPosGetter(true, true),
        getEndDocumentPos: createSelectionBoundaryPosGetter(false, true)
    });
    
    api.positionFromPoint = function(x, y, doc) {
        doc = dom.getContentDocument(doc, module, "positionFromPoint");
        return createCaretPositionFromPointGetter(doc)(doc, x, y);
    };
    
    api.createRangeFromPoints = createRangeFromPoints;
    api.moveSelectionToPoints = moveSelectionToPoints;
});
