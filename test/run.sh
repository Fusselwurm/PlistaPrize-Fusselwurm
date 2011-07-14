#!/bin/bash
JASMINEBIN="`dirname $0`/../../jasmine-node/bin/jasmine-node"
echo $JASMINEBIN
node $JASMINEBIN  .

