#!/bin/bash

set -e

if [ -z "$1" ]; then
  exec parallel "$0 {}" ::: win32
  # exec parallel "$0 {}" ::: win32 linux darwin
fi

npm run build -- --platform "$1"