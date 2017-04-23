var tests = [
    {
	"description":"Basic test",
	"content":"<m><e>x+1</e></m>",
	"type":"text",
	"expected":"+1",
	"run":function(g){
	    do_keys(['right','backspace']);
	}
    },
    {
	"description":"Basic undo test",
	"content":"<m><e></e></m>",
	"type":"text",
	"expected":"xy",
	"run":function(g){
	    do_keys(['x','y','z','mod+z']);
	}
    },
    {
	"description":"Sine test",
	"content":"<m><e></e></m>",
	"type":"text",
	"expected":"sin(x)",
	"run":function(g){
	    do_keys(['s','i','n','x']);
	}
    },
    {
	"description":"Sine undo test",
	"content":"<m><e></e></m>",
	"type":"text",
	"expected":"sin",
	"run":function(g){
	    do_keys(['s','i','n','mod+z']);
	}
    },
    {
	"description":"Exponent undo test",
	"content":"<m><e></e></m>",
	"type":"text",
	"expected":"2x",
	"run":function(g){
	    do_keys(['2','x','shift+6','mod+z']);
	}
    },
    {
	"description":"Basic select delete test",
	"content":"<m><e>x+1</e></m>",
	"type":"text",
	"expected":"1",
	"run":function(g){
	    do_keys(['shift+right','shift+right','backspace']);
	}
    },
    {
	"description":"Basic select replace test",
	"content":"<m><e>x+1</e></m>",
	"type":"text",
	"expected":"a1",
	"run":function(g){
	    do_keys(['shift+right','shift+right','a']);
	}
    },
    {
	"description":"Basic cut/paste test",
	"content":"<m><e>x+1</e></m>",
	"type":"text",
	"expected":"1x+",
	"run":function(g){
	    do_keys(['shift+right','shift+right','mod+x','right','mod+v']);
	}
    },
    {
	"description":"Basic copy/paste test",
	"content":"<m><e>x+1</e></m>",
	"type":"text",
	"expected":"x+1x+",
	"run":function(g){
	    do_keys(['shift+right','shift+right','mod+c','right','mod+v']);
	}
    },
    {
	"description":"f-char delete test",
	"content":'<m><e></e></m>',
	"type":"text",
	"expected":"(2)^(x)",
	"run":function(g){
	    do_keys(['2','shift+6','x','p','i','backspace']);
	}
    },
    {
	"description":"f-char cut/paste test",
	"content":'<m><e></e><f><b p="latex">\\sin\\left(<r ref="1"/>\\right)</b><b p="text">sin(<r ref="1"/>)</b><c><e>x</e></c></f><e>+</e><f c="yes"><b p="latex">{\\pi}</b><b p="text"> PI </b></f><e>+</e><f><b p="latex">\\cos\\left(<r ref="1"/>\\right)</b><b p="text">cos(<r ref="1"/>)</b><c><e>x</e></c></f><e></e></m>',
	"type":"text",
	"expected":"sin(x)+cos(x)+ PI ",
	"run":function(g){
	    do_keys(['right','right','right','shift+right','shift+right','mod+x','right','right','right','right','mod+v']);
	}
    },
];

function do_keys(chs){
    test_guppy.activate();
    for(var i = 0; i < chs.length; i++)
	Mousetrap.trigger(chs[i]);
}
function append_result(name, result){
    var res = document.getElementById("results");
    res.appendChild(document.createElement("br"));
    res.appendChild(document.createTextNode(name + ": " + result));
}

function start_tests(g){
    for(var t in tests){
    	run_test(tests[t], g);
    }
}

function run_test(t, g){
    test_guppy.set_content(t.content);
    test_guppy.render();
    t.run(test_guppy);
    test_guppy.render();
    var observed = test_guppy.get_content(t.type);
    if(t.expected == observed){
	append_result(t.description,"PASS");
    }
    else {
	append_result(t.description,"Observed="+observed + ", Expected="+t.expected);
    }
}
