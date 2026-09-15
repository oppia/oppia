"""
    pygments.lexers.console
    ~~~~~~~~~~~~~~~~~~~~~~~

    Lexers for misc console output.

    :copyright: Copyright 2006-present by the Pygments team, see AUTHORS.
    :license: BSD, see LICENSE for details.
"""

from pygments.lexer import RegexLexer, include, bygroups, words
from pygments.token import Generic, Comment, String, Text, Keyword, Name, \
    Punctuation, Number, Whitespace

__all__ = ['VCTreeStatusLexer', 'PyPyLogLexer']


class VCTreeStatusLexer(RegexLexer):
    """
    For colorizing output of version control status commands, like "hg
    status" or "svn status".
    """
    name = 'VCTreeStatus'
    aliases = ['vctreestatus']
    filenames = []
    mimetypes = []
    url = ""
    version_added = '2.0'

    tokens = {
        'root': [
            (r'^A  \+  C\s+', Generic.Error),
            (r'^A\s+\+?\s+', String),
            (r'^M\s+', Generic.Inserted),
            (r'^C\s+', Generic.Error),
            (r'^D\s+', Generic.Deleted),
            (r'^[?!]\s+', Comment.Preproc),
            (r'      >\s+.*\n', Comment.Preproc),
            (r'\S+', Text),
            (r'\s+', Whitespace),
        ]
    }


class PyPyLogLexer(RegexLexer):
    """
    Lexer for PyPy log files.
    """
    name = "PyPy Log"
    aliases = ["pypylog", "pypy"]
    filenames = ["*.pypylog"]
    mimetypes = ['application/x-pypylog']
    url = 'pypy.org'
    version_added = '1.5'

    tokens = {
        "root": [
            (r"\[\w+\] \{jit-log-.*?$", Keyword, "jit-log"),
            (r"\[\w+\] \{jit-backend-counts$", Keyword, "jit-backend-counts"),
            include("extra-stuff"),
        ],
        "jit-log": [
            (r"\[\w+\] jit-log-.*?}$", Keyword, "#pop"),
            (r"^\+\d+: ", Comment),
            (r"--end of the loop--", Comment),
            (r"[ifp]\d+", Name),
            (r"ptr\d+", Name),
            (r"(\()(\w+(?:\.\w+)?)(\))",
             bygroups(Punctuation, Name.Builtin, Punctuation)),
            (r"[\[\]=,()]", Punctuation),
            (r"(\d+\.\d+|inf|-inf)", Number.Float),
            (r"-?\d+", Number.Integer),
            (r"'.*'", String),
            (r"(None|descr|ConstClass|ConstPtr|TargetToken)", Name),
            (r"<.*?>+", Name.Builtin),
            (r"(label|debug_merge_point|jump|finish)", Name.Class),
            (words(('int_add_ovf', 'int_add', 'int_sub_ovf', 'int_sub',
                    'int_mul_ovf', 'int_mul', 'int_floordiv',
                    'int_mod', 'int_lshift', 'int_rshift',
                    'int_and', 'int_or', 'int_xor', 'int_eq',
                    'int_ne', 'int_ge', 'int_gt', 'int_le',
                    'int_lt', 'int_is_zero', 'int_is_true',
                    'uint_floordiv', 'uint_ge', 'uint_lt',
                    'float_add', 'float_sub', 'float_mul',
                    'float_truediv', 'float_neg', 'float_eq',
                    'float_ne', 'float_ge', 'float_gt',
                    'float_le', 'float_lt', 'float_abs',
                    'ptr_eq', 'ptr_ne', 'instance_ptr_eq',
                    'instance_ptr_ne', 'cast_int_to_float',
                    'cast_float_to_int', 'force_token',
                    'quasiimmut_field', 'same_as',
                    'virtual_ref_finish', 'virtual_ref',
                    'mark_opaque_ptr', 'call_may_force',
                    'call_assembler', 'call_loopinvariant',
                    'call_release_gil', 'call_pure', 'call',
                    'new_with_vtable', 'new_array', 'newstr',
                    'newunicode', 'new', 'arraylen_gc',
                    'getarrayitem_gc_pure', 'getarrayitem_gc',
                    'setarrayitem_gc', 'getarrayitem_raw',
                    'setarrayitem_raw', 'getfield_gc_pure',
                    'getfield_gc', 'getinteriorfield_gc',
                    'setinteriorfield_gc', 'getfield_raw',
                    'setfield_gc', 'setfield_raw', 'strgetitem',
                    'strsetitem', 'strlen', 'copystrcontent',
                    'unicodegetitem', 'unicodesetitem',
                    'unicodelen', 'guard_true', 'guard_false',
                    'guard_value', 'guard_isnull',
                    'guard_nonnull_class', 'guard_nonnull',
                    'guard_class', 'guard_no_overflow',
                    'guard_not_forced', 'guard_no_exception',
                    'guard_not_invalidated')),
             Name.Builtin),
            include("extra-stuff"),
        ],
        "jit-backend-counts": [
            (r"\[\w+\] jit-backend-counts}$", Keyword, "#pop"),
            (r":", Punctuation),
            (r"\d+", Number),
            include("extra-stuff"),
        ],
        "extra-stuff": [
            (r"\s+", Whitespace),
            (r"#.*?$", Comment),
        ],
    }
