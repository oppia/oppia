/**
 * Events module for Rangy.
 * Extensions to Range and Selection objects that dispatch mouse and touch events for ranges and selections
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
rangy.createModule("Events", ["Position"], function(api, module) {
    var log = log4javascript.getLogger("rangy.events");
    var DomPosition = api.dom.DomPosition;
    
    var documentEventStores = [];
    
    function getEventStore(range) {
        var doc = api.DomRange.getRangeDocument(range);
        var i = documentEventStores.length, store;
        while (i--) {
            store = documentEventStores[i];
            if (store.doc === doc) {
                return store;
            }
        }
        
        store = new DocumentEventStore(doc);
        documentEventStores.push(store);
        return store;
    }
    
    function getPositionFromEvent(doc, evt) {
        return api.util.areHostProperties(evt, ["rangeOffset", "rangeParent"]) ?
            new DomPosition(evt.rangeParent, evt.rangeOffset) :
            api.positionFromPoint(evt.clientX, evt.clientY, doc);
    }
    
    function DocumentEventStore(doc) {
        this.doc = doc;
        this.listenersByType = {};
    }

    DocumentEventStore.prototype = {
        createDomListener: function(eventType, rangeListeners) {
            var that = this;

            var listener = function(evt) {
                var pos = getPositionFromEvent(that.doc, evt);
                //console.log(evt.type, pos);
                for (var i = 0, rangeListener; rangeListener = rangeListeners[i++]; ) {
                    if (rangeListener.range.isPointInRange(pos.node, pos.offset)) {
                        rangeListener.listener.call(rangeListener.range, {
                            originalEvent: evt,
                            type: evt.type,
                            caretPosition: {
                                offsetNode: pos.node,
                                offset: pos.offset
                            }
                        });
                    }
                }
            };

            api.util.addListener(that.doc, eventType, listener);
            
            return listener;
        },
        
        addListener: function(range, eventType, listener) {
            var listenersByType = this.listenersByType;
            if (!listenersByType.hasOwnProperty(eventType)) {
                var rangeListeners = [];
                listenersByType[eventType] = {
                    domListener: this.createDomListener(eventType, rangeListeners),
                    rangeListeners: rangeListeners
                };
            }
            // Start listening to events of this type
            var listenersForType = listenersByType[eventType];
            listenersForType.rangeListeners.push( { range: range, listener: listener} );
        },
        
        removeListener: function(range, eventType, listener) {
            var listenersByType = this.listenersByType;
            if (listenersByType.hasOwnProperty(eventType)) {
                var rangeListenersForType = listenersByType[eventType].rangeListeners;
                for (var i = 0, len = rangeListenersForType.length; i < len; ++i) {
                    if (rangeListenersForType[i].range === range && rangeListenersForType[i].listener === listener) {
                        rangeListenersForType.splice(i, 1);
                        console.log("REMOVED");
                        break;
                    }
                }
            }
        },

        removeRangeListeners: function(range) {
            var listenersByType = this.listenersByType, rangeListenersForType, i, len;
            for (var eventType in listenersByType) {
                if (listenersByType.hasOwnProperty(eventType)) {
                    rangeListenersForType = listenersByType[eventType].rangeListeners;
                    for (i = 0, len = rangeListenersForType.length; i < len; ++i) {
                        if (rangeListenersForType[i].range === range) {
                            rangeListenersForType.splice(i, 1);
                            --i;
                            console.log("REMOVED");
                        }
                    }
                }
            }
        },
        
        cleanDetachedRanges: function() {
            // TODO: Implement this
        }
    };

    api.rangePrototype.addListener = function(eventType, listener) {
        getEventStore(this).addListener(this, eventType, listener);
    };

    api.rangePrototype.removeListener = function(eventType, listener) {
        getEventStore(this).removeListener(this, eventType, listener);
    };

    api.rangePrototype.removeAllListeners = function() {
        getEventStore(this).removeRangeListeners(this);
    };
});
