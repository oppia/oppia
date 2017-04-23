Mousetrap = require('mousetrap');
katex = require('../lib/katex/katex-modified.min.js');

String.prototype.splice = function(idx, s){ return (this.slice(0,idx) + s + this.slice(idx)); };
String.prototype.splicen = function(idx, s, n){ return (this.slice(0,idx) + s + this.slice(idx+n));};
String.prototype.search_at = function(idx, s){ return (this.substring(idx-s.length,idx) == s); };

var Guppy = function(guppy_div, properties){
    var self = this;
    properties = properties || {};
    if(typeof guppy_div === 'string' || guppy_div instanceof String){
	guppy_div = document.getElementById(guppy_div);
    }
    
    // Set the id on the div if it is not currently set.
    if(!(guppy_div.id)){
	Guppy.log("no id");
	var i = Guppy.max_uid || 0;
	Guppy.log("III",i);
	while(document.getElementById("guppy_uid_"+i)) i++;
	Guppy.max_uid = i;
	guppy_div.id = "guppy_uid_"+i;
    }
    var i = Guppy.max_tabIndex || 0;
    guppy_div.tabIndex = i;
    Guppy.max_tabIndex = i+1;
    
    
    this.editor_active = true;
    this.debug_mode = false;
    this.editor = guppy_div;
    this.type_blacklist = [];
    this.done_callback = this;
    this.ready = false;
    
    if('xml_content' in properties){
	this.base = (new window.DOMParser()).parseFromString(properties.xml_content, "text/xml");
    }
    else {
	this.base = (new window.DOMParser()).parseFromString("<m><e></e></m>", "text/xml");
    }
    
    if('blacklist' in properties)
	this.type_blacklist = properties.blacklist;

    if('done_callback' in properties)
	this.done_callback = properties.done_callback;
    
    if('right_callback' in properties)
	this.right_callback = properties.right_callback;
    
    if('left_callback' in properties)
	this.left_callback = properties.left_callback;
    
    if('ready_callback' in properties)
	this.ready_callback = properties.ready_callback;
    
    if('debug' in properties)
	this.debug_mode = properties.debug=="yes" ? true : false;

    
    Guppy.instances[guppy_div.id] = this;
    
    if(Guppy.ready && !this.ready){
    	if(this.ready_callback) this.ready_callback();
    	this.ready = true;
    }
    Guppy.log("ACTIVE",Guppy.active_guppy);
    this.clipboard = null;
    this.current = this.base.documentElement.firstChild;
    this.temp_cursor = {"node":null,"caret":0}
    if(!this.current.firstChild) this.current.appendChild(this.base.createTextNode(""));
    this.caret = 0;
    this.sel_start = null;
    this.sel_end = null;
    this.undo_data = [];
    this.undo_now = -1;
    this.sel_status = Guppy.SEL_NONE;
    this.checkpoint();
    this.editor.addEventListener("keydown",Guppy.key_down, false);
    this.editor.addEventListener("keyup",Guppy.key_up, false);
    this.editor.addEventListener("focus", function(e) { Guppy.kb.alt_down = false; if(self.activate) self.activate();}, false);
    this.editor.style.boxShadow = "1px 1px 1px 0 lightgray inset";
    this.editor.style.cursor = "text";
    this.deactivate();
    this.recompute_locations_paths();
}

/* Functions intended for external use */

Guppy.guppy_init = function(xslpath, sympath){
    var all_ready = function(){
	Guppy.register_keyboard_handlers();
	for(var i in Guppy.instances){
	    Guppy.instances[i].ready = true;
	    Guppy.instances[i].render(true);
	    if(Guppy.instances[i].ready_callback){
		Guppy.instances[i].ready_callback();
		Guppy.instances[i].ready_callback = null;
	    }
	}
	Guppy.ready = true;
    }
    var greek_syms = ["alpha","beta","gamma","delta","epsilon","zeta","eta","theta","iota","kappa","lambda","mu","nu","xi","omicron","pi","rho","sigma","tau","upsilon","phi","chi","psi","omega","Gamma","Delta","Theta","Lambda","Xi","Pi","Sigma","Phi","Psi","Omega"];
    var raw_syms = ["leq","geq"];

    for(var i = 0; i < greek_syms.length; i++){
	Guppy.symb_raw(greek_syms[i],"{\\"+greek_syms[i]+"}"," $"+greek_syms[i]+" ");
    }
    
    for(var i = 0; i < raw_syms.length; i++){
	Guppy.symb_raw(raw_syms[i],"{\\"+raw_syms[i]+"}"," "+raw_syms[i]+" ");
    }
    
    Guppy.symb_raw("*","\\cdot ","*");
    Guppy.symb_func("sin");
    Guppy.symb_func("cos");
    Guppy.symb_func("tan");
    Guppy.symb_func("sec");
    Guppy.symb_func("csc");
    Guppy.symb_func("cot");
    Guppy.symb_func("log");
    Guppy.symb_func("ln");

    Guppy.get_latexify(xslpath, function(){
	Guppy.get_symbols(sympath, function(){
	    if(document.readyState == "complete")
		all_ready();
	    else
		document.addEventListener("DOMContentLoaded", all_ready, false);
	});
    });
}

Guppy.prototype.get_content = function(t){
    if(t != "xml") return Guppy.xsltify(t,this.base);
    else return (new XMLSerializer()).serializeToString(this.base);
}

Guppy.prototype.set_content = function(xml_data){
    this.base = (new window.DOMParser()).parseFromString(xml_data, "text/xml");
    this.clipboard = null;
    var l = this.base.getElementsByTagName("e");
    Guppy.log(l);
    for(var i = 0; i < l.length; i++){
	if(!(l[i].firstChild)) l[i].appendChild(this.base.createTextNode(""));
    }
    this.current = this.base.documentElement.firstChild;
    this.caret = 0;
    this.sel_start = null;
    this.sel_end = null;
    this.undo_data = [];
    this.undo_now = -1;
    this.sel_status = Guppy.SEL_NONE;
    this.checkpoint();
}


Guppy.instances = {};
Guppy.ready = false;

/* -------------------- */

Guppy.active_guppy = null;
Guppy.xsltProcessor = null;

Guppy.SEL_NONE = 0;
Guppy.SEL_CURSOR_AT_START = 1;
Guppy.SEL_CURSOR_AT_END = 2;

Guppy.is_blank = function(n){
    return n.firstChild == null || n.firstChild.nodeValue == '';
}

Guppy.get_symbols = function(symbols_path, callback){
    var req = new XMLHttpRequest();
    req.onload = function(){
	var syms = JSON.parse(this.responseText);
	for(var s in syms){
	    Guppy.kb.symbols[s] = syms[s];
	}
	if(callback){ callback(); }
    };
    req.open("get", symbols_path, true);
    req.send();
}

Guppy.get_latexify = function(xsl_path, callback){
    if(xsl_path == null){
	Guppy.noXSLT = true;
	if(callback) callback();
	return;
    }
    
    Guppy.noXSLT = false;

    var req = new XMLHttpRequest();
    req.onload = function(){
	var latexify = this.responseText;
	var latexsl = (new window.DOMParser()).parseFromString(latexify, "text/xml");
	Guppy.xsltProcessor = new XSLTProcessor();
	Guppy.xsltProcessor.importStylesheet(latexsl);
	if(callback){ callback(); }
    };
    req.open("get", xsl_path, true);
    req.send();
}

Guppy.xsltify = function(t, base, r){
    if(Guppy.xsltProcessor == null && !(Guppy.noXSLT)){
	Guppy.log("not ready");
	return "";
    }
    if(Guppy.noXSLT){
	ans = Guppy.manual_render(base,t,base.documentElement,r);
	return ans;
    }
    Guppy.log("BB",base);
    Guppy.xsltProcessor.setParameter("","render",r ? "yes" : "no");
    Guppy.xsltProcessor.setParameter("","type",t);
    Guppy.log("rendering",(new XMLSerializer()).serializeToString(base));
    var tex_doc = Guppy.xsltProcessor.transformToDocument(base);
    Guppy.log("rendered",tex_doc);
    Guppy.log(tex_doc);
    return (new XMLSerializer()).serializeToString(tex_doc).replace(/\<.?m\>/g,"");
}

Guppy.bracket_xpath = "(count(./*) != 1 and not \
		          ( \
                            count(./e)=2 and \
			    count(./f)=1 and \
			    count(./e[string-length(text())=0])=2 and \
			    ( \
			      (\
                                count(./f/c)=1 and\
			        count(./f/c[@is_bracket='yes'])=1\
			      )\
			      or\
			      (\
			        f/@c='yes' and \
				count(./e[@current='yes'])=0 and \
				count(./e[@temp='yes'])=0 \
			      )\
			    )\
			  )\
			)  \
			or\
		        (\
			  count(./*) = 1 and \
			  string-length(./e/text()) != 1 and \
			  number(./e/text()) != ./e/text() \
			) \
			or \
		        ( \
			  count(./*) = 1 and \
			  ./e/@current = 'yes' \
			) \
			or \
		        ( \
			  count(./*) = 1 and \
			  ./e/@temp = 'yes' \
			)"

Guppy.manual_render = function(base,t,n,r){
    var ans = "";
    Guppy.log("NN",n);
    if(n.nodeName == "e"){
	if(t == "latex" && r){
	    ans = n.getAttribute("render");
	}
	else{
	    ans = n.firstChild.textContent;
	}
    }
    else if(n.nodeName == "f"){
	for(var nn = n.firstChild; nn != null; nn = nn.nextSibling){
	    if(nn.nodeName == "b" && nn.getAttribute("p") == t){
		ans = Guppy.manual_render(base,t,nn,r);
		break;
	    }
	}
    }
    else if(n.nodeName == "b"){
	var cs = []
	var i = 1;
	var par = n.parentNode;
	for(var nn = par.firstChild; nn != null; nn = nn.nextSibling)
	    if(nn.nodeName == "c") cs[i++] = Guppy.manual_render(base,t,nn,r);
	for(var nn = n.firstChild; nn != null; nn = nn.nextSibling){
	    if(nn.nodeType == 3) ans += nn.textContent;
	    else if(nn.nodeType == 1) ans += cs[parseInt(nn.getAttribute("ref"))];
	}
    }
    else if(n.nodeName == "c" || n.nodeName == "m"){
	for(var nn = n.firstChild; nn != null; nn = nn.nextSibling)
	    ans += Guppy.manual_render(base,t,nn,r);
	if(t == "latex" &&
           n.getAttribute("bracket") == "yes" &&
	   base.evaluate(Guppy.bracket_xpath, n, null,
			 XPathResult.BOOLEAN_TYPE, null).booleanValue){ 
	    ans = "\\left("+ans+"\\right)";
	}
    }
    Guppy.log("ANS: ",ans)
    return ans;
}

Guppy.prototype.path_to = function(n){
    var name = n.nodeName;
    if(name == "m") return "guppy_loc_m";
    var ns = 0;
    for(var nn = n; nn != null; nn = nn.previousSibling) if(nn.nodeType == 1 && nn.nodeName == name) ns++;
    return this.path_to(n.parentNode)+"_"+name+""+ns;
}

Guppy.prototype.is_changed = function(){
    var bb = this.editor.getElementsByClassName("katex")[0];
    if(!bb) return;
    var rect = bb.getBoundingClientRect();
    if(this.bounding_box)
	ans = this.bounding_box.top != rect.top || this.bounding_box.bottom != rect.bottom || this.bounding_box.right != rect.right || this.bounding_box.left != rect.left;
    else
	ans = true;
    this.bounding_box = rect;
    return ans;
}

Guppy.prototype.recompute_locations_paths = function(){
    ans = [];
    var bb = this.editor.getElementsByClassName("katex")[0];
    if(!bb) return;
    var rect = bb.getBoundingClientRect();
    ans.push({'path':'all',
	      'top':rect.top,
	      'bottom':rect.bottom,
	      'left':rect.left,
	      'right':rect.right});
    var elts = this.editor.getElementsByClassName("guppy_elt");
    for(var i = 0; i < elts.length; i++){
	var elt = elts[i];
	if(elt.nodeName == "mstyle") continue;
	var rect = elt.getBoundingClientRect();
	//console.log("rect BTLR",rect.bottom,rect.top,rect.left,rect.right,elt.classList);
	if(rect.top == 0 && rect.bottom == 0 && rect.left == 0 && rect.right == 0) continue;
	var cl = elt.classList;
	for(var j = 0; j < cl.length; j++){
	    if(cl[j].startsWith("guppy_loc")){
		ans.push({'path':cl[j],
			  'top':rect.top,
			  'bottom':rect.bottom,
			  'left':rect.left,
			  'right':rect.right,
			  'mid_x':(rect.left+rect.right)/2,
			  'mid_y':(rect.bottom+rect.top)/2,
			  'blank':(' '+elt.className+' ').indexOf(' guppy_blank ') >= 0});
		break;
	    }
	}
    }
    this.boxes = ans;
    //console.log(JSON.stringify(this.boxes));
}

Guppy.get_loc = function(x,y,current_node,current_caret){
    var g = Guppy.active_guppy;
    var min_dist = -1;
    var mid_x_dist = 0;
    var pos = "";
    var opt = null;
    var cur = null;
    var car = null;
    //console.log("searching");
    // check if we go to first or last element
    var bb = g.editor.getElementsByClassName("katex")[0];
    if(!bb) return;
    var rect = bb.getBoundingClientRect();
    if(current_node){
	var current_path = g.path_to(current_node);
	var current_pos = parseInt(current_path.substring(current_path.lastIndexOf("e")+1));
	//console.log("CP",current_path);
    }
    // if(x < rect.left){
    // 	cur = g.base.documentElement.firstChild;
    // 	car = 0;
    // 	pos = "left";
    // }
    // else if(x > rect.right){
    // 	cur = g.base.documentElement.lastChild;
    // 	car = cur.firstChild.nodeValue.length;
    // 	pos = "right";
    // }
    //else{
	// We are inside expression

    var boxes = g.boxes;
	if(current_node){
	    current_path = current_path.replace(/e[0-9]+$/,"e");
	    var boxes2 = [];
	    for(var i = 0; i < boxes.length; i++){
		if(boxes[i].path == "all") continue;
		var loc = boxes[i].path.substring(0,boxes[i].path.lastIndexOf("_"));
		loc = loc.replace(/e[0-9]+$/,"e");
		if(loc == current_path){
		    //console.log("CL",loc);
		    boxes2.push(boxes[i]);
		}
	    }
	    boxes = boxes2;
	}
	//console.log("BOXES",boxes);
	for(var i = 0; i < boxes.length; i++){
	    var box = boxes[i];
	    //console.log("BOX",JSON.stringify(box),x,y);
	    if(box.path == "all") continue;
	    var xdist = Math.max(box.left - x, x - box.right, 0)
	    var ydist = Math.max(box.top - y, y - box.bottom, 0)
	    var dist = Math.sqrt(xdist*xdist + ydist*ydist);
	    if(min_dist == -1 || dist < min_dist){
		min_dist = dist;
		mid_dist = x - box.mid_x;
		opt = box;
	    }
	}
        //console.log("OPT",JSON.stringify(opt),x,y);
	var loc = opt.path.substring("guppy_loc".length);
	loc = loc.replace(/_/g,"/");
	loc = loc.replace(/([0-9]+)(?=.*?\/)/g,"[$1]");
	//console.log("LOC",loc);
	cur = g.base.evaluate(loc.substring(0,loc.lastIndexOf("/")), g.base.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
	car = parseInt(loc.substring(loc.lastIndexOf("/")+1));
	// Check if we want the cursor before or after the element
	//console.log("MD",mid_dist);
	if(mid_dist > 0 && !(opt.blank)){
	    //console.log("RIGHT")
	    car++;
	}
    //}
    ans = {"current":cur,"caret":car,"pos":pos};
    if(current_node && opt){
	var opt_pos = parseInt(opt.path.substring(opt.path.lastIndexOf("e")+1,opt.path.lastIndexOf("_")));
	//var opt_caret = parseInt(opt.path.substring(opt.path.lastIndexOf("_")+1));
	if(opt_pos < current_pos) pos = "left";
	else if(opt_pos > current_pos) pos = "right";
	else if(car < current_caret) pos = "left";
	else if(car > current_caret) pos = "right";
	Guppy.log("POS",current_path,current_pos,opt_pos,car,current_caret);
	if(pos) ans['pos'] = pos;
	else ans['pos'] = "none";
    }
    return ans;
}

Guppy.prototype.select_to = function(x,y){
    var sel_caret = this.caret;
    var sel_cursor = this.current;
    if(this.sel_status == Guppy.SEL_CURSOR_AT_START){
	sel_cursor = this.sel_end.node;
	sel_caret = this.sel_end.caret;
    }
    else if(this.sel_status == Guppy.SEL_CURSOR_AT_END){
	sel_cursor = this.sel_start.node;
	sel_caret = this.sel_start.caret;
    }
    var loc = Guppy.get_loc(x,y,sel_cursor,sel_caret);
    if(!loc) return;
    //console.log("MLOC",loc,sel_cursor,sel_caret);
    if(loc.current == sel_cursor && loc.caret == sel_caret){
	this.caret = loc.caret
	this.sel_status = Guppy.SEL_NONE;
    }
    else if(loc.pos == "left"){
	this.sel_end = {"node":sel_cursor,"caret":sel_caret};
	this.set_sel_boundary(Guppy.SEL_CURSOR_AT_START);
    }
    else if(loc.pos == "right"){
	this.sel_start = {"node":sel_cursor,"caret":sel_caret};
	this.set_sel_boundary(Guppy.SEL_CURSOR_AT_END);
    }
    this.current = loc.current;
    this.caret = loc.caret;
}

Guppy.mouse_up = function(e){
    Guppy.kb.is_mouse_down = false;
    var g = Guppy.active_guppy;
    if(g) g.render(true);
}

Guppy.mouse_down = function(e){
    var n = e.target;
    Guppy.kb.is_mouse_down = true;
    if(e.target == document.getElementById("toggle_ref")) toggle_div("help_card");
    else while(n != null){
	if(n.id in Guppy.instances){
	    e.preventDefault();
	    Guppy.active_guppy = Guppy.instances[n.id];
	    Guppy.active_guppy.activate();
	    for(var i in Guppy.instances){
		if(i != n.id) Guppy.instances[i].deactivate();
	    }
	    var g = Guppy.active_guppy;
	    if(e.shiftKey){
		g.select_to(e.clientX,e.clientY);
	    }
	    else {
		var loc = Guppy.get_loc(e.clientX,e.clientY);
		if(!loc) return;
		g.current = loc.current;
		g.caret = loc.caret;
		g.sel_status = Guppy.SEL_NONE;
	    }
	    g.render(true);
	    return;
	}
	n = n.parentNode;
    }
    Guppy.active_guppy = null;
    for(var i in Guppy.instances){
	Guppy.instances[i].deactivate();
    }
}

Guppy.mouse_move = function(e){
    var g = Guppy.active_guppy;
    if(!g) return;
    if(!Guppy.kb.is_mouse_down){
	var bb = g.editor;
	var rect = bb.getBoundingClientRect();
	if((e.clientX < rect.left || e.clientX > rect.right) || (e.clientY > rect.bottom || e.clientY < rect.top)){
	    //console.log("R",rect);
	    g.temp_cursor = {"node":null,"caret":0};
	}
	else{
	    var loc = Guppy.get_loc(e.clientX,e.clientY);
	    if(!loc) return;
	    g.temp_cursor = {"node":loc.current,"caret":loc.caret};
	}
	g.render(g.is_changed());
    }
    else{
	g.select_to(e.clientX,e.clientY);
	//console.log("SSS",g.sel_status,g.sel_start,g.sel_end,g.caret);
	g.render(g.is_changed());
    }
}

window.addEventListener("mousedown",Guppy.mouse_down, false);
window.addEventListener("mouseup",Guppy.mouse_up, false);
window.addEventListener("mousemove",Guppy.mouse_move, false);

Guppy.prototype.add_paths = function(n,path){
    //console.log("B",n.nodeName,n.firstChild.nodeName)
    if(n.nodeName == "e"){
	n.setAttribute("path",path);
	//console.log("DONE");
    }
    else{
	//console.log("NOT DONE");
	var es = 1, fs = 1, cs = 1;
	for(var c = n.firstChild; c != null; c = c.nextSibling){
	    //console.log("C",c)
	    if(c.nodeName == "c"){ this.add_paths(c, path+"_c"+cs); cs++; }
	    else if(c.nodeName == "f"){ this.add_paths(c, path+"_f"+fs); fs++; }
	    else if(c.nodeName == "e"){ this.add_paths(c, path+"_e"+es); es++; }
	}
    }
}

Guppy.prototype.add_classes_cursors = function(n,path){
    //console.log("B",n.nodeName,n.firstChild.nodeName)
    if(n.nodeName == "e"){
	var text = n.firstChild.nodeValue;
	//console.log("T",text);
	ans = "";
	var sel_cursor;
	var text_node = this.is_text(n);
	if(this.sel_status == Guppy.SEL_CURSOR_AT_START) sel_cursor = this.sel_end;
	if(this.sel_status == Guppy.SEL_CURSOR_AT_END) sel_cursor = this.sel_start;
	if(this.sel_status != Guppy.SEL_NONE){
	    var sel_caret_text = this.is_small(sel_cursor.node) ? Guppy.kb.SMALL_SEL_CARET : Guppy.kb.SEL_CARET;
	    if(!text_node && text.length == 0 && n.parentNode.childElementCount > 1){
		sel_caret_text = "\\color{blue}{\\xmlClass{guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0}{"+sel_caret_text+"}}";
	    }
	    else{
		sel_caret_text = "\\color{blue}{"+sel_caret_text+"}";
	    }
	    if(this.sel_status == Guppy.SEL_CURSOR_AT_END) sel_caret_text = text_node ? "[" : sel_caret_text + "\\color{"+Guppy.kb.SEL_COLOR+"}{";
	    if(this.sel_status == Guppy.SEL_CURSOR_AT_START) sel_caret_text = text_node ? "]" : "}" + sel_caret_text;
	}
	var caret_text = "";
	var temp_caret_text = "";
	if(text.length == 0){
	    if(text_node) caret_text = "[]";
	    else if(n.parentNode.childElementCount == 1){
		if(this.current == n)
		    ans = "\\color{red}{\\xmlClass{main_cursor guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0"+"}{[?]}}";
		else if(this.temp_cursor.node == n)
		    ans = "\\color{gray}{\\xmlClass{guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0"+"}{[?]}}";
		else
		    ans = "\\color{blue}{\\xmlClass{guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0"+"}{[?]}}";
	    }
	    else if(this.temp_cursor.node != n && this.current != n && (!(sel_cursor) || sel_cursor.node != n)){
		// These are the empty e elements at either end of
		// a c or m node, such as the space before and
		// after both the sin and x^2 in sin(x^2)
		//
		// Here, we add in a small element so that we can
		// use the mouse to select these areas
		ans = "\\phantom{\\xmlClass{guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0"+"}{\\cursor[0.1ex]{1ex}}}";
	    }
	}
	//console.log("SEL",sel_cursor,sel_caret_text);
	for(var i = 0; i < text.length+1; i++){
	    if(n == this.current && i == this.caret && (text.length > 0 || n.parentNode.childElementCount > 1)){
		if(text_node){
		    if(this.sel_status == Guppy.SEL_CURSOR_AT_START)
			caret_text = "[";
		    else if(this.sel_status == Guppy.SEL_CURSOR_AT_END)
			caret_text = "]";
		    else
			caret_text = "[]";
		}
		else{
		    //console.log("HERE");
		    caret_text = this.is_small(this.current) ? Guppy.kb.SMALL_CARET : Guppy.kb.CARET;
		    if(text.length == 0)
			caret_text = "\\color{red}{\\xmlClass{main_cursor guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0}{"+caret_text+"}}";
		    else{
			caret_text = "\\color{red}{\\xmlClass{main_cursor}{"+caret_text+"}}"
		    }
		    if(this.sel_status == Guppy.SEL_CURSOR_AT_START)
			caret_text = caret_text + "\\color{"+Guppy.kb.SEL_COLOR+"}{";
		    else if(this.sel_status == Guppy.SEL_CURSOR_AT_END)
			caret_text = "}" + caret_text;
		}
		ans += caret_text;
	    }
	    else if(n == this.current && i == this.caret && text_node){
		ans += caret_text;
	    }
	    else if(this.sel_status != Guppy.SEL_NONE && sel_cursor.node == n && i == sel_cursor.caret){
		ans += sel_caret_text;
	    }
	    else if(this.temp_cursor.node == n && i == this.temp_cursor.caret && (text.length > 0 || n.parentNode.childElementCount > 1)){
		if(text_node) 
		    temp_caret_text = ".";
		else{
		    temp_caret_text = this.is_small(this.current) ? Guppy.kb.TEMP_SMALL_CARET : Guppy.kb.TEMP_CARET;
		    if(text.length == 0){
			//console.log("THERE")
			temp_caret_text = "\\color{gray}{\\xmlClass{guppy_elt guppy_blank guppy_loc_"+n.getAttribute("path")+"_0}{"+temp_caret_text+"}}";
		    }
		    else
			temp_caret_text = "\\color{gray}{"+temp_caret_text+"}";
		}
		ans += temp_caret_text;
	    }
	    if(i < text.length) ans += "\\xmlClass{guppy_elt guppy_loc_"+n.getAttribute("path")+"_"+i+"}{"+text[i]+"}";
	}
	n.setAttribute("render", ans);
	n.removeAttribute("path");
    }
    else{
	//console.log("NOT DONE");
	for(var c = n.firstChild; c != null; c = c.nextSibling){
	    if(c.nodeName == "c" || c.nodeName == "f" || c.nodeName == "e"){ this.add_classes_cursors(c); }
	}
    }
}

Guppy.prototype.post_render_cleanup = function(n){
    if(n.nodeName == "e"){
	n.removeAttribute("path");
	n.removeAttribute("render");
	n.removeAttribute("current");
	n.removeAttribute("temp");
    }
    else{
	for(var c = n.firstChild; c != null; c = c.nextSibling){
	    if(c.nodeType == 1){ this.post_render_cleanup(c); }
	}
    }
}

Guppy.prototype.render_node = function(n,t){
    //console.log(this.current,this.caret);
    // All the interesting work is done by xsltify and latexify.xsl.  This function just adds in the cursor and selection-start cursor
    Guppy.log("cc",this.caret,"=caret",this.current,this.current.firstChild.nodeValue.slice(0,this.caret),"bb",this.current.firstChild.nodeValue.slice(this.caret+Guppy.kb.CARET.length));
    var output = "";
    if(t == "latex"){
	this.add_paths(this.base.documentElement,"m");
	this.add_classes_cursors(this.base.documentElement);
	this.current.setAttribute("current","yes");
	if(this.temp_cursor.node) this.temp_cursor.node.setAttribute("temp","yes");
	output = Guppy.xsltify(t, this.base, true);
	this.post_render_cleanup(this.base.documentElement);
	//console.log("OUT",output);
	output = output.replace(new RegExp('&amp;','g'), '&');
	return output;
    }
    else{
	output = Guppy.xsltify(t, this.base);
    }
    //Guppy.log("cc",caret,"=caret",current.firstChild.nodeValue,current.firstChild.nodeValue.slice(0,caret),"bb",current.firstChild.nodeValue.slice(caret+CARET.length));
    //if(t == "latex") current.firstChild.nodeValue = (caret == 0 ? "" : current.firstChild.nodeValue.slice(0,caret))+current.firstChild.nodeValue.slice(caret+CARET.length);
    return output
}

Guppy.prototype.set_sel_start = function(){
    this.sel_start = {"node":this.current, "caret":this.caret};
}

Guppy.prototype.set_sel_end = function(){
    this.sel_end = {"node":this.current, "caret":this.caret};
}

Guppy.prototype.next_sibling = function(n){
    if(n == null) return null;
    var c = n.parentNode.nextSibling;
    while(c != null && c.nodeName != "e") c = c.nextSibling;
    if(c == null) return null
    else return c.firstChild;
}

Guppy.prototype.prev_sibling = function(n){
    if(n == null) return null;
    var c = n.parentNode.previousSibling;
    while(c != null && c.nodeName != "e") c = c.previousSibling;
    if(c == null) return null
    else return c.firstChild;
}

Guppy.prototype.down_from_f = function(){
    var nn = this.current.firstChild;
    while(nn != null && nn.nodeName != 'c') nn = nn.nextSibling;
    if(nn != null){
	//Sanity check:
	if(nn.nodeName != 'c' || nn.firstChild.nodeName != 'e'){
	    this.problem('dff');
	    return;
	}
	this.current = nn.firstChild;
    }
}

Guppy.prototype.down_from_f_to_blank = function(){
    var nn = this.current.firstChild;
    while(nn != null && !(nn.nodeName == 'c' && nn.children.length == 1 && nn.firstChild.firstChild.nodeValue == "")){
	Guppy.log("DFFTB",nn);
	nn = nn.nextSibling;
    }
    if(nn != null){
	//Sanity check:
	if(nn.nodeName != 'c' || nn.firstChild.nodeName != 'e'){
	    this.problem('dfftb');
	    return;
	}
	this.current = nn.firstChild;
    }
    else this.down_from_f();
}

Guppy.prototype.delete_from_f = function(){
    var n = this.current;
    var p = n.parentNode;
    var prev = n.previousSibling;
    var next = n.nextSibling;
    var new_node = this.make_e(prev.firstChild.textContent + next.firstChild.textContent);
    this.current = new_node;
    this.caret = prev.firstChild.textContent.length;
    p.insertBefore(new_node, prev);
    p.removeChild(prev);
    p.removeChild(n);
    p.removeChild(next);
}

Guppy.prototype.next_node_from_e = function(n){
    if(n == null || n.nodeName != 'e') return null;
    // If we have a next sibling f node, use that:
    if(n.nextSibling != null){
	if(n.nextSibling.nodeName != 'f'){
	    this.problem('nnfe3');
	    return null;
	}
	Guppy.log("next");
	var nc = n.nextSibling.firstChild;
	while(nc != null){
	    if(nc.nodeName == 'c')
		return nc.firstChild;
	    nc = nc.nextSibling
	}
	return n.nextSibling.nextSibling;
    }
    // If not, then we're either at the top level or our parent is a c
    // child of an f node, at which point we should look to see our
    // parent has a next sibling c node: 
    if(n.parentNode.nextSibling != null && n.parentNode.nextSibling.nodeName == 'c'){
	var nn = n.parentNode.nextSibling.firstChild;
	//Another sanity check:
	if(nn.nodeName != 'e'){
	    this.problem('nnfe1');
	    return null
	}
	Guppy.log("parent.next.child")
	return nn;
    }
    // If we're actually at the top level, then do nothing: 
    if(n.parentNode.parentNode == null) return null;
    //Another sanity check: 
    if(n.parentNode.parentNode.nodeName != 'f'){
	this.problem('nnfe2');
	return null;
    }
    return n.parentNode.parentNode.nextSibling;
}

Guppy.prototype.prev_node_from_e = function(n){
    Guppy.log(n.previousSibling);
    if(n == null || n.nodeName != 'e') return null;
    if(n.previousSibling != null){
	if(n.previousSibling.nodeName != 'f'){
	    this.problem('pnfe3');
	    return null;
	}
	var nc = n.previousSibling.lastChild;
	while(nc != null){
	    if(nc.nodeName == 'c')
		return nc.lastChild;
	    nc = nc.previousSibling
	}
	return n.previousSibling.previousSibling;
    }
    else if(n.parentNode.previousSibling != null && n.parentNode.previousSibling.nodeName == 'c'){
	var nn = n.parentNode.previousSibling.lastChild;
	//Another sanity check:
	if(nn.nodeName != 'e'){
	    this.problem('pnfe1');
	    return null
	}
	return nn;
    }
    else if(n.parentNode.parentNode == null) return null;
    //Another sanity check: 
    if(n.parentNode.parentNode.nodeName != 'f'){
	this.problem('pnfe2');
	return null;
    }
    return n.parentNode.parentNode.previousSibling;
}

Guppy.prototype.symbol_to_node = function(sym_name, content){
    // sym_name is a key in the symbols dictionary
    //
    // content is a list of nodes to insert
    
    var s = Guppy.kb.symbols[sym_name];
    var f = this.base.createElement("f");
    if("type" in s) f.setAttribute("type",s["type"])
    if(s['char']) f.setAttribute("c","yes");
    
    var first_ref = -1;
    var refs_count = 0;
    var first;

    // Make the b nodes for rendering each output    
    for(var t in s["output"]){
	var b = this.base.createElement("b");
	b.setAttribute("p",t);

	var out = s["output"][t];
	if(typeof out == 'string'){
	    out = out.split(/(\{\$[0-9]+\})/g);
	    for(var i = 0; i < out.length; i++){
		m = out[i].match(/^\{\$([0-9]+)\}$/);
		if(m) out[i] = parseInt(m[1]);
	    }
	}
	for(var i = 0; i < out.length; i++){
	    if(typeof out[i] == 'string' || out[i] instanceof String){
		var nt = this.base.createTextNode(out[i]);
		b.appendChild(nt);
	    }
	    else{
		var nt = this.base.createElement("r");
		nt.setAttribute("ref",out[i]);
		if(t == 'latex') {
		    if(first_ref == -1) first_ref = out[i];
		    refs_count++;
		}
		b.appendChild(nt);
	    }
	}
	f.appendChild(b);
    }

    // Now make the c nodes for storing the content
    for(var i = 0; i < refs_count; i++){
	var nc = this.base.createElement("c");
	if(i in content){
	    var node_list = content[i];
	    for(var se = 0; se < node_list.length; se++){
		nc.appendChild(node_list[se].cloneNode(true));
	    }
	}
	else nc.appendChild(this.make_e(""));
	//Guppy.log(refs_count,first_ref,i,ne);
	if(i+1 == first_ref) first = nc.lastChild;
	for(var a in s['attrs'])
	    if(s['attrs'][a][i] != 0) nc.setAttribute(a,s['attrs'][a][i]);
	f.appendChild(nc);
    }
    Guppy.log("FF",f);
    return {"f":f, "first":first};
}

Guppy.prototype.is_text = function(nn){
    return (nn.parentNode.getAttribute("mode") && nn.parentNode.getAttribute("mode") == "text")
}

Guppy.prototype.is_small = function(nn){
    var n = nn.parentNode;
    while(n != null){
	if(n.getAttribute("size") == "s"){
	    return true;
	}
	n = n.parentNode.parentNode;
    }
    return false;
}

Guppy.prototype.insert_symbol = function(sym_name){
    var s = Guppy.kb.symbols[sym_name];
    if(this.is_blacklisted(s['type'])){
	Guppy.log("BLACKLISTED");
	return false;
    }
    var node_list = {};
    var content = {};
    var left_piece,right_piece;
    var cur = s['current'] == null ? 0 : parseInt(s['current']);
    var to_remove = [];
    var to_replace = null;
    var replace_f = false;
    
    Guppy.log("cur",cur);
    
    if(cur > 0){
	cur--;
	Guppy.log(cur);
	if(this.sel_status != Guppy.SEL_NONE){
	    Guppy.log("SEL",this.current);
	    var sel = this.sel_get();
	    sel_parent = sel.involved[0].parentNode;
	    Guppy.log("SCC", sel, "\nABC", sel.involved[0], sel_parent, sel.node_list, this.current);
	    to_remove = sel.involved;
	    left_piece = this.make_e(sel.remnant.firstChild.nodeValue.slice(0,this.sel_start.caret));
	    right_piece = this.make_e(sel.remnant.firstChild.nodeValue.slice(this.sel_start.caret));
	    content[cur] = sel.node_list;
	    Guppy.log("DONE_SEL",left_piece,content,right_piece);
	}
	else if(s['current_type'] == 'token'){
	    Guppy.log("TOKEN");
	    // If we're at the beginning, then the token is the previous f node
	    if(this.caret == 0 && this.current.previousSibling != null){
		content[cur] = [this.make_e(""), this.current.previousSibling, this.make_e("")];
		to_replace = this.current.previousSibling;
		replace_f = true;
	    }
	    else{
		// look for [0-9.]+|[a-zA-Z] immediately preceeding the caret and use that as token
		var prev = this.current.firstChild.nodeValue.substring(0,this.caret);
		var token = prev.match(/[0-9.]+$|[a-zA-Z]$/);
		if(token != null && token.length > 0){
		    token = token[0];
		    left_piece = this.make_e(this.current.firstChild.nodeValue.slice(0,this.caret-token.length));
		    right_piece = this.make_e(this.current.firstChild.nodeValue.slice(this.caret));
		    content[cur] = [this.make_e(token)];
		}
	    }
	}
    }
    if(!replace_f && (left_piece == null || right_piece == null)){
	Guppy.log("splitting",this.current,this.caret);
	left_piece = this.make_e(this.current.firstChild.nodeValue.slice(0,this.caret));
	right_piece = this.make_e(this.current.firstChild.nodeValue.slice(this.caret));
	to_remove = [this.current];
    }

    // By now:
    // 
    // content contains whatever we want to pre-populate the 'current' field with (if any)
    //
    // right_piece contains whatever content was in an involved node
    // to the right of the cursor but is not part of the insertion.
    // Analogously for left_piece
    //
    // Thus all we should have to do now is symbol_to_node(sym_type,
    // content) and then add the left_piece, resulting node, and
    // right_piece in that order.
    
    var new_current = null;
    var current_parent = this.current.parentNode;
    Guppy.log(this.current,this.current.parentNode);
    Guppy.log("SO",s,s["output"])
    Guppy.log("TR",this.current,this.current_parent,to_remove);
    
    var sym = this.symbol_to_node(sym_name,content);
    var f = sym.f;
    var new_current = sym.first;

    var next = this.current.nextSibling;

    Guppy.log("CSSCS",this.current,this.current.parentNode);

    if(replace_f){
	Guppy.log(to_replace,current_parent,f);
	current_parent.replaceChild(f,to_replace);
    }
    else{
	if(to_remove.length == 0) this.current.parentNode.removeChild(this.current);
	
	for(var i = 0; i < to_remove.length; i++){
	    Guppy.log("removing", to_remove[i]," from" , current_parent);
	    if(next == to_remove[i]) next = next.nextSibling;
	    current_parent.removeChild(to_remove[i]);
	}
	current_parent.insertBefore(left_piece, next);
	current_parent.insertBefore(f, next);
	current_parent.insertBefore(right_piece, next);
    }
    
    Guppy.log((new XMLSerializer()).serializeToString(this.base));
    Guppy.log(new_current);
    this.caret = 0;
    this.current = f;
    if(s['char']){
	this.current = this.current.nextSibling;
    }
    else this.down_from_f_to_blank();

    this.sel_clear();
    this.checkpoint();
    // if(new_current != null) {
    // 	if(new_current.firstChild == null) new_current.appendChild(this.base.createTextNode(""));
    // 	current = new_current;
    // }
    // else{ // WHEN COULD THIS HAPPEN--no children of an f?
    // 	current = right_piece;
    // }
    this.render(true);
    return true;
}

Guppy.prototype.sel_get = function(){
    //console.log("sel_start_end",this.sel_start,this.sel_end,this.current,this.caret,this.sel_status);
    if(this.sel_status == Guppy.SEL_NONE){
	// if(this.current.nodeName == 'f'){ // This block should be dead
	//     console.log("THIS SHOULD NEVER HAPPEN");
	//     Guppy.log("ABCD",this.current,this.current.previousSibling,this.current.parentNode);
	//     this.sel_start = {"node":this.current, "caret":this.current.previousSibling.firstChild.nodeValue.length};
	//     return {"node_list":[this.make_e(""),this.current,this.make_e("")],
	// 	    "remnant":this.make_e(this.current.previousSibling.firstChild.nodeValue + this.current.nextSibling.firstChild.nodeValue),
	// 	    "involved":[this.current.previousSibling, this.current, this.current.nextSibling]}
	// }
	// else
	return null;
    }
    var involved = [];
    var node_list = [];
    var remnant = null;

    if(this.sel_start.node == this.sel_end.node){
	return {"node_list":[this.make_e(this.sel_start.node.firstChild.nodeValue.substring(this.sel_start.caret, this.sel_end.caret))],
		"remnant":this.make_e(this.sel_start.node.firstChild.nodeValue.substring(0, this.sel_start.caret) + this.sel_end.node.firstChild.nodeValue.substring(this.sel_end.caret)),
		"involved":[this.sel_start.node]};
    }
    
    node_list.push(this.make_e(this.sel_start.node.firstChild.nodeValue.substring(this.sel_start.caret)));
    involved.push(this.sel_start.node);
    involved.push(this.sel_end.node);
    remnant = this.make_e(this.sel_start.node.firstChild.nodeValue.substring(0, this.sel_start.caret) + this.sel_end.node.firstChild.nodeValue.substring(this.sel_end.caret));
    var n = this.sel_start.node.nextSibling;
    while(n != null && n != this.sel_end.node){
	involved.push(n);
	node_list.push(n);
	n = n.nextSibling;
    }
    node_list.push(this.make_e(this.sel_end.node.firstChild.nodeValue.substring(0, this.sel_end.caret)));
    Guppy.log("NL",node_list);
    return {"node_list":node_list,
	    "remnant":remnant,
	    "involved":involved,
	    "cursor":0};
}

Guppy.prototype.print_selection = function(){
    var sel = this.sel_get();
    Guppy.log(sel);
    if(sel == null) return "[none]";
    var ans = "";
    ans += "node_list: \n";
    for(var i = 0; i < sel.node_list.length; i++){
	var n = sel.node_list[i];
	ans += (new XMLSerializer()).serializeToString(n) + "\n";
    }
    ans += "\ninvolved: \n";
    for(var i = 0; i < sel.involved.length; i++){
	var n = sel.involved[i];
	ans += (new XMLSerializer()).serializeToString(n) + "\n";
    }
    // ans += "\n remnant: \n";
    // ans += (new XMLSerializer()).serializeToString(sel.remnant) + "\n";
    Guppy.log(ans);
}

Guppy.prototype.make_e = function(text){
    var new_node = this.base.createElement("e");
    new_node.appendChild(this.base.createTextNode(text));
    return new_node;
}

Guppy.prototype.insert_string = function(s){
    if(this.sel_status != Guppy.SEL_NONE){
	this.sel_delete();
	this.sel_clear();
    }
    Guppy.log("ASD",this.caret,this.current,this.current.firstChild.nodeValue,s);
    this.current.firstChild.nodeValue = this.current.firstChild.nodeValue.splice(this.caret,s)
    this.caret += s.length;
    this.checkpoint();
    this.check_for_symbol();
    this.render(true);
}

Guppy.prototype.render = function(updated){
    var tex = this.render_node(this.base,"latex");
    Guppy.log(this.caret,"TEX", tex);
    katex.render(tex,this.editor);
    if(updated){
	this.recompute_locations_paths();
    }
}

Guppy.prototype.activate = function(){
    Guppy.active_guppy = this;
    this.editor_active = true;
    this.editor.className = this.editor.className.replace(new RegExp('(\\s|^)guppy_inactive(\\s|$)'),' guppy_active ');
    //this.editor.style.border='1px solid gray';
    this.editor.focus();
    if(this.ready){
	this.render();
    }
}

Guppy.prototype.deactivate = function(){
    this.editor_active = false;
    //this.editor.style.backgroundColor='#fafafa';
    var r = new RegExp('(\\s|^)guppy_active(\\s|$)');
    if(this.editor.className.match(r,' guppy_inactive ')){
	this.editor.className = this.editor.className.replace(r,' guppy_inactive ');
    }
    else{
	this.editor.className += ' guppy_inactive ';
    }
    //this.editor.style.border='1px solid black';
    Guppy.kb.shift_down = false;
    Guppy.kb.ctrl_down = false;
    Guppy.kb.alt_down = false;
    if(this.ready){
	this.render();
    }
}

Guppy.prototype.sel_copy = function(){
    var sel = this.sel_get();
    if(!sel) return;
    this.clipboard = [];
    for(var i = 0; i < sel.node_list.length; i++){
	this.clipboard.push(sel.node_list[i].cloneNode(true));
    }
    this.sel_clear();
}

Guppy.prototype.sel_cut = function(){
    var node_list = this.sel_delete();
    this.clipboard = [];
    for(var i = 0; i < node_list.length; i++){
	this.clipboard.push(node_list[i].cloneNode(true));
    }
    this.sel_clear();
    this.checkpoint();
}

Guppy.prototype.sel_paste = function(){
    this.sel_delete();
    this.sel_clear();
    if(!(this.clipboard) || this.clipboard.length == 0) return;
    var real_clipboard = [];
    for(var i = 0; i < this.clipboard.length; i++){
	real_clipboard.push(this.clipboard[i].cloneNode(true));
    }
    Guppy.log("CLIPBOARD",this.clipboard);
    Guppy.log("PASTING");
    
    if(real_clipboard.length == 1){
	Guppy.log("wimp");
	this.current.firstChild.nodeValue = this.current.firstChild.nodeValue.substring(0,this.caret) + real_clipboard[0].firstChild.nodeValue + this.current.firstChild.nodeValue.substring(this.caret);
	this.caret += real_clipboard[0].firstChild.nodeValue.length;
    }
    else{
	var nn = this.make_e(real_clipboard[real_clipboard.length-1].firstChild.nodeValue + this.current.firstChild.nodeValue.substring(this.caret));
	this.current.firstChild.nodeValue = this.current.firstChild.nodeValue.substring(0,this.caret) + real_clipboard[0].firstChild.nodeValue;
	if(this.current.nextSibling == null)
	    this.current.parentNode.appendChild(nn)
	else
	    this.current.parentNode.insertBefore(nn, this.current.nextSibling)
	Guppy.log(nn);
	for(var i = 1; i < real_clipboard.length - 1; i++)
	    this.current.parentNode.insertBefore(real_clipboard[i], nn);
	this.current = nn;
	this.caret = real_clipboard[real_clipboard.length-1].firstChild.nodeValue.length
    }
    this.checkpoint();
}

Guppy.prototype.sel_clear = function(){
    this.sel_start = null;    
    this.sel_end = null;
    this.sel_status = Guppy.SEL_NONE;
}

Guppy.prototype.sel_delete = function(){
    var sel = this.sel_get();
    if(!sel) return;
    sel_parent = sel.involved[0].parentNode;
    sel_prev = sel.involved[0].previousSibling;
    Guppy.log("SD", sel, "\nABC", sel.involved[0], sel_parent, sel_prev);
    for(var i = 0; i < sel.involved.length; i++){
	var n = sel.involved[i];
	sel_parent.removeChild(n);
    }
    if(sel_prev == null){
	Guppy.log("PREVN",sel);
	if(sel_parent.firstChild == null)
	    sel_parent.appendChild(sel.remnant);
	else
	    sel_parent.insertBefore(sel.remnant, sel_parent.firstChild);
    }
    else if(sel_prev.nodeName == 'f'){
	Guppy.log("PREVF",sel_prev.nextSibling);
	if(sel_prev.nextSibling == null)
	    sel_parent.appendChild(sel.remnant);
	else
	    sel_parent.insertBefore(sel.remnant, sel_prev.nextSibling);
    }
    this.current = sel.remnant
    this.caret = this.sel_start.caret;
    return sel.node_list;
}

//Functions for handling navigation and editing commands: 

Guppy.prototype.sel_right = function(){
    if(this.sel_status == Guppy.SEL_NONE){
	this.set_sel_start();
	this.sel_status = Guppy.SEL_CURSOR_AT_END;
    }
    //console.log("EEEE",this.caret,this.get_length(this.current));
    if(this.caret >= this.get_length(this.current)){
	var nn = this.current.nextSibling;
	if(nn != null){
	    this.current = nn.nextSibling;
	    this.caret = 0;
	    this.set_sel_boundary(Guppy.SEL_CURSOR_AT_END);
	    //console.log("asda");
	}
	else{
	    this.set_sel_boundary(Guppy.SEL_CURSOR_AT_END);
	    //console.log("at end while selecting");
	}
    }
    else{
	this.caret += 1;
	this.set_sel_boundary(Guppy.SEL_CURSOR_AT_END);
	//console.log("asdb");
    }
    //console.log("SS",this.sel_status, this.sel_start, this.sel_end);
    if(this.sel_start.node == this.sel_end.node && this.sel_start.caret == this.sel_end.caret){
	this.sel_status = Guppy.SEL_NONE;
    }
}

Guppy.prototype.set_sel_boundary = function(sstatus){
    if(this.sel_status == Guppy.SEL_NONE) this.sel_status = sstatus;
    if(this.sel_status == Guppy.SEL_CURSOR_AT_START)
	this.set_sel_start();
    else if(this.sel_status == Guppy.SEL_CURSOR_AT_END)
	this.set_sel_end();
}

Guppy.prototype.sel_left = function(){
    if(this.sel_status == Guppy.SEL_NONE){
	this.set_sel_end();
	this.sel_status = Guppy.SEL_CURSOR_AT_START;
    }
    Guppy.log("EEEE");
    if(this.caret <= 0){
	var nn = this.current.previousSibling;
	if(nn != null){
	    this.current = nn.previousSibling;
	    this.caret = this.current.firstChild.nodeValue.length;
	    this.set_sel_boundary(Guppy.SEL_CURSOR_AT_START);
	    Guppy.log("asdeee");
	}
	else{
	    this.set_sel_boundary(Guppy.SEL_CURSOR_AT_START);
	    Guppy.log("at start while selecting");
	}
    }
    else{
	this.caret -= 1;
	this.set_sel_boundary(Guppy.SEL_CURSOR_AT_START);
	Guppy.log("asdb");
    }
    Guppy.log("SS",this.sel_status, this.sel_start, this.sel_end);
    if(this.sel_start.node == this.sel_end.node && this.sel_start.caret == this.sel_end.caret){
	this.sel_status = Guppy.SEL_NONE;
    }
}

Guppy.prototype.right = function(){
    this.sel_clear();
    Guppy.log("R",this.current,this.caret);
    if(this.caret >= this.get_length(this.current)){
	var nn = this.next_node_from_e(this.current);
	if(nn != null){
	    this.current = nn;
	    this.caret = 0;
	}
	else{
	    if(this.right_callback) this.right_callback();
	    Guppy.log("at end or problem");
	}
    }
    else{
	this.caret += 1;
    }
    Guppy.log("R",this.current,this.current.parentNode,this.caret);
}

Guppy.prototype.get_length = function(n){
    if(Guppy.is_blank(n) || n.nodeName == 'f') return 0
    return n.firstChild.nodeValue.length;
    
}

Guppy.prototype.left = function(){
    this.sel_clear();
    Guppy.log("L",this.current,this.current.firstChild.nodeValue,this.caret);
    if(this.caret <= 0){
	var pn = this.prev_node_from_e(this.current);
	if(pn != null){
	    this.current = pn;
	    this.caret = this.current.firstChild.nodeValue.length;
	}
	else{
	    if(this.left_callback) this.left_callback();
	    Guppy.log("at beginnning or problem");
	}
    }
    else{
	this.caret -= 1;
    }
    Guppy.log(this.current,this.caret);
}

Guppy.prototype.delete_from_e = function(){
    // return false if we deleted something, and true otherwise.
    if(this.caret > 0){
	this.current.firstChild.nodeValue = this.current.firstChild.nodeValue.splicen(this.caret-1,"",1);
	this.caret--;
	Guppy.log("bk","|"+this.current.firstChild.nodeValue+"|",this.current.firstChild.nodeValue.length);
    }
    else{
	// The order of these is important
	if(this.current.previousSibling != null && this.current.previousSibling.getAttribute("c") == "yes"){
	    // The previous node is an f node but is really just a character.  Delete it.
	    this.current = this.current.previousSibling;
	    this.delete_from_f();
	}
	else if(this.current.previousSibling != null && this.current.previousSibling.nodeName == 'f'){
	    // We're in an e node just after an f node.  Move back into the f node (delete it?)
	    this.left();
	    return false;
	}
	else if(this.current.parentNode.previousSibling != null && this.current.parentNode.previousSibling.nodeName == 'c'){
	    // We're in a c child of an f node, but not the first one.  Go to the previous c
	    this.left();
	    return false;
	}
	else if(this.current.previousSibling == null && this.current.parentNode.nodeName == 'c' && (this.current.parentNode.previousSibling == null || this.current.parentNode.previousSibling.nodeName != 'c')){
	    // We're in the first c child of an f node and at the beginning--delete the f node
	    this.current = this.current.parentNode.parentNode;
	    this.delete_from_f();
	}
	else{
	    // We're at the beginning (hopefully!) 
	    Guppy.log("AT BEGINNING!");
	    return false;
	}
    }
    return true;
}

Guppy.prototype.delete_forward_from_e = function(){
    // return false if we deleted something, and true otherwise.
    if(this.caret < this.current.firstChild.nodeValue.length){
	this.current.firstChild.nodeValue = this.current.firstChild.nodeValue.splicen(this.caret,"",1);
	Guppy.log("del","|"+this.current.firstChild.nodeValue+"|",this.current.firstChild.nodeValue.length);
    }
    else{
	//We're at the end
	if(this.current.nextSibling != null){
	    // The next node is an f node.  Delete it.
	    this.current = this.current.nextSibling;
	    this.delete_from_f();
	}
	else if(this.current.parentNode.nodeName == 'c'){
	    // We're in a c child of an f node.  Do nothing
	    return false;
	}
    }
    return true;
}

Guppy.prototype.backspace = function(){
    if(this.sel_status != Guppy.SEL_NONE){
	this.sel_delete();
	this.sel_status = Guppy.SEL_NONE;
	this.checkpoint();
    }
    else if(this.delete_from_e()){
	this.checkpoint();
    }
}

Guppy.prototype.delete_key = function(){
    if(this.sel_status != Guppy.SEL_NONE){
	this.sel_delete();
	this.sel_status = Guppy.SEL_NONE;
	this.checkpoint();
    }
    else if(this.delete_forward_from_e()){
	this.checkpoint();
    }
}

Guppy.prototype.right_paren = function(){
    if(this.current.nodeName == 'e' && this.caret < this.current.firstChild.nodeValue.length - 1) return;
    else this.right();
}

Guppy.prototype.up = function(){
    this.sel_clear();
    if(this.current.parentNode.hasAttribute("up")){
	var t = parseInt(this.current.parentNode.getAttribute("up"));
	Guppy.log("TTT",t);
	var f = this.current.parentNode.parentNode;
	Guppy.log(f);
	var n = f.firstChild;
	while(n != null && t > 0){
	    if(n.nodeName == 'c') t--;
	    if(t > 0) n = n.nextSibling;
	}
	Guppy.log(n);
	this.current = n.lastChild;
	this.caret = this.current.firstChild.nodeValue.length;
    }
    // else{
    // 	if(current.parentNode.parentNode.nodeName == 'f'){
    // 	    current = current.parentNode.parentNode.previousSibling;
    // 	    caret = current.firstChild.nodeValue.length;
    // 	}
    // }
}

Guppy.prototype.down = function(){
    this.sel_clear();
    if(this.current.parentNode.hasAttribute("down")){
	var t = parseInt(this.current.parentNode.getAttribute("down"));
	Guppy.log("TTT",t);
	var f = this.current.parentNode.parentNode;
	Guppy.log(f);
	var n = f.firstChild;
	while(n != null && t > 0){
	    if(n.nodeName == 'c') t--;
	    if(t > 0) n = n.nextSibling;
	}
	Guppy.log(n);
	this.current = n.lastChild;
	this.caret = this.current.firstChild.nodeValue.length;
    }
}

Guppy.prototype.home = function(){
    while(this.current.previousSibling != null)
	this.current = this.current.previousSibling;
    this.caret = 0;
}

Guppy.prototype.end = function(){
    while(this.current.nextSibling != null)
	this.current = this.current.nextSibling;
    this.caret = this.current.firstChild.nodeValue.length;
}

Guppy.prototype.checkpoint = function(){
    this.current.setAttribute("current","yes");
    this.current.setAttribute("caret",this.caret.toString());
    //if(!overwrite) this.undo_now++;
    this.undo_now++;
    this.undo_data[this.undo_now] = this.base.cloneNode(true);
    this.undo_data.splice(this.undo_now+1, this.undo_data.length);
    this.current.removeAttribute("current");
    this.current.removeAttribute("caret");
}

Guppy.prototype.restore = function(t){
    Guppy.log("TTT",t);
    this.base = this.undo_data[t].cloneNode(true);
    Guppy.log((new XMLSerializer()).serializeToString(this.base));
    this.find_current();
    this.current.removeAttribute("current");
    this.current.removeAttribute("caret");
}

Guppy.prototype.find_current = function(){
    this.current = this.base.evaluate("//*[@current='yes']", this.base.documentElement, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    this.caret = parseInt(this.current.getAttribute("caret"));
}

Guppy.prototype.undo = function(){
    Guppy.log("UNDO");
    this.print_undo_data();
    if(this.undo_now <= 0) return;
    Guppy.log("UNDOING");
    this.undo_now--;
    this.restore(this.undo_now);
}

Guppy.prototype.redo = function(){
    Guppy.log("REDO");
    this.print_undo_data();
    if(this.undo_now >= this.undo_data.length-1) return;
    Guppy.log("REDOING");
    this.undo_now++;
    this.restore(this.undo_now);
}

Guppy.prototype.print_undo_data = function(){
    Guppy.log("UNDO DATA");
    Guppy.log(this.undo_now, this.undo_data.length);
    for(var i = 0; i < this.undo_data.length; i++){
	Guppy.log(i, (new XMLSerializer()).serializeToString(this.undo_data[i]));
    }
}

Guppy.prototype.done = function(s){
    this.done_callback();
}

Guppy.prototype.problem = function(s){
    Guppy.log(s);
    Guppy.log('b',(new XMLSerializer()).serializeToString(this.base));
    Guppy.log('c',(new XMLSerializer()).serializeToString(this.current));
}






// Keyboard stuff

Guppy.kb = {};

Guppy.kb.is_mouse_down = false;

Guppy.kb.CARET = "\\cursor[-0.2ex]{0.7em}"
Guppy.kb.TEMP_SMALL_CARET = "\\cursor[0em]{0.6em}"
Guppy.kb.TEMP_CARET = "\\cursor[-0.2ex]{0.7em}"
Guppy.kb.SMALL_CARET = "\\cursor[-0.05em]{0.5em}"
Guppy.kb.SEL_CARET = "\\cursor[-0.2ex]{0.7em}"
Guppy.kb.SMALL_SEL_CARET = "\\cursor[-0.05em]{0.5em}"
Guppy.kb.SEL_COLOR = "red"

Guppy.kb.symbols = {};

Guppy.prototype.is_blacklisted = function(symb_type){
    for(var i = 0; i < this.type_blacklist.length; i++)
	if(symb_type == this.type_blacklist[i]) return true;
    return false;
}

Guppy.symb_raw = function(symb_name,latex_symb,text_symb){
    Guppy.kb.symbols[symb_name] = {"output":{"latex":[latex_symb],
					     "text":[text_symb]},
				   "char":true,
				   "type":symb_name};
}

Guppy.symb_func = function(func_name){
    Guppy.kb.symbols[func_name] = {"output":{"latex":["\\"+func_name+"\\left(",1,"\\right)"],
					     "text":[func_name+"(",1,")"]},
				   "type":func_name
				  };
}

Guppy.prototype.check_for_symbol = function(){
    var instance = this;
    for(var s in Guppy.kb.symbols){
	// Guppy.log(current);
	if(instance.current.nodeName == 'e' && !(Guppy.is_blank(instance.current)) && instance.current.firstChild.nodeValue.search_at(instance.caret,s)){
	    //Guppy.log("INSERTION OF ",s);
	    //Guppy.log(current.nodeValue);
	    var temp = instance.current.firstChild.nodeValue;
	    var temp_caret = instance.caret;
	    instance.current.firstChild.nodeValue = instance.current.firstChild.nodeValue.slice(0,instance.caret-s.length)+instance.current.firstChild.nodeValue.slice(instance.caret);
	    //Guppy.log(current.nodeValue);
	    instance.caret -= s.length;
	    var success = instance.insert_symbol(s);
	    if(!success){
		instance.current.firstChild.nodeValue = temp;
		instance.caret = temp_caret;
	    }
	    break;
	}
    }
}

/* keyboard behaviour definitions */

// keys aside from 0-9,a-z,A-Z
Guppy.kb.k_chars = {
    "=":"=",
    "+":"+",
    "-":"-",
    "*":"*",
    ".":".",
    ",":",",
    "shift+/":"/",
    "shift+=":"+",
    "shift+1":"!"
};
Guppy.kb.k_syms = {
    "/":"slash",
    "shift+6":"exp",
    "shift+8":"*",
    "shift+9":"paren",
    "shift+,":"angle",
    "shift+-":"sub",
    "shift+\\":"abs",
    "shift+up":"exp",
    "shift+down":"sub"
};
Guppy.kb.k_controls = {
    "up":"up",
    "down":"down",
    "right":"right",
    "space":"right",
    "left":"left",
    "home":"home",
    "end":"end",
    "backspace":"backspace",
    "del":"delete_key",
    "mod+c":"sel_copy",
    "mod+x":"sel_cut",
    "mod+v":"sel_paste",
    "mod+z":"undo",
    "mod+y":"redo",
    "enter":"done",
    "shift+left":"sel_left",
    "shift+right":"sel_right",
    "shift+0":"right_paren"
};

// letters

for(var i = 65; i <= 90; i++){
    Guppy.kb.k_chars[String.fromCharCode(i).toLowerCase()] = String.fromCharCode(i).toLowerCase();
    Guppy.kb.k_chars['shift+'+String.fromCharCode(i).toLowerCase()] = String.fromCharCode(i).toUpperCase();
}

// numbers

for(var i = 48; i <= 57; i++)
    Guppy.kb.k_chars[String.fromCharCode(i)] = String.fromCharCode(i);

Guppy.register_keyboard_handlers = function(){
    Mousetrap.addKeycodes({173: '-'}); // Firefox's special minus (needed for _ = sub binding)
    for(var i in Guppy.kb.k_chars)
    	Mousetrap.bind(i,function(i){ return function(){
	    if(!Guppy.active_guppy) return true;
	    Guppy.active_guppy.temp_cursor.node = null;
	    Guppy.active_guppy.insert_string(Guppy.kb.k_chars[i]);
	    //Guppy.active_guppy.render(true);
	    return false;
	}}(i));  
    for(var i in Guppy.kb.k_syms)
    	Mousetrap.bind(i,function(i){ return function(){
	    if(!Guppy.active_guppy) return true;
	    Guppy.active_guppy.temp_cursor.node = null;
	    Guppy.active_guppy.insert_symbol(Guppy.kb.k_syms[i]);
	    //Guppy.active_guppy.render(true);
	    return false;
	}}(i));
    for(var i in Guppy.kb.k_controls)
    	Mousetrap.bind(i,function(i){ return function(){
	    if(!Guppy.active_guppy) return true;
	    Guppy.active_guppy[Guppy.kb.k_controls[i]]();
	    Guppy.active_guppy.temp_cursor.node = null;
	    Guppy.active_guppy.render(["up","down","right","left","home","end","sel_left","sel_right"].indexOf(i) < 0);
	    return false;
	}}(i));
    
}

Guppy.log = function(){
    if(!(Guppy.active_guppy) || Guppy.active_guppy.debug_mode == false) return;
    var s = "";
    for(var i = 0; i < arguments.length; i++){
	console.log(arguments[i]);
    }
}

module.exports = Guppy;
