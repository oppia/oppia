Error.stackTraceLimit = 50;

// Next three methods are primarily for IE5, which is missing them
if (!Array.prototype.push) {
    Array.prototype.push = function() {
        for (var i = 0; i < arguments.length; i++){
                this[this.length] = arguments[i];
        }
        return this.length;
    };
}

if (!Array.prototype.shift) {
    Array.prototype.shift = function() {
        if (this.length > 0) {
            var firstItem = this[0];
            for (var i = 0; i < this.length - 1; i++) {
                this[i] = this[i + 1];
            }
            this.length = this.length - 1;
            return firstItem;
        }
    };
}

if (!Function.prototype.apply) {
    Function.prototype.apply = function(obj, args) {
        var methodName = "__apply__";
        if (typeof obj[methodName] != "undefined") {
            methodName += (String(Math.random())).substr(2);
        }
        obj[methodName] = this;

        var argsStrings = new Array(args.length);
        for (var i = 0; i < args.length; i++) {
            argsStrings[i] = "args[" + i + "]";
        }
        var script = "obj." + methodName + "(" + argsStrings.join(",") + ")";
        var returnValue = eval(script);
        delete obj[methodName];
        return returnValue;
    };
}

/* -------------------------------------------------------------------------- */

var xn = {};

(function() {
    // Utility functions

    // Event listeners
    var getListenersPropertyName = function(eventName) {
        return "__listeners__" + eventName;
    };

    var addEventListener = function(node, eventName, listener, useCapture) {
        useCapture = Boolean(useCapture);
        if (node.addEventListener) {
            node.addEventListener(eventName, listener, useCapture);
        } else if (node.attachEvent) {
            node.attachEvent("on" + eventName, listener);
        } else {
            var propertyName = getListenersPropertyName(eventName);
            if (!node[propertyName]) {
                node[propertyName] = new Array();

                // Set event handler
                node["on" + eventName] = function(evt) {
                    evt = evt || window.event;
                    var listenersPropertyName = getListenersPropertyName(eventName);

                    // Clone the array of listeners to leave the original untouched
                    var listeners = cloneArray(this[listenersPropertyName]);
                    var currentListener;

                    // Call each listener in turn
                    while (currentListener = listeners.shift()) {
                        currentListener.call(this, evt);
                    }
                };
            }
            node[propertyName].push(listener);
        }
    };

    xn.addEventListener = addEventListener;

    // Clones an array
    var cloneArray = function(arr) {
        return arr.slice(0);
    };

    var isFunction = function(f) {
        if (!f){ return false; }
        return (f instanceof Function || typeof f == "function");
    };

    var elementsEquivalent = (typeof Array.prototype.every == "function") ?
        function(array1, array2) {
            function check(val, idx) {
                return val === array2[idx];
            }
            if (array1.length === array2.length) {
                return array1.every(check);
            }
            return false;
        } :

        function(array1, array2) {
            var len1 = array1.length, len2 = array2.length;
            if (len1 === len2) {
                for (var i = 0; i < len1; i++) {
                    if (array1[i] !== array2[i]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

    // CSS Utilities

    function array_contains(arr, val) {
        for (var i = 0, len = arr.length; i < len; i++) {
            if (arr[i] === val) {
                return true;
            }
        }
        return false;
    }

    function addClass(el, className) {
        if (!hasClass(el, className)) {
            if (el.className) {
                el.className += " " + className;
            } else {
                el.className = className;
            }
        }
    }

    function hasClass(el, className) {
        if (el.className) {
            var classNames = el.className.split(" ");
            return array_contains(classNames, className);
        }
        return false;
    }

    function removeClass(el, className) {
        if (hasClass(el, className)) {
            // Rebuild the className property
            var existingClasses = el.className.split(" ");
            var newClasses = [];
            for (var i = 0; i < existingClasses.length; i++) {
                if (existingClasses[i] != className) {
                    newClasses[newClasses.length] = existingClasses[i];
                }
            }
            el.className = newClasses.join(" ");
        }
    }

    function replaceClass(el, newClass, oldClass) {
        removeClass(el, oldClass);
        addClass(el, newClass);
    }

    function getExceptionStringRep(ex) {
        if (ex) {
            var exStr = "Exception: ";
            if (ex.message) {
                exStr += ex.message;
            } else if (ex.description) {
                exStr += ex.description;
            }
            try {
                if (ex.lineNumber) {
                    exStr += " on line number " + ex.lineNumber;
                }
                if (ex.fileName) {
                    exStr += " in file " + ex.fileName;
                }
            } catch(ex) {}
            return exStr;
        }
        return null;
    }


    /* ---------------------------------------------------------------------- */

    /* Configure the test logger try to use FireBug */
    var log, error;
    if (window["console"] && typeof console.log == "function") {
        log = function() {
            if (xn.test.enableTestDebug) {
                console.log.apply(console, arguments);
            }
        };
        error = function() {
            if (xn.test.enableTestDebug) {
                console.error.apply(console, arguments);
            }
        };
    } else {
        log = function() {};
    }

    /* Set up something to report to */

    var initialized = false;
    var container;
    var progressBarContainer, progressBar, overallSummaryText;
    var currentTest = null;
    var suites = [];
    var totalTestCount = 0;
    var currentTestIndex = 0;
    var testsPassedCount = 0;
    var startTime;
    var loaded = false;
    var anyFailed = false;
    var runningSingleTest = false;
    var singleTestId = null;
    var singleTest = null;

    var log4javascriptEnabled = false;

    var nextSuiteIndex = 0;

    function runNextSuite() {
        if (nextSuiteIndex < suites.length) {
            suites[nextSuiteIndex++].run();
        }
    }

    var init = function() {
        if (initialized) { return true; }
        
        var query = window.location.search, matches;
        
        if ( query && (matches = query.match(/^\?test=([\d]+)/)) ) {
            runningSingleTest = true;
            singleTestId = parseInt(matches[1]);
        }

        container = document.createElement("div");

        // Create the overall progress bar
        progressBarContainer = container.appendChild(document.createElement("div"));
        progressBarContainer.className = "xn_test_progressbar_container xn_test_overallprogressbar_container";
        progressBar = progressBarContainer.appendChild(document.createElement("div"));
        progressBar.className = "success";

        document.body.appendChild(container);

        var h1 = progressBar.appendChild(document.createElement("h1"));
        overallSummaryText = h1.appendChild(document.createTextNode(""));

        initialized = true;

        // Set up logging
        log4javascriptEnabled = !!window.log4javascript;

        function TestLogAppender() {}

        if (log4javascriptEnabled && !xn.test.disableLogging) {
            var indentUnit = "  ";

            TestLogAppender.prototype = new log4javascript.Appender();
            //TestLogAppender.prototype.layout = new log4javascript.PatternLayout("%d{HH:mm:ss,SSS} %-5p %m{1}");
            TestLogAppender.prototype.layout = new log4javascript.PatternLayout("%d{HH:mm:ss,SSS} %-5p %m{1}");
            TestLogAppender.prototype.currentIndent = "";
            TestLogAppender.prototype.append = function(loggingEvent) {
                if (currentTest) {
                    var formattedMessage = this.getLayout().format(loggingEvent);
                    if (this.getLayout().ignoresThrowable()) {
                        formattedMessage += loggingEvent.getThrowableStrRep();
                    }
                    currentTest.addLogMessage(this.currentIndent + formattedMessage);
                }
            };
            TestLogAppender.prototype.group = function(message) {
                if (currentTest) {
                    currentTest.addLogMessage(this.currentIndent + message);
                    this.currentIndent += indentUnit;
                }
            };
            TestLogAppender.prototype.groupEnd = function() {
                if (currentTest) {
                    this.currentIndent = this.currentIndent.slice(indentUnit.length);
                }
            };

            var appender = new TestLogAppender();
            appender.setThreshold(log4javascript.Level.ALL);
            log4javascript.getRootLogger().addAppender(appender);
            log4javascript.getRootLogger().setLevel(log4javascript.Level.ALL);

            if (xn.test.enableConsoleLogging) {
                log4javascript.getRootLogger().addAppender( new log4javascript.BrowserConsoleAppender() );
            }
        }

        startTime = new Date();

        // First, build each suite
        for (var i = 0; i < suites.length; i++) {
            suites[i].build();
            totalTestCount += suites[i].tests.length;
        }

        loaded = true;

        // Now run each suite
        runNextSuite();
    };

    function updateProgressBar() {
        progressBar.style.width = "" + parseInt(100 * (currentTestIndex) / totalTestCount) + "%";
        var s = (totalTestCount === 1) ? "" : "s";
        var timeTaken = new Date().getTime() - startTime.getTime();
        overallSummaryText.data = "" + testsPassedCount + " of " + totalTestCount + " test" + s + " passed in " + timeTaken + "ms";
    }

    /* ---------------------------------------------------------------------- */

    /* Test Suite */
    var Suite = function(name, callback, hideSuccessful) {
        this.name = name;
        this.callback = callback;
        this.hideSuccessful = hideSuccessful;
        this.tests = [];
        this.log = log;
        this.error = error;
        this.expanded = true;
        suites.push(this);
    };

    Suite.prototype.test = function(name, callback, setUp, tearDown) {
        this.log("adding a test named " + name);
        var t = new Test(name, callback, this, setUp, tearDown);
        this.tests.push(t);
        
        if (runningSingleTest && t.index == singleTestId) {
            singleTest = t;
        }
        return t;
    };

    Suite.prototype.build = function() {
        // Build the elements used by the suite
        var suite = this;
        
        this.testFailed = false;
        this.container = document.createElement("div");
        this.container.className = "xn_test_suite_container";

        var heading = document.createElement("h2");
        this.expander = document.createElement("span");
        this.expander.className = "xn_test_expander";
        this.expander.onclick = function() {
            if (suite.expanded) {
                suite.collapse();
            } else {
                suite.expand();
            }
        };
        heading.appendChild(this.expander);

        this.headingTextNode = document.createTextNode(this.name);
        heading.appendChild(this.headingTextNode);
        this.container.appendChild(heading);

        this.reportContainer = document.createElement("dl");
        this.container.appendChild(this.reportContainer);

        this.progressBarContainer = document.createElement("div");
        this.progressBarContainer.className = "xn_test_progressbar_container";
        this.progressBar = document.createElement("div");
        this.progressBar.className = "success";
        this.progressBar.innerHTML = "&nbsp;";
        this.progressBarContainer.appendChild(this.progressBar);
        this.reportContainer.appendChild(this.progressBarContainer);

        this.expand();

        container.appendChild(this.container);

        // invoke callback to build the tests
        this.callback.apply(this, [this]);

        if (runningSingleTest) {
            if (singleTest.suite == this) {
                this.tests = [singleTest];
            } else {
                container.removeChild(this.container);
            }
        }

        this.headingTextNode.data = this.name + " [" + this.tests.length + "]"
    };

    Suite.prototype.run = function() {
        if (!runningSingleTest || singleTest.suite == this) {
            this.log("running suite '%s'", this.name);
            this.startTime = new Date();

            // now run the first test
            this._currentIndex = 0;
            this.runNextTest();
        }
    };

    Suite.prototype.updateProgressBar = function() {
        // Update progress bar
        this.progressBar.style.width = "" + parseInt(100 * (this._currentIndex) / this.tests.length) + "%";
        //log(this._currentIndex + ", " + this.tests.length + ", " + progressBar.style.width + ", " + progressBar.className);
    };

    Suite.prototype.expand = function() {
        this.expander.innerHTML = "-";
        replaceClass(this.reportContainer, "xn_test_expanded", "xn_test_collapsed");
        this.expanded = true;
    };

    Suite.prototype.collapse = function() {
        this.expander.innerHTML = "+";
        replaceClass(this.reportContainer, "xn_test_collapsed", "xn_test_expanded");
        this.expanded = false;
    };

    Suite.prototype.finish = function(timeTaken) {
        var newClass = this.testFailed ? "xn_test_suite_failure" : "xn_test_suite_success";
        var oldClass = this.testFailed ? "xn_test_suite_success" : "xn_test_suite_failure";
        replaceClass(this.container, newClass, oldClass);

        this.headingTextNode.data += " (" + timeTaken + "ms)";

        if (this.hideSuccessful && !this.testFailed) {
            this.collapse();
        }
        runNextSuite();
    };

    /**
     * Works recursively with external state (the next index)
     * so that we can handle async tests differently
     */
    Suite.prototype.runNextTest = function() {
        if ((this._currentIndex == this.tests.length) || (anyFailed && xn.test.stopOnFail)) {
            // finished!
            var timeTaken = new Date().getTime() - this.startTime.getTime();

            this.finish(timeTaken);
            return;
        }

        var suite = this;
        var t = this.tests[this._currentIndex++];
        currentTestIndex++;

        currentTest = t;

        if (isFunction(suite.setUp)) {
            suite.setUp.apply(suite, [t]);
        }
        if (isFunction(t.setUp)) {
            t.setUp.apply(t, [t]);
        }

        t._run();

        function afterTest() {
            if (isFunction(suite.tearDown)) {
                suite.tearDown.apply(suite, [t]);
            }
            if (isFunction(t.tearDown)) {
                t.tearDown.apply(t, [t]);
            }
            suite.log("finished test [%s]", t.name);
            updateProgressBar();
            suite.updateProgressBar();
            suite.runNextTest();
        }

        if (t.isAsync) {
            t.whenFinished = afterTest;
        } else {
            window.setTimeout(afterTest, 1);
        }
    };

    Suite.prototype.reportSuccess = function() {
    };

    /* ---------------------------------------------------------------------- */
    /**
     * Create a new test
     */
        
    var testIndex = 0;

    var Test = function(name, callback, suite, setUp, tearDown) {
        this.name = name;
        this.callback = callback;
        this.suite = suite;
        this.setUp = setUp;
        this.tearDown = tearDown;
        this.log = log;
        this.error = error;
        this.assertCount = 0;
        this.logMessages = [];
        this.logExpanded = false;
        this.index = ++testIndex;
    };

    Test.prototype.createSingleTestButton = function() {
        var test = this;
        var frag = document.createDocumentFragment();
        frag.appendChild( document.createTextNode(" (") );
        var singleTestButton = frag.appendChild( document.createElement("a") );
        singleTestButton.innerHTML = "This test only";
        var l = window.location;
        var currentUrl = l.search ? l.href.replace(l.search, "") : l.href;
        singleTestButton.href = currentUrl + "?test=" + test.index;
        frag.appendChild( document.createTextNode(")") );
        return frag;
    };

    /**
     * Default success reporter, please override
     */
    Test.prototype.reportSuccess = function(name, timeTaken) {
        /* default success reporting handler */
        this.reportHeading = document.createElement("dt");
        var text = this.name + " passed in " + timeTaken + "ms";

        this.reportHeading.appendChild(document.createTextNode(text));
        this.reportHeading.appendChild(this.createSingleTestButton());

        this.reportHeading.className = "success";
        var dd = document.createElement("dd");
        dd.className = "success";

        this.suite.reportContainer.appendChild(this.reportHeading);
        this.suite.reportContainer.appendChild(dd);
        this.createLogReport();
    };

    /**
     * Cause the test to immediately fail
     */
    Test.prototype.reportFailure = function(name, timeTaken, msg, ex) {
        this.suite.testFailed = true;
        this.suite.progressBar.className = "failure";
        progressBar.className = "failure";
        this.reportHeading = document.createElement("dt");
        this.reportHeading.className = "failure";
        var text = document.createTextNode(this.name  + " failed in " + timeTaken + "ms");
        this.reportHeading.appendChild(text);
        this.reportHeading.appendChild(this.createSingleTestButton());

        var dd = document.createElement("dd");
        dd.appendChild(document.createTextNode(msg));
        dd.className = "failure";

        this.suite.reportContainer.appendChild(this.reportHeading);
        this.suite.reportContainer.appendChild(dd);
        if (ex && ex.stack) {
            var stackTraceContainer = this.suite.reportContainer.appendChild(document.createElement("code"));
            stackTraceContainer.className = "xn_test_stacktrace";
            stackTraceContainer.innerHTML = ex.stack.replace(/\r/g, "\n").replace(/\n{1,2}/g, "<br />");
        }
        log(ex);
        this.createLogReport();
    };

    Test.prototype.createLogReport = function() {
        if (this.logMessages.length > 0) {
            this.reportHeading.appendChild(document.createTextNode(" ("));
            var logToggler = this.reportHeading.appendChild(document.createElement("a"));
            logToggler.href = "#";
            logToggler.innerHTML = "show log";
            var test = this;

            logToggler.onclick = function() {
                if (test.logExpanded) {
                    test.hideLogReport();
                    this.innerHTML = "show log";
                    test.logExpanded = false;
                } else {
                    test.showLogReport();
                    this.innerHTML = "hide log";
                    test.logExpanded = true;
                }
                return false;
            };

            this.reportHeading.appendChild(document.createTextNode(")"));

            // Create log report
            this.logReport = this.suite.reportContainer.appendChild(document.createElement("pre"));
            this.logReport.style.display = "none";
            this.logReport.className = "xn_test_log_report";
            var logMessageDiv;
            for (var i = 0, len = this.logMessages.length; i < len; i++) {
                logMessageDiv = this.logReport.appendChild(document.createElement("div"));
                logMessageDiv.appendChild(document.createTextNode(this.logMessages[i]));
            }
        }
    };

    Test.prototype.showLogReport = function() {
        this.logReport.style.display = "inline-block";
    };

    Test.prototype.hideLogReport = function() {
        this.logReport.style.display = "none";
    };

    Test.prototype.async = function(timeout, callback) {
        timeout = timeout || 250;
        var self = this;
        var timedOutFunc = function() {
            if (!self.completed) {
                var message = (typeof callback === "undefined") ?
                            "Asynchronous test timed out" : callback(self);
                self.fail(message);
            }
        };
        window.setTimeout(function () { timedOutFunc.apply(self, []); }, timeout);
        this.isAsync = true;
    };

    /**
     * Run the test
     */
    Test.prototype._run = function() {
        this.log("starting test [%s]", this.name);
        this.startTime = new Date();
        try {
            this.callback(this);
            if (!this.completed && !this.isAsync) {
                this.succeed();
            }
        } catch (e) {
            this.log("test [%s] threw exception [%s]", this.name, e);
            var s = (this.assertCount === 1) ? "" : "s";
            this.fail("Exception thrown after " + this.assertCount + " successful assertion" + s + ": " + getExceptionStringRep(e), e);
        }
    };

    /**
     * Cause the test to immediately succeed
     */
    Test.prototype.succeed = function() {
        if (this.completed) { return false; }
        // this.log("test [%s] succeeded", this.name);
        this.completed = true;
        var timeTaken = new Date().getTime() - this.startTime.getTime();
        testsPassedCount++;
        this.reportSuccess(this.name, timeTaken);
        if (this.whenFinished) {
            this.whenFinished();
        }
    };

    Test.prototype.fail = function(msg, ex) {
        if (typeof msg != "string") {
            msg = getExceptionStringRep(msg);
        }
        anyFailed = true;
        var timeTaken = new Date().getTime() - this.startTime.getTime();
        if (this.completed) { return false; }
        this.completed = true;
        // this.log("test [%s] failed", this.name);
        this.reportFailure(this.name, timeTaken, msg, ex);
        if (this.whenFinished) {
            this.whenFinished();
        }
    };

    Test.prototype.addLogMessage = function(logMessage) {
        this.logMessages.push(logMessage);
    };

    /* assertions */
    var displayStringForValue = function(obj) {
        if (obj === null) {
            return "null";
        } else if (typeof obj === "undefined") {
            return "undefined";
        }
        return obj.toString();
    };

    var assert = function(args, expectedArgsCount, testFunction, defaultComment) {
        this.assertCount++;
        var comment = defaultComment;
        var i;
        var success;
        var values = [];
        if (args.length == expectedArgsCount) {
            for (i = 0; i < args.length; i++) {
                values[i] = args[i];
            }
        } else if (args.length == expectedArgsCount + 1) {
            comment = args[args.length - 1];
            for (i = 0; i < args.length; i++) {
                values[i] = args[i];
            }
        } else {
            throw new Error("Invalid number of arguments passed to assert function");
        }
        success = testFunction(values);
        if (!success) {
            var regex = /\{([0-9]+)\}/;
            while (regex.test(comment)) {
                comment = comment.replace(regex, displayStringForValue(values[parseInt(RegExp.$1)]));
            }
            this.fail("Test failed on assertion " + this.assertCount + ": " + comment);
        }
    };

    var testNull = function(values) {
        return (values[0] === null);
    };

    Test.prototype.assertNull = function() {
        assert.apply(this, [arguments, 1, testNull, "Expected to be null but was {0}"]);
    };

    var testNotNull = function(values) {
        return (values[0] !== null);
    };

    Test.prototype.assertNotNull = function() {
        assert.apply(this, [arguments, 1, testNotNull, "Expected not to be null but was {0}"]);
    };

    var testBoolean = function(values) {
        return (Boolean(values[0]));
    };

    Test.prototype.assert = function() {
        assert.apply(this, [arguments, 1, testBoolean, "Expected not to be equivalent to false"]);
    };

    var testTruthy = function(values) {
        return !!values[0];
    };

    var testTrue = function(values) {
        return values[0] === true;
    };

    Test.prototype.assertTrue = function() {
        assert.apply(this, [arguments, 1, testTrue, "Expected to be true but was {0}"]);
    };

    Test.prototype.assert = function() {
        assert.apply(this, [arguments, 1, testTruthy, "Expected to be true but was {0}"]);
    };

    var testFalse = function(values) {
        return (values[0] === false);
    };

    Test.prototype.assertFalse = function() {
        assert.apply(this, [arguments, 1, testFalse, "Expected to be false but was {0}"]);
    };

    var testEquivalent = function(values) {
        return (values[0] === values[1]);
    };

    Test.prototype.assertEquivalent = function() {
        assert.apply(this, [arguments, 2, testEquivalent, "Expected to be equivalent but values were {0} and {1}"]);
    };

    var testNotEquivalent = function(values) {
        return (values[0] !== values[1]);
    };

    Test.prototype.assertNotEquivalent = function() {
        assert.apply(this, [arguments, 2, testNotEquivalent, "Expected to be not equal but values were {0} and {1}"]);
    };

    var testEquals = function(values) {
        return (values[0] == values[1]);
    };

    Test.prototype.assertEquals = function() {
        assert.apply(this, [arguments, 2, testEquals, "Expected to be equal but values were {0} and {1}"]);
    };

    var testNotEquals = function(values) {
        return (values[0] != values[1]);
    };

    Test.prototype.assertNotEquals = function() {
        assert.apply(this, [arguments, 2, testNotEquals, "Expected to be not equal but values were {0} and {1}"]);
    };

    var testRegexMatches = function(values) {
        return (values[0].test(values[1]));
    };

    Test.prototype.assertRegexMatches = function() {
        assert.apply(this, [arguments, 2, testRegexMatches, "Expected regex {0} to match value {1} but it didn't"]);
    };

    var testArraysHaveSameElements = function(values) {
        return elementsEquivalent(values[0], values[1]);
    };

    Test.prototype.assertElementsEquivalent = function() {
        assert.apply(this, [arguments, 2, testArraysHaveSameElements, "Expected elements {0} and {1} to have the same elements but they did not"]);
    };

    var testArraysHaveDifferentElements = function(values) {
        return !elementsEquivalent(values[0], values[1]);
    };

    Test.prototype.assertElementsNotEquivalent = function() {
        assert.apply(this, [arguments, 2, testArraysHaveDifferentElements, "Expected elements {0} and {1} not to have the same elements but they did"]);
    };

    Test.prototype.assertError = function(f, errorType) {
        try {
            f();
            this.fail("Expected error to be thrown");
        } catch (e) {
            if (errorType && (!(e instanceof errorType))) {
                this.fail("Expected error of type " + errorType + " to be thrown but error thrown was " + e);
            }
        }
    };

    Test.prototype.assertNoError = function(f) {
        try {
            f();
        } catch (e) {
            this.fail("Expected no error to be thrown but error was thrown: " + e);
        }
    };

    var indexOf = Array.prototype.indexOf ?
        function(arr, val, from) {
            return arr.indexOf(val, from);
        } :

        function(arr, val, from) {
            var len = arr.length;

            from = Number(arguments[2]) || 0;
            from = Math.floor( Math.max(from, 0) );

            for (; from < len; from++) {
                if ((typeof arr[from] != "undefined") && arr[from] === val) {
                    return from;
                }
            }
            return -1;
        };

    function contains(arr, val) {
        return indexOf(arr, val) > -1;
    }

    function arraysHaveSameElements(arr1, arr2) {
        var l = arr1.length, i = l;
        if (l == arr2.length) {
            while (i--) {
                if (!contains(arr2, arr1[i])) {
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    var testArraysSameElements = function(values) {
        return arraysHaveSameElements(values[0], values[1]);
    };

    var testArraysNotSameElements = function(values) {
        return !arraysHaveSameElements(values[0], values[1]);
    };

    Test.prototype.assertArraysSameElements = function() {
        assert.apply(this, [arguments, 2, testArraysSameElements, "Expected array {0} to have same set of elements as {1} but it didn't"]);
    };

    Test.prototype.assertArraysNotSameElements = function() {
        assert.apply(this, [arguments, 2, testArraysNotSameElements, "Expected array {0} to have a different set of elements to {1} but it didn't"]);
    };

    var arrayElementsEquivalent = (typeof Array.prototype.every == "function") ?
        function(array1, array2) {
            function check(val, idx) {
                return val === array2[idx];
            }
            if (array1.length === array2.length) {
                return array1.every(check);
            }
            return false;
        } :

        function(array1, array2) {
            var len1 = array1.length, len2 = array2.length;
            if (len1 === len2) {
                for (var i = 0; i < len1; i++) {
                    if (array1[i] !== array2[i]) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        };

    var testArraysEquivalent = function(values) {
        return arrayElementsEquivalent(values[0], values[1]);
    };

    var testArraysNotEquivalent = function(values) {
        return !arrayElementsEquivalent(values[0], values[1]);
    };

    Test.prototype.assertArraysEquivalent = function() {
        assert.apply(this, [arguments, 2, testArraysEquivalent, "Expected array {0} to have the same elements in the same order as {1} but it didn't"]);
    };

    Test.prototype.assertArraysNotEquivalent = function() {
        assert.apply(this, [arguments, 2, testArraysNotEquivalent, "Expected array {0} not to have the same elements in the same order as {1} but it did"]);
    };

    /**
     * Execute a synchronous test
     */
    xn.test = function(name, callback) {
        xn.test.suite("Anonymous", function(s) {
            s.test(name, callback);
        });
    };

    /**
     * Create a test suite with a given name
     */
    xn.test.suite = function(name, callback, hideSuccessful) {
        return new Suite(name, callback, hideSuccessful);
    };

    addEventListener(window, "load", function() {
        if (typeof xn.test.runOnLoad == "undefined" || xn.test.runOnLoad) {
            init();
        } else {
            xn.test.runAllSuites = init;
        }
    });
})();