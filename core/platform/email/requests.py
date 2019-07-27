import urllib2
from base64 import b64encode


def _auth_str(username, password):
    if isinstance(username, unicode):
        username = username.encode('latin1')
    if isinstance(password, unicode):
        password = password.encode('latin1')

    return 'Basic ' + b64encode(b':'.join((username, password))).strip()


def _auth_header(username, password):
    assert isinstance(username, basestring)
    assert isinstance(password, basestring)

    auth_str = _auth_str(username, password)
    return {'Authorization': auth_str}

def post(server, auth, data):
    headers = _auth_header(*auth)
    req = urllib2.Request(server, data, headers)
    response = urllib2.urlopen(req)
