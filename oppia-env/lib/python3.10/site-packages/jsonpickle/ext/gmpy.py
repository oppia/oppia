try:
    import gmpy2 as gmpy
except ImportError:
    gmpy = None

from ..handlers import BaseHandler, register, unregister

__all__ = ['register_handlers', 'unregister_handlers']


class GmpyMPZHandler(BaseHandler):
    def flatten(self, obj, data):
        data['int'] = int(obj)
        return data

    def restore(self, data):
        return gmpy.mpz(data['int'])


def register_handlers():
    if gmpy is not None:
        register(gmpy.mpz, GmpyMPZHandler, base=True)


def unregister_handlers():
    if gmpy is not None:
        unregister(gmpy.mpz)
