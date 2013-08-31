from core.domain import widget_domain
from extensions.objects.models import objects
from extensions.value_generators.models import generators


class InteractiveIFrame(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'IFrame of arbitrary URL'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'An iframe for an arbitrary page that can pass strings to Oppia when '
        'events occur.')

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'childPageUrl',
        'description': 'The URL of the page to iframe.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString'
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.NormalizedString
    }]
