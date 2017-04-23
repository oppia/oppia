start
  = messageFormatPattern

messageFormatPattern
  = st:(messageFormatElement/string/octothorpe)* {
      return { type: 'messageFormatPattern', statements: st };
    }

messageFormatElement
  = '{' _ argIdx:id efmt:(',' elementFormat)? _ '}' {
      var res = {
        type: "messageFormatElement",
        argumentIndex: argIdx
      };
      if (efmt && efmt.length) {
        res.elementFormat = efmt[1];
      } else {
        res.output = true;
      }
      return res;
    }

elementFormat
  = _ t:"plural" _ ',' _ s:pluralFormatPattern _ {
      return { type: "elementFormat", key: t, val: s };
    }
  / _ t:"selectordinal" _ ',' _ s:pluralFormatPattern _ {
      return { type: "elementFormat", key: t, val: s };
    }
  / _ t:"select" _ ',' _ s:selectFormatPattern _ {
      return { type: "elementFormat", key: t, val: s };
    }
  / _ t:id p:argStylePattern* {
      return { type: "elementFormat", key: t, val: p };
    }

pluralFormatPattern
  = op:offsetPattern? pf:(pluralForm)+ {
      return { type: "pluralFormatPattern", pluralForms: pf, offset: op || 0 };
    }

offsetPattern
  = _ "offset" _ ":" _ d:digits _ { return d; }

pluralForm
  = _ k:pluralKey _ "{" _ mfp:messageFormatPattern _ "}" {
      return { key: k, val: mfp };
    }

pluralKey
  = i:id { return i; }
  / "=" d:digits { return d; }

selectFormatPattern
  = pf:selectForm+ { return { type: "selectFormatPattern", pluralForms: pf }; }

selectForm
  = _ k:id _ "{" _ mfp:messageFormatPattern _ "}" {
      return { key: k, val: mfp };
    }

argStylePattern
  = _ "," _ p:id _ { return p; }

octothorpe
  = '#' { return {type: 'octothorpe'}; };

string
  = s:(chars/whitespace)+ { return { type: "string", val: s.join('') }; }

// This is a subset to keep code size down
// More or less, it has to be a single word
// that doesn't contain punctuation, etc
id "identifier"
  = _ s:$([0-9a-zA-Z$_][^ \t\n\r,.+={}]*) _ { return s; }

chars
  = chars:char+ { return chars.join(''); }

char
  = x:[^{}#\\\0-\x1F\x7f \t\n\r] { return x; }
  / "\\\\" { return "\\"; }
  / "\\#" { return "#"; }
  / "\\{" { return "\u007B"; }
  / "\\}" { return "\u007D"; }
  / "\\u" h1:hexDigit h2:hexDigit h3:hexDigit h4:hexDigit {
      return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4));
    }

digits
  = ds:[0-9]+ {
    //the number might start with 0 but must not be interpreted as an octal number
    //Hence, the base is passed to parseInt explicitely
    return parseInt((ds.join('')), 10);
  }

hexDigit
  = [0-9a-fA-F]

_ "whitespace"
  = w:whitespace* { return w.join(''); }

// Whitespace is undefined in the original JSON grammar, so I assume a simple
// conventional definition consistent with ECMA-262, 5th ed.
whitespace
  = [ \t\n\r]
