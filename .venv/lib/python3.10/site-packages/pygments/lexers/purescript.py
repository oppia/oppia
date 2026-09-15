"""
    pygments.lexers.purescript
    ~~~~~~~~~~~~~~~~~~~~~~~~~~

    Lexer for the PureScript language.

    :copyright: Copyright 2006-present by the Pygments team, see AUTHORS.
    :license: BSD, see LICENSE for details.
"""

from pygments.lexer import RegexLexer, bygroups, default
from pygments.token import Comment, Operator, Keyword, Name, String, \
    Number, Punctuation, Whitespace
from pygments import unistring as uni

__all__ = ['PureScriptLexer']


class PureScriptLexer(RegexLexer):
    """
    A lexer for the PureScript language.
    """
    name = 'PureScript'
    url = 'https://www.purescript.org/'
    aliases = ['purescript', 'purs']
    filenames = ['*.purs']
    mimetypes = ['text/x-purescript']
    version_added = '2.21'

    reserved = ('ado', 'case', 'class', 'data', 'derive', 'do', 'else',
                'false', 'forall', 'foreign', 'if', 'in', 'infix[lr]?',
                'instance', 'let', 'newtype', 'of',
                'then', 'true', 'type', 'where', '_')

    tokens = {
        'root': [
            # Whitespace
            (r'\s+', Whitespace),
            # Single-line comments
            (r'--.*?$', Comment.Single),
            # Multi-line comments
            (r'\{-', Comment.Multiline, 'comment'),
            # Lexemes:
            #  Identifiers
            (r"\bimport(?!')\b", Keyword.Reserved, 'import'),
            (r"\bmodule(?!')\b", Keyword.Reserved, 'module'),
            (r'\b({})(?!\')\b'.format('|'.join(reserved)), Keyword.Reserved),
            # Typed holes
            (r'\?\w[\w\']*', Name.Variable),
            #  Character literal (before names to avoid confusion)
            (r"'[^\\]'", String.Char),
            #  Identifiers
            (r'^[_' + uni.Ll + r'][\w\']*', Name.Function),
            (r"[_" + uni.Ll + r"][\w']*", Name),
            (r'[' + uni.Lu + r'][\w\']*', Keyword.Type),
            #  Backtick operator
            (r'`', Punctuation),
            #  Operators
            (r'\\(?![' + uni.Sm + uni.So + uni.Sc +
             r':!#%&*.\\/?@^-]+)', Name.Function),  # lambda
            # Unicode operators
            (r'[∀→←⇒∷]', Operator.Word),
            (r'(<-|::|->|=>|=)(?![' + uni.Sm + uni.So + uni.Sc +
             r':!#%&*.\\/?@^-]+)', Operator.Word),
            (r':[' + uni.Sm + uni.So + uni.Sc +
             r':!#%&*.\\/?@^-]*', Keyword.Type),  # Constructor operators
            (r'[' + uni.Sm + uni.So + uni.Sc +
             r':!#%&*.\\/?@^-]+', Operator),  # Other operators
            #  Numbers
            (r'\d(_*\d)*_*e[+-]?\d(_*\d)*', Number.Float),
            (r'\d(_*\d)*\.\d(_*\d)*(_*e[+-]?\d(_*\d)*)?', Number.Float),
            (r'0x[\da-fA-F]+', Number.Hex),
            (r'\d(_*\d)*', Number.Integer),
            #  Character/String Literals
            (r"'", String.Char, 'character'),
            (r'"""', String, 'rawstring'),
            (r'"', String, 'string'),
            #  Special
            (r'[][(),;{}]', Punctuation),
        ],
        'import': [
            (r'\s+', Whitespace),
            # import X as Y
            (r'([' + uni.Lu + r'][\w.]*)(\s+)(as)(\s+)([' + uni.Lu + r'][\w.]*)',
             bygroups(Name.Namespace, Whitespace, Keyword, Whitespace, Name),
             '#pop'),
            # import X hiding (functions)
            (r'([' + uni.Lu + r'][\w.]*)(\s+)(hiding)(\s+)(\()',
             bygroups(Name.Namespace, Whitespace, Keyword, Whitespace,
                      Punctuation), 'funclist'),
            # import X (functions)
            (r'([' + uni.Lu + r'][\w.]*)(\s+)(\()',
             bygroups(Name.Namespace, Whitespace, Punctuation), 'funclist'),
            # 'as' after funclist: import X (foo) as Y
            (r'(as)(\s+)([' + uni.Lu + r'][\w.]*)',
             bygroups(Keyword, Whitespace, Name), '#pop'),
            # import X (bare module name, must start with uppercase)
            (r'[' + uni.Lu + r'][\w.]*', Name.Namespace, '#pop'),
            # pop when import is done
            default('#pop'),
        ],
        'module': [
            (r'\s+', Whitespace),
            (r'([' + uni.Lu + r'][\w.]*)(\s+)(\()',
             bygroups(Name.Namespace, Whitespace, Punctuation), 'funclist'),
            (r'[' + uni.Lu + r'][\w.]*', Name.Namespace, '#pop'),
            default('#pop'),
        ],
        'funclist': [
            (r'\s+', Whitespace),
            (r'(module)(\s+)([' + uni.Lu + r'][\w.]*)',
             bygroups(Keyword.Reserved, Whitespace, Name.Namespace)),
            (r"\b(class|type)(?!')\b", Keyword.Reserved),
            (r'[' + uni.Lu + r']\w*', Keyword.Type),
            (r'(_[\w\']+|[' + uni.Ll + r'][\w\']*)', Name.Function),
            (r'--.*?$', Comment.Single),
            (r'\{-', Comment.Multiline, 'comment'),
            (r',', Punctuation),
            (r'\.\.', Punctuation),
            (r'[' + uni.Sm + uni.So + uni.Sc +
             r':!#%&*.\\/?@^-]+', Operator),
            (r'\(', Punctuation, 'funclist'),
            (r'\)', Punctuation, '#pop'),
        ],
        'comment': [
            (r'[^-{}]+', Comment.Multiline),
            (r'\{-', Comment.Multiline, '#push'),
            (r'-\}', Comment.Multiline, '#pop'),
            (r'[-{}]', Comment.Multiline),
        ],
        'character': [
            (r"[^\\']'", String.Char, '#pop'),
            (r"\\", String.Escape, 'escape'),
            ("'", String.Char, '#pop'),
        ],
        'string': [
            (r'[^\\"]+', String),
            (r"\\", String.Escape, 'escape'),
            ('"', String, '#pop'),
        ],
        'rawstring': [
            (r'"""', String, '#pop'),
            (r'[^"]+', String),
            (r'"', String),
        ],
        'escape': [
            (r'[nrt"\'\\]', String.Escape, '#pop'),
            (r'x[\da-fA-F]{1,6}', String.Escape, '#pop'),
            # String gaps: backslash-whitespace-backslash
            (r'(\s+)(\\)', bygroups(Whitespace, String.Escape), '#pop'),
            # Invalid escape: pop back so the next char is handled normally
            default('#pop'),
        ],
    }
