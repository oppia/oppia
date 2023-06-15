#!/usr/bin/env bash
# Use this script to wait for a folder to be created

WAITFORIT_cmdname=${0##*/}
WAITFORIT_FOLDER=""

echoerr() { if [[ $WAITFORIT_QUIET -ne 1 ]]; then echo "$@" 1>&2; fi }

usage()
{
    cat << USAGE >&2
Usage:
    $WAITFORIT_cmdname [-f FOLDER] [-- COMMAND ARGS]
    -f FOLDER | --folder=FOLDER         Folder to wait for (path to folder)
    -- COMMAND ARGS                     Execute command with args after the folder is created
USAGE
    exit 1
}

wait_for() {
  if [[ $WAITFORIT_TIMEOUT -gt 0 ]]; then
      echoerr "$WAITFORIT_cmdname: waiting $WAITFORIT_TIMEOUT seconds for folder: $WAITFORIT_FOLDER"
  else
      echoerr "$WAITFORIT_cmdname: waiting for folder: $WAITFORIT_FOLDER without a timeout"
  fi
  WAITFORIT_start_ts=$(date +%s)
  while :
  do
      if [ -d "$WAITFORIT_FOLDER" ]; then
          WAITFORIT_end_ts=$(date +%s)
          echoerr "$WAITFORIT_cmdname: Folder $WAITFORIT_FOLDER is created after $((WAITFORIT_end_ts - WAITFORIT_start_ts)) seconds"
          break
      fi
      sleep 1
  done
}

# process arguments
while [[ $# -gt 0 ]]
do
    case "$1" in
        -f | --folder)
        WAITFORIT_FOLDER="$2"
        if [[ $WAITFORIT_FOLDER == "" ]]; then break; fi
        shift 2
        ;;
        --folder=*)
        WAITFORIT_FOLDER="${1#*=}"
        shift 1
        ;;
        --)
        shift
        WAITFORIT_CLI=("$@")
        break
        ;;
        --help)
        usage
        ;;
        *)
        echoerr "Unknown argument: $1"
        usage
        ;;
    esac
done

if [[ "$WAITFORIT_FOLDER" == "" ]]; then
    echoerr "Error: you need to provide a folder to wait for."
    usage
fi

wait_for

if [[ $WAITFORIT_CLI != "" ]]; then
    exec "${WAITFORIT_CLI[@]}"
fi
