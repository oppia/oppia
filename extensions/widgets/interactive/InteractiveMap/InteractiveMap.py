from core.domain import widget_domain
from extensions.objects.models import objects
from extensions.value_generators.models import generators


class InteractiveMap(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Interactive map'

    # The category the widget falls under in the widget repository.
    category = 'Custom'

    # A description of the widget.
    description = (
        'A map input widget for users to specify a position.')

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'latitude',
        'description': 'Starting map center latitude (-90 to 90).',
        'generator': generators.RangeRestrictedCopier,
        'init_args': {
            'min_value': -90.0,
            'max_value': 90.0
        },
        'customization_args': {
            'value': 0.0
        },
        'obj_type': 'Real'
    }, {
        'name': 'longitude',
        'description': 'Starting map center longitude (-180 to 180).',
        'generator': generators.RangeRestrictedCopier,
        'init_args': {
            'min_value': -180.0,
            'max_value': 180.0
        },
        'customization_args': {
            'value': 0.0
        },
        'obj_type': 'Real'
    }, {
        'name': 'zoom',
        'description': 'Starting map zoom level (0 shows the entire earth).',
        'generator': generators.Copier,
        'init_args': {},
        'customization_args': {
            'value': 0.0
        },
        'obj_type': 'Real'
    }]

    # Actions that the reader can perform on this widget which trigger a
    # feedback interaction, and the associated input types. Interactive widgets
    # must have at least one of these. This attribute name MUST be prefixed by
    # '_'.
    _handlers = [{
        'name': 'submit', 'input_type': objects.CoordTwoDim
    }]
