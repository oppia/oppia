/// http://cwilso.github.com/WebMIDIAPIShim

// Initialize the MIDI library.
(function (global, exports, perf) {
    'use strict';
    var midiIO,
    debug = false;
    if (debug) {
        window.console.warn('Debuggin enabled');
    }

//init: create plugin
    if (!window.navigator.requestMIDIAccess) {
      window.navigator.requestMIDIAccess = _requestMIDIAccess;
      if (!window.navigator.getMIDIAccess)
        window.navigator.getMIDIAccess = _getMIDIAccess;
    }

  function _JazzInstance() {
    this.inputInUse = false;
    this.outputInUse = false;

    // load the Jazz plugin
    var o1 = document.createElement("object");
    o1.style.cssText = "top: -500px; position: absolute;";
    o1.id = "_Jazz" + Math.random() + "ie";
    o1.classid = "CLSID:1ACE1618-1C7D-4561-AEE1-34842AA85E90";

    this.activeX = o1;

    var o2 = document.createElement("object");
    o2.id = "_Jazz" + Math.random; 
    o2.type="audio/x-jazz";
    o1.appendChild(o2);

    this.objRef = o2;

    var e = document.createElement("p");
    e.appendChild(document.createTextNode("This page requires the "));

    var a = document.createElement("a");
    a.appendChild(document.createTextNode("Jazz plugin"));
    a.href = "http://jazz-soft.net/";

    e.appendChild(a);
    e.appendChild(document.createTextNode("."));
    o2.appendChild(e);

    var insertionPoint = document.getElementById("MIDIPlugin");
    if (!insertionPoint)
        insertionPoint = document.body;
    insertionPoint.appendChild(o1);

    if (this.objRef.isJazz)
      this._Jazz = this.objRef;
    else if (this.activeX.isJazz)
      this._Jazz = this.activeX;
    else
      this._Jazz = null;
    if (this._Jazz) {
      this._Jazz._jazzTimeZero = this._Jazz.Time();
      this._Jazz._perfTimeZero = window.performance.now();
    }
  }

  function _requestMIDIAccess( successCallback, errorCallback ) {
      new MIDIAccess( successCallback, errorCallback );
  }

  function _getMIDIAccess( successCallback, errorCallback ) {
      var message = "getMIDIAccess has been renamed to requestMIDIAccess.  Please update your code.";
      
      if (console.warn)
        console.warn( message );
      else
        console.log( message );
      new MIDIAccess( successCallback, errorCallback );
  }

  // API Methods

  function MIDIAccess( successCallback, errorCallback ) {
      this._jazzInstances = new Array();
      this._jazzInstances.push( new _JazzInstance() );

      if (this._jazzInstances[0]._Jazz) {
        this._Jazz = this._jazzInstances[0]._Jazz;
        this._successCallback = successCallback;
        window.setTimeout( _onReady.bind(this), 3 );
      } else {
          if (errorCallback)
            errorCallback( { code: 1 } );
      }
  }

  function _onReady() {
      if (this._successCallback)
          this._successCallback( this );
  }

  MIDIAccess.prototype.getInputs = function(  ) {
      if (!this._Jazz)
          return null;
      var list=this._Jazz.MidiInList();
      var inputs = new Array( list.length );
    
      for ( var i=0; i<list.length; i++ ) {
          inputs[i] = new MIDIPort( this, list[i], i, "input" );
      }
      return inputs;
  }

  MIDIAccess.prototype.getOutputs = function(  ) {
      if (!this._Jazz)
          return null;
      var list=this._Jazz.MidiOutList();
      var outputs = new Array( list.length );
    
      for ( var i=0; i<list.length; i++ ) {
          outputs[i] = new MIDIPort( this, list[i], i, "output" );
      }
      return outputs;
  }

  // TODO: remove these versions
  MIDIAccess.prototype.enumerateInputs = function(  ) {
    var message = "MIDIAccess.enumerateInputs has been renamed to MIDIAccess.getInputs.  Please update your code.";
    
    if (console.warn)
      console.warn( message );
    else
      console.log( message );
    return this.getInputs();
  }

  MIDIAccess.prototype.enumerateOutputs = function(  ) {
    var message = "MIDIAccess.enumerateOutputs has been renamed to MIDIAccess.getOutputs.  Please update your code.";
    
    if (console.warn)
      console.warn( message );
    else
      console.log( message );
    return this.getOutputs();
  }

  MIDIAccess.prototype.getInput = function( target ) {
      if (target==null)
          return null;
      return new MIDIInput( this, target );
  }

  MIDIAccess.prototype.getOutput = function( target ) {
      if (target==null)
          return null;
      return new MIDIOutput( this, target );
  }

  function MIDIPort( midi, port, index, type ) {
      this._index = index;
      this._midi = midi;
      this.type = type;

      // Can't get manu/version from Jazz
      this.name = port;
      this.manufacturer = "<manufacturer unknown>";
      this.version = "<version not supported>";
      this.fingerprint = "" + index + "." + this.name;
  }

  MIDIPort.prototype.toString = function() {
      return ("type: "+ this.type + "name: '" + this.name + "' manufacturer: '" + 
      this.manufacturer + "' version: " + this.version + " fingerprint: '" + this.fingerprint + "'" );
  }

  function MIDIInput( midiAccess, target ) {
    this.onmessage = null;
    this._listeners = [];
    this._midiAccess = midiAccess;

    var inputInstance = null;
    for (var i=0; (i<midiAccess._jazzInstances.length)&&(!inputInstance); i++) {
      if (!midiAccess._jazzInstances[i].inputInUse)
        inputInstance=midiAccess._jazzInstances[i];
    }
    if (!inputInstance) {
      inputInstance = new _JazzInstance();
      midiAccess._jazzInstances.push( inputInstance );
    }
    inputInstance.inputInUse = true;

    this._jazzInstance = inputInstance._Jazz;

    // target can be a MIDIPort or DOMString 
    if ( target instanceof MIDIPort ) {
      this._deviceName = target.name;
      this._index = target._index;
    } else if (typeof target === "number") { // target is numerical index
      this._index = target;
      var list=this._jazzInstance.MidiInList();
      this._deviceName = list[target];
    } else if ( target.isString() ) { // fingerprint 
      var dot = target.indexOf(".");
      this._index = parseInt( target.slice( 0, dot ) );
      this._deviceName = target.slice( dot + 1 );
    }

    this._input = this._jazzInstance.MidiInOpen( this._index, _midiProc.bind(this) );
  }

  // Introduced in DOM Level 2:
  MIDIInput.prototype.addEventListener = function (type, listener, useCapture ) {
    if (type != "message")
      return;
    for (var i=0; i<this._listeners.length; i++)
      if (this._listeners[i] == listener)
        return;
    this._listeners.push( listener );
  }

  MIDIInput.prototype.removeEventListener = function (type, listener, useCapture ) {
    if (type != "message")
      return;
    for (var i=0; i<this._listeners.length; i++)
      if (this._listeners[i] == listener) {
        this._listeners.splice( i, 1 );  //remove it
        return;
      }
  }

  MIDIInput.prototype.preventDefault = function() {
    this._pvtDef = true;
  }

  MIDIInput.prototype.dispatchEvent = function (evt) {
    this._pvtDef = false;

    // dispatch to listeners
    for (var i=0; i<this._listeners.length; i++)
      if (this._listeners[i].handleEvent)
        this._listeners[i].handleEvent.bind(this)( evt );
      else
        this._listeners[i].bind(this)( evt );

    if (this.onmessage)
      this.onmessage( evt );

    return this._pvtDef;
  }

  function _midiProc( timestamp, data ) {
    var evt = new CustomEvent( "message" );
    evt.timestamp = parseFloat( timestamp.toString()) + this._jazzInstance._perfTimeZero;
    var length = 0;
    var i,j;

    // Jazz sometimes passes us multiple messages at once, so we need to parse them out
    // and pass them one at a time.
    for (i=0; i<data.length; i+=length) {
      switch (data[i] & 0xF0) {
        case 0x80:  // note off
        case 0x90:  // note on
        case 0xA0:  // polyphonic aftertouch 
        case 0xB0:  // control change
        case 0xE0:  // channel mode
          length = 3;
          break;

        case 0xC0:  // program change
        case 0xD0:  // channel aftertouch
          length = 2;
          break;

        case 0xF0:
          switch (data[i]) {
            case 0xf0:  // variable-length sysex.
              // count the length;
              length = -1;
              for (j=i+1; (j<data.length) && (data[j] != 0xF7); j++)
                ;
              length = j-i+1;
              break;

            case 0xF1:  // MTC quarter frame
            case 0xF3:  // song select
              length = 2;
              break;

            case 0xF2:  // song position pointer
              length = 3;
              break;

            default:
              length = 1;
              break;
          }
          break;
      }
      evt.data = new Uint8Array(data.slice(i, length+i));
      this.dispatchEvent( evt );
    }
  }

  function MIDIOutput( midiAccess, target ) {
    this._midiAccess = midiAccess;

    var outputInstance = null;
    for (var i=0; (i<midiAccess._jazzInstances.length)&&(!outputInstance); i++) {
      if (!midiAccess._jazzInstances[i].outputInUse)
        outputInstance=midiAccess._jazzInstances[i];
    }
    if (!outputInstance) {
      outputInstance = new _JazzInstance();
      midiAccess._jazzInstances.push( outputInstance );
    }
    outputInstance.outputInUse = true;

    this._jazzInstance = outputInstance._Jazz;

    // target can be a MIDIPort or DOMString 
    if ( target instanceof MIDIPort ) {
      this._deviceName = target.name;
      this._index = target._index;
    } else if (typeof target === "number") { // target is numerical index
      this._index = target;
      var list=this._jazzInstance.MidiOutList();
      this._deviceName = list[target];
    } else if ( target.isString() ) { // fingerprint 
      var dot = target.indexOf(".");
      this._index = parseInt( target.slice( 0, dot ) );
      this._deviceName = target.slice( dot + 1 );
    }

    this._jazzInstance.MidiOutOpen(this._deviceName);
  }

  function _sendLater() {
      this.jazz.MidiOutLong( this.data );    // handle send as sysex
  }

  MIDIOutput.prototype.send = function( data, timestamp ) {
    var delayBeforeSend = 0;
    if (data.length==0)
      return false;

    if (timestamp)
      delayBeforeSend = Math.floor( timestamp - window.performance.now() );

    if (timestamp && (delayBeforeSend>1)) {
      var sendObj = new Object;
      sendObj.jazz = this._jazzInstance;
      sendObj.data = data;

      window.setTimeout( _sendLater.bind(sendObj), delayBeforeSend );
    } else {
      this._jazzInstance.MidiOutLong( data );
    }
    return true;
  }

}(window));

// Polyfill window.performance.now() if necessary.
(function (exports) {
    var perf = {},
        props;

    function findAlt() {
        var prefix = "moz,webkit,opera,ms".split(","),
            i = prefix.length,
            //worst case, we use Date.now()
            props = { 
                value: function (start) {
                    return function () {
                        return Date.now() - start;
                    }
                }(Date.now())
            };

        //seach for vendor prefixed version  
        for (; i >= 0; i--) {
            if ((prefix[i] + "Now") in exports.performance) {
                props.value = function (method) {
                    return function () {
                        exports.performance[method]();
                    }
                }(prefix[i] + "Now");
                return props;
            }
        }

        //otherwise, try to use connectionStart 
        if ("timing" in exports.performance &&
            "connectStart" in exports.performance.timing) {
            //this pretty much approximates performance.now() to the millisecond
            props.value = function (start) {
                return function(){Date.now() - start;}
            }(exports.performance.timing.connectStart);
        }
        return props;
    }

    //if already defined, bail    
    if (("performance" in exports) && ("now" in exports.performance)) {
        return;
    }
    if (!("performance" in exports)) {
        Object.defineProperty(exports, "performance", {
            get: function () {
                return perf;
            }
        });
        //otherwise, perforance is there, but not "now()"    
    } 
    props = findAlt(); 
    Object.defineProperty(exports.performance, "now", props);
}(window));



