from core.domain import widget_domain
from extensions.value_generators.models import generators


class Link(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Link'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Link widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'url',
        'description': (
            'The URL for this link. It must start with http:// or https://'),
        'generator': generators.Copier,
        'init_args': {
            'disallow_parse_with_jinja': True
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'SanitizedUrl',
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'link'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert link'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder, generated with the
    # utils.convert_png_to_data_url() function.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqA'
        'AAABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXH'
        'JZTwAAADpSURBVCjPY/jPgB8y0EmBHXdWaeu7ef9r%0AHuaY50jU3J33v/VdVqkdN1SBE'
        'ZtP18T/L/7f/X/wf%2BO96kM3f9z9f%2BT/xP8%2BXUZsYAWGfsUfrr6L%0A2Ob9J/X/p'
        'P%2BV/1P/e/%2BJ2LbiYfEHQz%2BICV1N3yen%2B3PZf977/9z/Q//X/rf/7M81Ob3pu1'
        'EXWIFu%0AZvr7aSVBOx1/uf0PBEK3/46/gnZOK0l/r5sJVqCp6Xu99/2qt%2Bv%2BT/9f'
        '%2BL8CSK77v%2Bpt73vf65qa%0AYAVqzPYGXvdTvmR/z/4ZHhfunP0p%2B3vKF6/79gZq'
        'zPQLSYoUAABKPQ%2BkpVV/igAAAABJRU5ErkJg%0Agg%3D%3D%0A'
    )
