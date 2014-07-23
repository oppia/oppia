from core.domain import widget_domain
from extensions.value_generators.models import generators


class Parameter(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Parameter'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Parameter widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'param_name',
        'description': 'The name of the parameter to display.',
        'generator': generators.Copier,
        'init_args': { 'disallow_parse_with_jinja': True },
        'customization_args': { 'value': '' },
        'obj_type': 'UnicodeString',
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'parameter'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert parameter'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder, generated with the
    # utils.convert_png_to_data_url() function.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABmJLR0QApwCqAEHucFFJAAAACXBI%0AWXMAAAsTAAALEwEAmpwYAAAAB3RJTUUH3gYSB'
        'RM01yDKhwAAAAh0RVh0Q29tbWVudAD2zJa/AAAB%0AvklEQVQ4y7WSP2hTURTGf%2Be%2'
        'B92KiROtrqDgIkYA46FQ7CYqLTroILi7ipE7q%2BsCtg4KTSIfSSdCp%0AUAQpqKAgblL'
        'FEojFp%2B%2B1KfXfu3k0kr8m1yWtob5El37jd873495zDvTJ91yGKakuW42PnjvtKI78'
        '%0A6iJKIGVhWh1aXUMI3C5M6uJQgGm46alLrJ8p4Lz7CvffCMf2G66NQxd4GXL68gP9bK'
        'Nf/fWktG6c%0AO8SsAAtfBL/ChTvzWuImj42BdoenZN2xgQCAZofjtoJSBCJmESCbYhEg'
        't1PIZeXiUABwwFawFEEQ%0A6FLPOwzwOYaM/SenEiZ9FKDWhrWffOp5OeB8xoaHRbAULx'
        'IBvTVNAJSrcCpvyiu33OsCqykLbj6H%0AHzVeB0G0MHALvudOAVd0HaK6oBuG4ndhtgT1'
        'Nk/i2Dk7MtI0YVgBwE74/4QSmH4rzC0xIyJh2mJN%0ApDsfhpXVfH4vQVDZbE4CjDsKPm'
        'hIW50by8txtb/YH96cwcaJ%2Bp67B8BS8P4bta3hJEnfCd/d5XBV%0ACRkBqi0or3Pi5D'
        '396p8A33MpTGp27xt9ZCkOAhiDye5gbCWMCvyP8nl3gD/Ktuo3xdOkLYIZ6cMA%0AAAAA'
        'SUVORK5CYII%3D%0A'
    )
