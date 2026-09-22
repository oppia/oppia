"""
    pygments.styles.night_owl
    ~~~~~~~~~~~~~~~~~~~~~~~~~

    Pygments version of the `Night Owl` theme by Sarah Drasner.
    Based on https://github.com/sdras/night-owl-vscode-theme.

    :copyright: Copyright 2006-present by the Pygments team, see AUTHORS.
    :license: BSD, see LICENSE for details.
"""

from pygments.style import Style
from pygments.token import Comment, Error, Generic, Keyword, Name, Number, \
    Operator, Punctuation, String, Text, Token, Whitespace


__all__ = ['NightOwlStyle']


# Night Owl color palette
background  = '#011627'
foreground  = '#d6deeb'
selection   = '#1d3b53'
cyan        = '#7fdbca'
blue        = '#82aaff'
purple      = '#c792ea'
green       = '#addb67'
yellow      = '#ecc48d'
orange      = '#f78c6c'
red         = '#ef5350'
comment     = '#637777'
pink        = '#ff869a'


class NightOwlStyle(Style):
    """
    Night Owl theme by Sarah Drasner.

    A theme for the night owls amongst us. Fine-tuned for those of us who
    like to code late into the night. Color choices have also taken into
    consideration what is accessible to those with color blindness and in
    low-light circumstances.

    Based on the VS Code Night Owl theme:
    https://github.com/sdras/night-owl-vscode-theme

    .. versionadded:: 2.21
    """

    name = 'night-owl'

    background_color = background
    highlight_color = selection
    line_number_color = comment
    line_number_background_color = background
    line_number_special_color = foreground
    line_number_special_background_color = selection

    styles = {
        Token:                  foreground,
        Whitespace:             foreground,
        Text:                   foreground,

        # Comments
        Comment:                'italic ' + comment,
        Comment.Multiline:      'italic ' + comment,
        Comment.Preproc:        cyan,
        Comment.Single:         'italic ' + comment,
        Comment.Special:        'italic ' + comment,

        # Keywords
        Keyword:                'italic ' + purple,
        Keyword.Constant:       'italic ' + purple,
        Keyword.Declaration:    'italic ' + purple,
        Keyword.Namespace:      'italic ' + purple,
        Keyword.Reserved:       'italic ' + purple,
        Keyword.Type:           cyan,

        # Names
        Name:                   foreground,
        Name.Attribute:         yellow,
        Name.Builtin:           cyan,
        Name.Builtin.Pseudo:    'italic ' + blue,
        Name.Class:             yellow,
        Name.Constant:          orange,
        Name.Decorator:         blue,
        Name.Entity:            orange,
        Name.Exception:         red,
        Name.Function:          blue,
        Name.Function.Magic:    cyan,
        Name.Label:             foreground,
        Name.Namespace:         foreground,
        Name.Other:             foreground,
        Name.Property:          cyan,
        Name.Tag:               pink,
        Name.Variable:          foreground,
        Name.Variable.Class:    yellow,
        Name.Variable.Global:   orange,
        Name.Variable.Instance: yellow,

        # Literals
        Number:                 orange,
        Number.Float:           orange,
        Number.Hex:             orange,
        Number.Integer:         orange,
        Number.Oct:             orange,

        # Strings
        String:                 green,
        String.Affix:           cyan,
        String.Char:            green,
        String.Doc:             'italic ' + comment,
        String.Escape:          yellow,
        String.Heredoc:         green,
        String.Interpol:        cyan,
        String.Other:           green,
        String.Regex:           cyan,
        String.Symbol:          cyan,

        # Operators
        Operator:               cyan,
        Operator.Word:          'italic ' + purple,

        # Punctuation
        Punctuation:            foreground,

        # Errors
        Error:                  red,

        # Generic tokens (used by diffs, prompts, etc.)
        Generic:                foreground,
        Generic.Deleted:        red,
        Generic.Emph:           'italic',
        Generic.Error:          red,
        Generic.Heading:        'bold ' + blue,
        Generic.Inserted:       green,
        Generic.Output:         comment,
        Generic.Prompt:         'bold ' + cyan,
        Generic.Strong:         'bold',
        Generic.EmphStrong:     'bold italic',
        Generic.Subheading:     'bold ' + cyan,
        Generic.Traceback:      red,
    }
