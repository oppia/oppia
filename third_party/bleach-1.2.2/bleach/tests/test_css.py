from functools import partial

from nose.tools import eq_

from bleach import clean


clean = partial(clean, tags=['p'], attributes=['style'])


def test_allowed_css():
    tests = (
        ('font-family: Arial; color: red; float: left; '
         'background-color: red;', 'color: red;', ['color']),
        ('border: 1px solid blue; color: red; float: left;', 'color: red;',
         ['color']),
        ('border: 1px solid blue; color: red; float: left;',
         'color: red; float: left;', ['color', 'float']),
        ('color: red; float: left; padding: 1em;', 'color: red; float: left;',
         ['color', 'float']),
        ('color: red; float: left; padding: 1em;', 'color: red;', ['color']),
        ('cursor: -moz-grab;', 'cursor: -moz-grab;', ['cursor']),
        ('color: hsl(30,100%,50%);', 'color: hsl(30,100%,50%);', ['color']),
        ('color: rgba(255,0,0,0.4);', 'color: rgba(255,0,0,0.4);', ['color']),
        ("text-overflow: ',' ellipsis;", "text-overflow: ',' ellipsis;",
         ['text-overflow']),
        ('text-overflow: "," ellipsis;', 'text-overflow: "," ellipsis;',
         ['text-overflow']),
        ('font-family: "Arial";', 'font-family: "Arial";', ['font-family']),
    )

    p_single = '<p style="%s">bar</p>'
    p_double = "<p style='%s'>bar</p>"

    def check(i, o, s):
        if '"' in i:
            eq_(p_double % o, clean(p_double % i, styles=s))
        else:
            eq_(p_single % o, clean(p_single % i, styles=s))

    for i, o, s in tests:
        yield check, i, o, s


def test_valid_css():
    """The sanitizer should fix missing CSS values."""
    styles = ['color', 'float']
    eq_('<p style="float: left;">foo</p>',
        clean('<p style="float: left; color: ">foo</p>', styles=styles))
    eq_('<p style="">foo</p>',
        clean('<p style="color: float: left;">foo</p>', styles=styles))


def test_style_hang():
    """The sanitizer should not hang on any inline styles"""
    # TODO: Neaten this up. It's copypasta from MDN/Kuma to repro the bug
    style = ("""margin-top: 0px; margin-right: 0px; margin-bottom: 1.286em; """
             """margin-left: 0px; padding-top: 15px; padding-right: 15px; """
             """padding-bottom: 15px; padding-left: 15px; border-top-width: """
             """1px; border-right-width: 1px; border-bottom-width: 1px; """
             """border-left-width: 1px; border-top-style: dotted; """
             """border-right-style: dotted; border-bottom-style: dotted; """
             """border-left-style: dotted; border-top-color: rgb(203, 200, """
             """185); border-right-color: rgb(203, 200, 185); """
             """border-bottom-color: rgb(203, 200, 185); border-left-color: """
             """rgb(203, 200, 185); background-image: initial; """
             """background-attachment: initial; background-origin: initial; """
             """background-clip: initial; background-color: """
             """rgb(246, 246, 242); overflow-x: auto; overflow-y: auto; """
             """font: normal normal normal 100%/normal 'Courier New', """
             """'Andale Mono', monospace; background-position: initial """
             """initial; background-repeat: initial initial;""")
    html = '<p style="%s">Hello world</p>' % style
    styles = [
        'border', 'float', 'overflow', 'min-height', 'vertical-align',
        'white-space',
        'margin', 'margin-left', 'margin-top', 'margin-bottom', 'margin-right',
        'padding', 'padding-left', 'padding-top', 'padding-bottom', 'padding-right',
        'background',
        'background-color',
        'font', 'font-size', 'font-weight', 'text-align', 'text-transform',
    ]

    expected = ("""<p style="margin-top: 0px; margin-right: 0px; """
                """margin-bottom: 1.286em; margin-left: 0px; padding-top: """
                """15px; padding-right: 15px; padding-bottom: 15px; """
                """padding-left: 15px; background-color: """
                """rgb(246, 246, 242); font: normal normal normal """
                """100%/normal 'Courier New', 'Andale Mono', monospace;">"""
                """Hello world</p>""")

    result = clean(html, styles=styles)
    eq_(expected, result)
