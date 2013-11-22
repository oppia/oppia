from core.domain import widget_domain
from extensions.value_generators.models import generators


class Hints(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Hints'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Hints widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'hint_placeholder',
        'description': 'The placeholder for the hint box.',
        'generator': generators.Copier,
        'init_args': {
            'disallow_parse_with_jinja': True,
            'large_input': True,
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'Html',
    }, {
        'name': 'low_hint',
        'description': 'The low level hint.',
        'generator': generators.Copier,
        'init_args': {
            'disallow_parse_with_jinja': True,
            'large_input': True,
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'Html',
    }, {
        'name': 'medium_hint',
        'description': 'The medium level hint.',
        'generator': generators.Copier,
        'init_args': {
            'disallow_parse_with_jinja': True,
            'large_input': True,
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'Html',
    }, {
        'name': 'high_hint',
        'description': 'The high level hint.',
        'generator': generators.Copier,
        'init_args': {
            'disallow_parse_with_jinja': True,
            'large_input': True,
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'Html',
    }]

    # The HTML tag name for this non-interactive widget.
    frontend_name = 'hints'
    # The tooltip for the icon in the rich-text editor.
    tooltip = 'Insert hints'
    # The icon to show in the rich-text editor. This is a representation of the
    # .png file in this widget folder.
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1%2BjfqA'
        'AAABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXH'
        'JZTwAAADoSURBVBgZBcExblNBGAbA2ceegTRBuIKO%0AgiihSZNTcC5LUHAihNJR0kGKC'
        'DcYJY6D3/77MdOinTvzAgCw8ysThIvn/VojIyMjIyPP%2BbS1sUQI%0AV2s95pBDDvmbP'
        '/mdkft83tpYguZq5Jh/OeaYh%2Byzy8hTHvNlaxNNczm%2Bla9OTlar1UdA/%2BC2A4tr'
        '%0ARCnD3jS8BB1obq2Gk6GU6QbQAS4BUaYSQAf4bhhKKTFdAzrAOwAxEUAH%2BKEM01SY'
        '3gM6wBsEAQB0%0AgJ%2BmaZoC3gI6iPYaAIBJsiRmHU0AALOeFC3aK2cWAACUXe7%2BAw'
        'O0lc9eTHYTAAAAAElFTkSuQmCC%0A'
    )
