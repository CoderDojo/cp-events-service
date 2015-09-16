#! /bin/bash

ENVIRONMENT=$1
START=$2

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )";
FILE="$PROJECT_DIR/config/$ENVIRONMENT.env"

echo $PROJECT_DIR;
echo $FILE;

USAGE="Usage: ./start.sh <config> <startscript> [startscript_opts]..."

if [ ! -r $FILE ] ; then
    echo "config file not found: $1"
    echo $USAGE
    exit 1
fi

if [ ! -r $START ] ; then
    echo "start script not found: $2"
    echo $USAGE
    exit 1
fi

source $FILE

exec node $START $@
