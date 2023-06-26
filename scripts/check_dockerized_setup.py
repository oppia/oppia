from core import feconf

def main() -> None:
    if feconf.OPPIA_IS_DOCKERIZED :
      print('Running in Docker container.')
    else :
      print('Running using python scripts')

    print('REDISHOST: ', feconf.REDISHOST)
    print('ES_HOST: ', feconf.ES_HOST)
    print('Datastore: ', feconf.CLOUD_DATASTORE_EMULATOR_HOST)


# The 'no coverage' pragma is used as this line is un-testable. This is because
# it will only be called when clean.py is used as a script.
if __name__ == '__main__': # pragma: no cover
    main()
