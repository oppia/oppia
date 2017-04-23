/**
 * Selection save and restore module for Rangy.
 * Bold command
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
rangy.createModule("BoldCommand", function(api, module) {
    api.requireModules( ["Commands"] );

    var dom = api.dom, commandUtil = api.Command.util;
    var log = log4javascript.getLogger("rangy.BoldCommand");

    function BoldCommand() {

    }

    api.Command.create(BoldCommand, {
        relevantCssProperty: "fontWeight",

        defaultOptions: {
            tagName: "b",
            ignoreWhiteSpace: true
        },

        getSpecifiedValue: function(element) {
            return element.style.fontWeight || (/^(strong|b)$/i.test(element.tagName) ? "bold" : null);
        },

        valuesEqual: function(val1, val2) {
            val1 = ("" + val1).toLowerCase();
            val2 = ("" + val2).toLowerCase();
            return val1 == val2
                || (val1 == "bold" && val2 == "700")
                || (val2 == "bold" && val1 == "700")
                || (val1 == "normal" && val2 == "400")
                || (val2 == "normal" && val1 == "400");
        },

        createNonCssElement: function(node, value, context) {
            if (value == "bold" || value == "700") {
                return dom.getDocument(node).createElement(context.options.tagName);
            }

            return null;
        },

        isBoldCssValue: function(value) {
            return /^(bold|700|800|900)$/.test(value);
        },

        getRangeValue: function(range, context) {
            var textNodes = commandUtil.getEffectiveTextNodes(range, context), i = textNodes.length, value;
            log.info("getRangeValue on " + range.inspect() + ", text nodes: " + textNodes);

            if (textNodes.length == 0) {
                return this.isBoldCssValue(commandUtil.getEffectiveValue(range.commonAncestorContainer, context))
            } else {
                while (i--) {
                    value = commandUtil.getEffectiveValue(textNodes[i], context);
                    log.info("getRangeValue value " + value);
                    if (!this.isBoldCssValue(value)) {
                        log.info("getRangeValue returning false");
                        return false;
                    }
                }
                return true;
            }
        },

        getSelectionValue: function(sel, context) {
            var selRanges = sel.getAllRanges();
            for (var i = 0, len = selRanges.length; i < len; ++i) {
                if (!this.getRangeValue(selRanges[i], context)) {
                    return false;
                }
            }
            return len > 0;
        },

        getNewRangeValue: function(range, context) {
            return this.getRangeValue(range, context) ? "normal" : "bold";
        },

        getNewSelectionValue: function(sel, context) {
            return this.getSelectionValue(sel, context) ? "normal" : "bold";
        },

        applyValueToRange: function(range, context) {
            var decomposed = commandUtil.decomposeRange(range, context.rangesToPreserve);

            log.info("applyValueToRange " + range.inspect())

            for (var i = 0, len = decomposed.length; i < len; ++i) {
                log.info("Setting node value on: " + dom.inspectNode(decomposed[i]))
                commandUtil.setNodeValue(decomposed[i], context);
            }
        }
    });

    api.registerCommand("bold", new BoldCommand());

});
