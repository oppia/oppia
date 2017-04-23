// dfn.js
// makes <dfn> elements link back to all uses of the term
// no copyright is asserted on this file

var dfnTimer = new Date();

var dfnMapTarget = -1;
var dfnMapDone = false;
var dfnMap = {};
function initDfn() {
  var links = [];
  dfnMapTarget = document.links.length;
  for (var i = 0; i < dfnMapTarget; i += 1)
    links[i] = document.links[i];
  var k = 0;
  var n = 0;
  var initDfnInternal = function () {
    n += 1;
    var start = new Date();
    while (k < dfnMapTarget) {
      if (links[k].hash.length > 1) {
        if (links[k].className != "no-backref" && links[k].parentNode.className != "no-backref") {
          var s = links[k].hash.substr(1);
          if (!(s in dfnMap))
            dfnMap[s] = [];
          dfnMap[s].push(links[k]);
        }
      }
      k += 1;
      if (new Date() - start > 1000) {
        setTimeout(initDfnInternal, 10000);
        return;
      }
    }
    dfnMapDone = true;
    document.body.className += " dfnEnabled";
    if (getCookie('profile') == '1')
      document.getElementsByTagName('h2')[0].textContent += '; dfn.js: ' + (new Date() - dfnTimer) + 'ms to do ' + dfnMapTarget + ' links in ' + n + ' loops';
  }
  initDfnInternal();
}

var dfnPanel;
var dfnUniqueId = 0;
var dfnTimeout;
document.addEventListener('click', dfnShow, false);
function dfnShow(event) {
  if (dfnTimeout) {
    clearTimeout(dfnTimeout);
    dfnTimeout = null;
  }
  if (dfnPanel) {
    dfnPanel.parentNode.removeChild(dfnPanel);
    dfnPanel = null;
  }
  if (dfnMapDone) {
    var node = event.target;
    while (node && (node.nodeType != event.target.ELEMENT_NODE || node.tagName != "DFN"))
      node = node.parentNode;
    if (node) {
      var panel = document.createElement('div');
      panel.className = 'dfnPanel';
      if (node.id) {
        var permalinkP = document.createElement('p');
        var permalinkA = document.createElement('a');
        permalinkA.href = '#' + node.id;
        permalinkA.textContent = '#' + node.id;
        permalinkP.appendChild(permalinkA);
        panel.appendChild(permalinkP);
      }
      var p = document.createElement('p');
      panel.appendChild(p);
      if (node.id in dfnMap || node.parentNode.id in dfnMap) {
        p.textContent = 'Referenced in:';
        var ul = document.createElement('ul');
        var lastHeader;
        var lastLi;
        var n;
        var sourceLinks = [];
        if (node.id in dfnMap)
          for (var i = 0; i < dfnMap[node.id].length; i += 1)
            sourceLinks.push(dfnMap[node.id][i]);
        if (node.parentNode.id in dfnMap)
          for (var i = 0; i < dfnMap[node.parentNode.id].length; i += 1)
            sourceLinks.push(dfnMap[node.parentNode.id][i]);
        for (var i = 0; i < sourceLinks.length; i += 1) {
          var link = sourceLinks[i];
          var header = dfnGetCaption(link);
          var a = document.createElement('a');
          if (!link.id)
            link.id = 'dfnReturnLink-' + dfnUniqueId++;
          a.href = '#' + link.id;
          if (header != lastHeader) {
            lastHeader = header;
            n = 1;
            var li = document.createElement('li');
            var cloneHeader = header.cloneNode(true);
            while (cloneHeader.hasChildNodes())
              a.appendChild(cloneHeader.firstChild);
            lastLi = li;
            li.appendChild(a);
            ul.appendChild(li);
          } else {
            n += 1;
            a.appendChild(document.createTextNode('(' + n + ')'));
            lastLi.appendChild(document.createTextNode(' '));
            lastLi.appendChild(a);
          }
        }
        panel.appendChild(ul);
      } else {
        p.textContent = 'No references in this file.';
      }
      node.appendChild(panel);
      dfnPanel = panel;
    }
  } else {
    dfnTimeout = setTimeout(dfnShow, 250, event);
  }
}

function dfnGetCaption(link) {
  var node = link;
  while (node) {
    if (node.nodeType == node.ELEMENT_NODE && node.tagName.match(/^H[1-6]$/)) {
      return node;
    } else if (!node.previousSibling) {
      node = node.parentNode;
    } else {
      node = node.previousSibling;
      if (node.nodeType == node.ELEMENT_NODE && node.className == "impl") {
        node = node.lastChild;
      }
    }
  }
  return null;
}

// setup (disabled for multipage copy)
if (document.getElementById('head'))
  initDfn();
