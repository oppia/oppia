xn.test.suite("Textarea", function(s) {
    var enormoString = new Array(1e7).join("x");

    s.setUp = function(t) {
        t.textarea = document.createElement("textarea");
        t.textarea.id = "ta";
        t.textNode = t.textarea.appendChild(document.createTextNode(""));
        t.textNode.data = enormoString;
        document.body.appendChild(t.textarea);
    };

    s.tearDown = function(t) {
        document.body.removeChild(t.textarea);
    };

/*
    s.test("Changing value affects text node", function(t) {
        t.textarea.value = "Test";
        t.assertEquals(t.textarea.value, t.textNode.data);
    });
*/

    s.test("Changing text node affects value", function(t) {
        t.textNode.data = "Test";
        t.assertEquals(t.textarea.value, t.textNode.data);
    });

    s.test("Setting long value via text node", function(t) {
        t.textNode.data = enormoString;
        t.assertEquals(t.textarea.value, enormoString);
    });

    s.test("Setting long value via value", function(t) {
        t.textarea.value = enormoString;
        t.assertEquals(t.textarea.value, enormoString);
    });

    s.test("Setting long value via text node after replacing text area", function(t) {
        var newTextarea = t.textarea.cloneNode(false);
        //alert(newTextarea.id);
        newTextarea.id = "temptextarea";
        var newTextNode = newTextarea.appendChild(document.createTextNode(enormoString));
        t.textarea.parentNode.insertBefore(newTextarea, t.textarea);
        t.textarea.parentNode.removeChild(t.textarea);
        newTextarea.id = t.textarea.id;
        t.textarea = newTextarea;
        t.assertEquals(t.textarea.value, enormoString);
    });

/*
    s.test("Amending long value via changing text node data", function(t) {
        //t.textNode.data = enormoString;
        t.textNode.data = "yyy" + t.textNode.data;
        t.assertEquals(t.textarea.value, "yyy" + enormoString);
        t.textNode.data = "yyy" + t.textNode.data;
        t.assertEquals(t.textarea.value, "yyy" + enormoString);
    });

    s.test("Amending long value via changing text node insertData", function(t) {
        //t.textNode.data = enormoString;
        t.textNode.insertData(0, "yyy");
        t.assertEquals(t.textarea.value, "yyy" + enormoString);
        t.textNode.insertData(0, "yyy");
        t.assertEquals(t.textarea.value, "yyy" + enormoString);
    });
*/

/*
    var boolCount = 1e6;

    s.test("!!", function(t) {
        var a = [], i = boolCount;
        while (i--) {
            a.push(!!i);
        }
    });

    s.test("Boolean", function(t) {
        var a = [], i = boolCount;
        while (i--) {
            a.push(Boolean(i));
        }
    });
*/
}, false);
