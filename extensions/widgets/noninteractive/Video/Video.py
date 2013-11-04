from core.domain import widget_domain
from extensions.value_generators.models import generators


class Video(widget_domain.BaseWidget):
    """Definition of a widget.

    Do NOT make any changes to this widget definition while the Oppia app is
    running, otherwise things will break.

    This class represents a widget, whose id is the name of the class. It is
    auto-discovered when the default widgets are refreshed.
    """

    # The human-readable name of the widget.
    name = 'Video'

    # The category the widget falls under in the widget repository.
    category = 'Basic Input'

    # A description of the widget.
    description = (
        'Video widget.'
    )

    # Customization parameters and their descriptions, types and default
    # values. This attribute name MUST be prefixed by '_'.
    _params = [{
        'name': 'video_id',
        'description': 'The id for this video.',
        'generator': generators.Copier,
        'init_args': {
            'disallow_parse_with_jinja': True
        },
        'customization_args': {
            'value': ''
        },
        'obj_type': 'UnicodeString',
    }]

    frontend_name = 'video'
    tooltip = 'Insert video'
    icon_data_url = (
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAA'
        'ABGdBTUEAAK/INwWK6QAAABl0RVh0%0AU29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZ'
        'TwAAAIfSURBVDjLpZNPaBNBGMXfbrubzBqbg4kL%0A0lJLgiVKE/AP6Kl6UUFQNAeDIAj'
        'VS08aELx59GQPAREV/4BeiqcqROpRD4pUNCJSS21OgloISWME%0AZ/aPb6ARdNeTCz92m'
        'O%2B9N9/w7RphGOJ/nsH%2Bolqtvg%2BCYJR8q9VquThxuVz%2BoJTKeZ63Uq/XC38E%0'
        'A0Jj3ff8%2BOVupVGLbolkzQw5HOqAxQU4wXWWnZrykmYD0QsgAOJe9hpEUcPr8i0GaJ8'
        'n2vs/sL2h8%0AR66TpVfWTdETHWE6GRGKjGiiKNLii5BSLpN7pBHpgMYhMkm8tPUWz3sL'
        '2D1wFaY/jvnWcTTaE5Dy%0AjMfTT5J0XIAiTRYn3ASwZ1MKbTmN7z%2BKaHUOYqmb1fcP'
        'iNa4kQBuyvWAHYfcHGzDgYcx9NKrwJYH%0ACAyF21JiPWBnXMAQOea6bmn%2B4ueYGZi8'
        'gtymNVobF7BG5prNpjd%2BeW6X4BSUD0gOdCpzA8MpA/v2%0Av15kl4%2BpK0emwHSbjJ'
        'GBlz%2BvYM1fQeDrYOBTdzOGvDf6EFNr%2BLYjHbBgsaCLxr%2BmoNQjU2vYhRXp%0AgI'
        'UOmSWWnsJRfjlOZhrexgtYDZ/gWbetNRbNs6QT10GJglNk64HMaGgbAkoMo5fiFNy7CKD'
        'QUGqE%0A5r38YktxAfSqW7Zt33l66WtkAkACjuNsaLVaDxlw5HdJ/86aYrG4WCgUZD6fX'
        '%2Bjv/U0ymfxoWVZo%0AmuZyf%2B8XqfGP49CCrBUAAAAASUVORK5CYII%3D%0A'
    )
