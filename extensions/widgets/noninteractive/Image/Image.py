from core.domain import widget_domain
from extensions.value_generators.models import generators


class Image(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Image'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Image widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'image_id',
        'description': 'The id for this image.',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString',
    }]
