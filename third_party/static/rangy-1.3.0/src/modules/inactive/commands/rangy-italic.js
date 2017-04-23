/**
 * Selection save and restore module for Rangy.
 * Italic command
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
rangy.createModule("ItalicCommand", function(api, module) {
    api.requireModules( ["Commands"] );

    var dom = api.dom, commandUtil = api.Command.util;
    var log = log4javascript.getLogger("rangy.ItalicCommand");

    function ItalicCommand() {

    }

    api.Command.create(ItalicCommand, {
        relevantCssProperty: "fontStyle",

        defaultOptions: {
            ignoreWhiteSpace: true
        },

        getSpecifiedValue: function(element) {
            return element.style.fontStyle || (/^(em|i)$/i.test(element.tagName) ? "italic" : null);
        },

        createNonCssElement: function(node, value) {
            return (value == "italic") ? dom.getDocument(node).createElement("i") : null;
        },

        getRangeValue: function(range, context) {
            var textNodes = commandUtil.getEffectiveTextNodes(range, context), i = textNodes.length, value;
            log.info("getRangeValue on " + range.inspect() + ", text nodes: " + textNodes);
            if (textNodes.length == 0) {
                return commandUtil.getEffectiveValue(range.commonAncestorContainer, context) == "italic";
            } else {
                while (i--) {
                    value = commandUtil.getEffectiveValue(textNodes[i], context);
                    log.info("getRangeValue value " + value);
                    if (value != "italic") {
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
            return this.getRangeValue(range, context) ? "normal" : "italic";
        },

        getNewSelectionValue: function(sel, context) {
            return this.getSelectionValue(sel, context) ? "normal" : "italic";
        },

        applyValueToRange: function(range, context) {
            var decomposed = commandUtil.decomposeRange(range, context.rangesToPreserve);

            for (var i = 0, len = decomposed.length; i < len; ++i) {
                commandUtil.setNodeValue(decomposed[i], context);
            }
        }
    });

    api.registerCommand("italic", new ItalicCommand());

});
