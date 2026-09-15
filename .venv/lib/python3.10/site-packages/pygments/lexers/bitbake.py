"""
    pygments.lexers.bitbake
    ~~~~~~~~~~~~~~~~~~~~~~~

    Lexer for BitBake recipes, classes, includes and configuration files
    used by the Yocto Project / OpenEmbedded build system.

    :copyright: Copyright 2006-present by the Pygments team, see AUTHORS.
    :license: BSD, see LICENSE for details.
"""

import re

from pygments.lexer import RegexLexer, bygroups, include, using, words
from pygments.lexers.python import PythonLexer
from pygments.lexers.shell import BashLexer
from pygments.token import Comment, Keyword, Name, Operator, Punctuation, \
    String, Text, Whitespace

__all__ = ['BitBakeLexer']

# A bare BitBake identifier (variable, function or flag name). Allows the
# characters used by OE-Core variable names (digits, ``-``, ``.``, ``+``).
_IDENT = r'[A-Za-z_][A-Za-z0-9_\-.+]*'

# Optional OE override chain such as ``:append``, ``:remove``, ``:class-target``
# or ``:${PN}-doc``. Anchored so it only consumes ``:foo`` runs and never
# eats the leading ``:`` of the ``:=`` assignment operator.
_OVERRIDE = r'(?::[A-Za-z0-9_\-.+${}]+)*'

# All BitBake variable assignment operators, ordered so that the longer
# operators win the regex alternation.
_ASSIGN = r'(?:\?\?=|\?=|:=|\+=|=\+|\.=|=\.|=)'


class BitBakeLexer(RegexLexer):
    """
    Lexer for BitBake recipes, classes, includes and configuration files
    used by the Yocto Project and OpenEmbedded build system.
    """

    name = 'BitBake'
    url = 'https://docs.yoctoproject.org/bitbake/'
    aliases = ['bitbake']
    filenames = ['*.bbclass', '*.bbappend']
    mimetypes = ['text/x-bitbake']
    version_added = '2.21'

    flags = re.MULTILINE

    tokens = {
        'root': [
            (r'[ \t]+', Whitespace),
            (r'\n', Whitespace),
            (r'#.*$', Comment.Single),

            # ``python [name]() { ... }`` blocks (also ``fakeroot python``).
            # Must be tried before the generic shell function rule so the
            # ``python`` keyword is not mistaken for a shell function name.
            (r'(^(?:fakeroot[ \t]+)?)(python)((?:[ \t]+' + _IDENT + r')?)'
             r'([ \t]*\([ \t]*\)[ \t]*)(\{[ \t]*\n)'
             r'((?:.*\n)*?)'
             r'(^\}[ \t]*$)',
             bygroups(Keyword.Type, Keyword, Name.Function, Text,
                      Punctuation, using(PythonLexer), Punctuation)),

            # Shell task bodies: ``[fakeroot ]name[:override]() { ... }``.
            (r'(^(?:fakeroot[ \t]+)?)(' + _IDENT + r')(' + _OVERRIDE + r')'
             r'([ \t]*\([ \t]*\)[ \t]*)(\{[ \t]*\n)'
             r'((?:.*\n)*?)'
             r'(^\}[ \t]*$)',
             bygroups(Keyword.Type, Name.Function, Name.Decorator, Text,
                      Punctuation, using(BashLexer), Punctuation)),

            # Top-level python ``def`` blocks; the body is any run of
            # indented or blank lines following the signature.
            (r'^def[ \t]+' + _IDENT + r'[ \t]*\([^)]*\)[ \t]*:[ \t]*\n'
             r'(?:[ \t]+.*\n|\n)+',
             using(PythonLexer)),

            # ``inherit`` / ``inherit_defer`` / ``include`` / ``include_all`` /
            # ``require`` directives. Longer keywords are listed first so the
            # regex alternation does not match the shorter prefix.
            (r'^(inherit_defer|inherit|include_all|include|require)\b',
             Keyword.Namespace, 'include-line'),

            # ``addtask`` / ``deltask`` / ``addhandler`` / ``EXPORT_FUNCTIONS``.
            (r'^(addtask|deltask|addhandler|EXPORT_FUNCTIONS)\b',
             Keyword, 'statement'),

            # ``VAR[flag] = "value"`` (varflag assignment).
            (r'^(' + _IDENT + r')(\[)(' + _IDENT + r')(\])([ \t]*)('
             + _ASSIGN + r')',
             bygroups(Name.Variable, Punctuation, Name.Attribute,
                      Punctuation, Whitespace, Operator),
             'value'),

            # ``[export ]VAR[:override...] OP "value"`` assignments.
            (r'^(export[ \t]+)?(' + _IDENT + r')(' + _OVERRIDE + r')'
             r'([ \t]*)(' + _ASSIGN + r')',
             bygroups(Keyword.Type, Name.Variable, Name.Decorator,
                      Whitespace, Operator),
             'value'),

            # Anything else: consume runs of "boring" characters in one
            # token, then fall back to a single character if needed.
            (r'[^\s#${}\[\]:=+?.@\\"\']+', Text),
            (r'.', Text),
        ],

        'include-line': [
            (r'[ \t]+', Whitespace),
            (r'\\\n', Text),
            (r'\n', Whitespace, '#pop'),
            include('interp'),
            (r'[^\s$]+', String),
        ],

        'statement': [
            (r'[ \t]+', Whitespace),
            (r'\\\n', Text),
            (r'\n', Whitespace, '#pop'),
            (words(('after', 'before'), suffix=r'\b'), Keyword),
            include('interp'),
            (r'[^\s$\\]+', Name),
        ],

        'value': [
            (r'[ \t]+', Whitespace),
            (r'\\\n', String.Escape),
            (r'\n', Whitespace, '#pop'),
            (r'"', String.Double, 'string-double'),
            (r"'", String.Single, 'string-single'),
            include('interp'),
            (r'[^\s"\'$\\]+', String),
        ],

        'string-double': [
            (r'\\\n', String.Escape),
            (r'\\.', String.Escape),
            (r'"', String.Double, '#pop'),
            include('interp'),
            (r'[^"\\$]+', String.Double),
        ],

        'string-single': [
            (r'\\\n', String.Escape),
            (r'\\.', String.Escape),
            (r"'", String.Single, '#pop'),
            include('interp'),
            (r"[^'\\$]+", String.Single),
        ],

        'interp': [
            # ``${@ python expression }`` evaluated by BitBake at parse time.
            (r'\$\{@', String.Interpol, 'py-interp'),
            # ``${VAR}`` variable expansion.
            (r'(\$\{)([A-Za-z0-9_\-:.+/]+)(\})',
             bygroups(String.Interpol, Name.Variable, String.Interpol)),
        ],

        'py-interp': [
            (r'\}', String.Interpol, '#pop'),
            (r'[^}]+', using(PythonLexer)),
        ],
    }
