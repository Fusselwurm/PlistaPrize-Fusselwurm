#!/bin/bash
JASMINEBIN="`dirname $0`/../../jasmine-node/bin/jasmine-node"
TESTDIR="."
if [[ $1 != "" ]]; then
	TESTDIR=$1
fi
echo $JASMINEBIN
node $JASMINEBIN  $TESTDIR

