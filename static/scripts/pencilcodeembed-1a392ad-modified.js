// pencilcodeembed.js

// This script allows you to embed a pencil code editor and
// debugger into your web page. You can control appearance,
// execute actions and receive various events from the editor.
// This script uses postMessags() for cross-frame communications.
//
// To embed a pencil code editor into your web page:
//
// 1. Load this script either with a script tag
//    or using an AMD loader like require.js.
//    If loading using require.js, then the class
//    name will be packagename.PencilCodeEmbed.
// 2. Create a div on your page.
// 3. var pce = new PencilCodeEmbed(div);
//    pce.beginLoad('pen red\nfd 50\nrt 45\nfd 50');
// 4. pce.on('load', function(){ ... }) will be called when ready.
// 5. pce.setCode('pen red\nfd 100');
//    pce.beginRun();
// 6. pce.on('execute', function(){ ... }) will be called when ready.
// 7. pce.on('update', function(code){ ... }) will be called every time
//    editor content changes.
//
// Here is a complete example:
//
//  var smiley = [
//    'speed 5',
//    'dot yellow, 160',
//    'fd 20',
//    'rt 90',
//    'fd 25',
//    'dot black, 20',
//    'bk 50',
//    'dot black, 20',
//    'bk 5',
//    'rt 90',
//    'fd 40',
//    'pen black, 7',
//    'lt 30',
//    'lt 120, 35'
//  ];
//
//  var pce = new PencilCodeEmbed(document.getElementById('pencil'));
//  pce.on('updated', function(code) {
//    console.log('new code: ' + code);
//  });
//  pce.on('load', function() {
//    console.log('load complete');
//    pce.hideEditor();
//    pce.hideMiddleButton();
//    pce.hideToggleButton();
//    pce.setReadOnly();
//    pce.showNotification('Pay attention to the Turtle!');
//    setTimeout(function(){
//      pce.hideNotification();
//      pce.setCode(smiley.join('\n'));
//      pce.on('executed', function () {
//        console.log('run complete');
//        pce.showNotification('Turtle is smart! Let\'s make it smarter!');
//        setTimeout(function(){
//          pce.hideNotification();
//          pce.showEditor();
//          pce.showMiddleButton();
//          pce.setEditable();
//        }, 2000);
//      });
//      pce.beginRun();
//    }, 2000);
//  });
//  pce.beginLoad('pen red\nfd 50\nrt 45\nfd 50');
//
// Enjoy!

(function(global) {

  // makes secret for cross-frame communications
  function makeSecret() {
    var SECRET_LENGTH = 64;

    var secret = '';
    for (var i = 0; i < SECRET_LENGTH; i++) {
      secret += String.fromCharCode(65 + Math.floor(Math.random() * 26));
    }

    return secret;
  }

  // calculates an absolute URL
  function absoluteUrl(url) {
    if (!url) return null;
    var absoluteUrlAnchor = document.createElement('a');
    absoluteUrlAnchor.href = url;
    return {
      url: absoluteUrlAnchor.href,
      hostname: absoluteUrlAnchor.hostname
    }
  }

  // NOTE TO DEVELOPERS: This has been modified from the original script to
  // hardcode the pencilcode.net domain.
  var domain = 'pencilcode.net';

  // The "frame" username is magic: it puts
  // Pencil Code into a frame-friendly mode.
  var targetDomain = (/^http/i.test(window.location.protocol) ?
     window.location.protocol : 'http:') + '//frame.' + domain;
  var secret = makeSecret();

  var PencilCodeEmbed = (function() {
    function PencilCodeEmbed(div) {
      this.div = div;
      this.updatedCode = '';
      this.callbacks = {};
      this.requests = {};

      // hook up noop event handlers
      this.on('load', function(){});
      this.on('update', function(code){});
      this.on('startExecute', function(){});
      this.on('execute', function(){});
      this.on('error', function(error){});
    }

    var proto = PencilCodeEmbed.prototype;

    // send messages to the remote iframe
    proto.invokeRemote = function(method, args, callback) {
      var payload = {
          methodName: method,
          args: args,
          secret: secret};
      if (typeof(callback) == 'function') {
        payload.requestid = method + Math.random();
        this.requests[payload.requestid] = callback;
      }
      if (!this.iframe) {
        throw new Error('PencilCodeEmbed: beginLoad must be called first.');
      }
      this.iframe.contentWindow.postMessage(
          JSON.stringify(payload), targetDomain);
      return this;
    };

    proto.on = function(tag, cb) {
      if (!(tag in this.callbacks)) {
        this.callbacks[tag] = [];
      }
      this.callbacks[tag].push(cb);
    };

    proto.beginLoad = function(opts) {
      if (!opts) {
        opts = { };
      } else if (typeof(opts) == 'string') {
        opts = { code: opts };
      }

      var that = this;
      var code = opts.code || '';

      this.div.innerHTML = '';
      this.iframe = document.createElement('iframe');
      this.iframe.style.width = '100%';
      this.iframe.style.height = '100%';
      this.div.appendChild(this.iframe);

      this.updatedCode = code;

      window.addEventListener('message', function(evt) {
        // check origin
        if (evt.origin != targetDomain) {
          return false;
        }

        // check the event is from the child we know about
        if (evt.source !== that.iframe.contentWindow) {
          return false;
        }

        // parse event data
        try {
          var data = JSON.parse(evt.data);
        } catch(error) {
          return false;
        }

        var handled = false;

        // cache updated editor text
        if (data.methodName == 'update') {
          that.updatedCode = data.args[0];
          handled = true;
        }

        // responses are special: send them their one-time callback.
        if (data.methodName == 'response') {
          if (data.requestid in that.requests) {
            var cb = that.requests[data.requestid];
            delete that.requests[data.requestid];
            if (data.args.length < 2) {
              data.args.push('length was ' + data.args.length);
            }
            cb.apply(that, data.args);
            return true;
          }
          return false;
        }

        // invoke method
        var tag = data.methodName;
        if (tag in that.callbacks) {
          var cbarray = that.callbacks[tag];
          for (var j = 0; j < cbarray.length; ++j) {
            var cb = cbarray[j];
            if (cb) {
              cb.apply(that, data.args);
              handled = true;
            }
          }
        }
        return handled;
      });

      var setupargs = '';
      setupargs += '&blocks=' + (opts.blocks ? '1' : '0');

      if (opts.setup) {
        setupargs += '&setup=' + encodeURIComponent(JSON.stringify(opts.setup));
      }

      var targetUrl = targetDomain + '/edit/frame';
      if (opts.mode) {
        targetUrl += '.' + opts.mode;
      }

      this.iframe.src =
          targetUrl +
          '#text=' + encodeURIComponent(code) +
          setupargs +
          '&secret=' + secret;
      return this;
    };

    // Used to define supplementary scripts to run in the preview pane:
    // script is an array of objects that may have "src" or
    // "code" attributes (and "type" attributes) to define script tags
    // to insert into the preview pane.  For example, the following sets
    // up the embedded PencilCode so that the coffeescript code to write
    // "welcome" is run before user code in the preview pane.
    // pce.setupScript([{code: 'write "welcome"', type: 'text/coffeescript'}])
    proto.setupScript = function(setup) {
      return this.invokeRemote('setupScript', [setup]);
    };

    // sets code into the editor
    proto.setCode = function(code) {
      this.updatedCode = code;
      return this.invokeRemote('setCode', [code]);
    };
    // sets code into the editor
    proto.setCode = function(code) {
      this.updatedCode = code;
      return this.invokeRemote('setCode', [code]);
    };

    // gets code from the editor
    proto.getCode = function() {
      return this.updatedCode;
    };

    // starts running
    proto.beginRun = function() {
      return this.invokeRemote('beginRun', []);
    };

    // interrupts a run in progress
    proto.stopRun = function() {
      return this.invokeRemote('stopRun', []);
    };

    // brings up save UI
    proto.save = function(filename) {
      return this.invokeRemote('save', [filename]);
    };

    // makes editor editable
    proto.setEditable = function() {
      return this.invokeRemote('setEditable', []);
    };

    // makes editor read only
    proto.setReadOnly = function() {
      return this.invokeRemote('setReadOnly', []);
    };

    // hides editor
    proto.hideEditor = function() {
      return this.invokeRemote('hideEditor', []);
    };

    // shows editor
    proto.showEditor = function() {
      return this.invokeRemote('showEditor', []);
    };

    // hides middle button
    proto.hideMiddleButton = function() {
      return this.invokeRemote('hideMiddleButton', []);
    };

    // shows middle button
    proto.showMiddleButton = function() {
      return this.invokeRemote('showMiddleButton', []);
    };

    // hides toggle button
    proto.hideToggleButton = function() {
      return this.invokeRemote('hideToggleButton', []);
    };

    // shows toggle button
    proto.showToggleButton = function() {
      return this.invokeRemote('showToggleButton', []);
    };

    // show butter bar notification
    proto.showNotification = function(message) {
      return this.invokeRemote('showNotification', [message]);
    };

    // hides butter bar notification
    proto.hideNotification = function() {
      return this.invokeRemote('hideNotification', []);
    };

    // shows block mode
    proto.setBlockMode = function(showBlocks) {
      return this.invokeRemote('setBlockMode', [showBlocks]);
    };

    // shows block mode
    proto.setBlockOptions = function(palette, options) {
      return this.invokeRemote('setBlockOptions', [palette, options]);
    };

    proto.eval = function(code, callback, raw) {
      return this.invokeRemote('eval', [code, raw], callback);
    }

    return PencilCodeEmbed;
  })();
  if (global.define && global.define.amd) {
    // Support AMD-style loading, if present.
    define(function() {
      return {
        PencilCodeEmbed: PencilCodeEmbed
      };
    });
  } else {
    // Otherwise, just set the global symbol.
    global.PencilCodeEmbed = PencilCodeEmbed
  }
})(this);
