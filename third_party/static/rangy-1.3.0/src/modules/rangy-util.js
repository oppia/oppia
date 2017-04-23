/**
 * Utilities module for Rangy.
 * A collection of common selection and range-related tasks, using Rangy.
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
/* build:modularizeWithRangyDependency */
rangy.createModule("Util", ["WrappedSelection"], function(api, module) {
    var rangeProto = api.rangePrototype;
    var selProto = api.selectionPrototype;

    selProto.pasteText = function(text) {
        this.deleteFromDocument();
        var range = this.getRangeAt(0);
        var textNode = range.getDocument().createTextNode(text);
        range.insertNode(textNode);
        this.setSingleRange(range);
    };

    rangeProto.pasteText = function(text) {
        this.deleteContents();
        var textNode = this.getDocument().createTextNode(text);
        this.insertNode(textNode);
    };

    selProto.pasteHtml = function(html) {
        this.deleteFromDocument();
        var range = this.getRangeAt(0);
        var frag = this.createContextualFragment(html);
        var lastNode = frag.lastChild;
        range.insertNode(frag);
        if (lastNode) {
            range.setStartAfter(lastNode)
        }
        this.setSingleRange(range);
    };

    rangeProto.pasteHtml = function(html) {
        this.deleteContents();
        var frag = this.createContextualFragment(html);
        this.insertNode(frag);
    };

    selProto.selectNodeContents = function(node) {
        var range = api.createRange(this.win);
        range.selectNodeContents(node);
        this.setSingleRange(range);
    };

    api.createRangeFromNode = function(node) {
        var range = api.createRange(node);
        range.selectNode(node);
        return range;
    };

    api.createRangeFromNodeContents = function(node) {
        var range = api.createRange(node);
        range.selectNodeContents(node);
        return range;
    };

    api.selectNodeContents = function(node) {
        api.getSelection().selectNodeContents(node);
    };

    rangeProto.selectSelectedTextElements = (function() {
        function isInlineElement(node) {
            return node.nodeType == 1 && api.dom.getComputedStyleProperty(node, "display") == "inline";
        }

        function getOutermostNodeContainingText(range, node) {
            var outerNode = null;
            var nodeRange = range.cloneRange();
            nodeRange.selectNode(node);
            if (nodeRange.toString() !== "") {
                while ( (node = node.parentNode) && isInlineElement(node) && range.containsNodeText(node) ) {
                    outerNode = node;
                }
            }
            return outerNode;
        }

        return function() {
            var startNode = getOutermostNodeContainingText(this, this.startContainer);
            if (startNode) {
                this.setStartBefore(startNode);
            }

            var endNode = getOutermostNodeContainingText(this, this.endContainer);
            if (endNode) {
                this.setEndAfter(endNode);
            }
        };
    })();

    // TODO: simple selection save/restore
});
/* build:modularizeEnd */