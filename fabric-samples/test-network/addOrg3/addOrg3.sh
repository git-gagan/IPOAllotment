#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This script extends the Hyperledger Fabric test network by adding
# adding a third organization to the network
#

# prepending $PWD/../bin to PATH to ensure we are picking up the correct binaries
# this may be commented out to resolve installed version of tools if desired
export PATH=${PWD}/../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}
export VERBOSE=false

. ../scripts/utils.sh

: ${CONTAINER_CLI:="docker"}
: ${CONTAINER_CLI_COMPOSE:="${CONTAINER_CLI}-compose"}
infoln "Using ${CONTAINER_CLI} and ${CONTAINER_CLI_COMPOSE}"


# Print the usage message
function printHelp () {
  echo "Usage: "
  echo "  addOrg3.sh up|down|generate [-c <channel name>] [-t <timeout>] [-d <delay>] [-f <docker-compose-file>] [-s <dbtype>]"
  echo "  addOrg3.sh -h|--help (print this message)"
  echo "    <mode> - one of 'up', 'down', or 'generate'"
  echo "      - 'up' - add org3 to the sample network. You need to bring up the test network and create a channel first."
  echo "      - 'down' - bring down the test network and org3 nodes"
  echo "      - 'generate' - generate required certificates and org definition"
  echo "    -c <channel name> - test network channel name (defaults to \"mychannel\")"
  echo "    -ca <use CA> -  Use a CA to generate the crypto material"
  echo "    -t <timeout> - CLI timeout duration in seconds (defaults to 10)"
  echo "    -d <delay> - delay duration in seconds (defaults to 3)"
  echo "    -s <dbtype> - the database backend to use: goleveldb (default) or couchdb"
  echo "    -verbose - verbose mode"
  echo
  echo "Typically, one would first generate the required certificates and "
  echo "genesis block, then bring up the network. e.g.:"
  echo
  echo "	addOrg3.sh generate"
  echo "	addOrg3.sh up"
  echo "	addOrg3.sh up -c mychannel -s couchdb"
  echo "	addOrg3.sh down"
  echo
  echo "Taking all defaults:"
  echo "	addOrg3.sh up"
  echo "	addOrg3.sh down"
}

# We use the cryptogen tool to generate the cryptographic material
# (x509 certs) for the new org.  After we run the tool, the certs will
# be put in the organizations folder with org1 and org2

# Create Organziation crypto material using cryptogen or CAs
function generateOrg3() {
  # Create crypto material using cryptogen
  if [ "$CRYPTO" == "cryptogen" ]; then
    which cryptogen
    if [ "$?" -ne 0 ]; then
      fatalln "cryptogen tool not found. exiting"
    fi
    infoln "Generating certificates using cryptogen tool"

    infoln "Creating Org3 Identities"

    set -x
    cryptogen generate --config=org3-crypto.yaml --output="../organizations"
    res=$?
    { set +x; } 2>/dev/null
    if [ $res -ne 0 ]; then
      fatalln "Failed to generate certificates..."
    fi

  fi

  # Create crypto material using Fabric CA
  if [ "$CRYPTO" == "Certificate Authorities" ]; then
    fabric-ca-client version > /dev/null 2>&1
    if [[ $? -ne 0 ]]; then
      echo "ERROR! fabric-ca-client binary not found.."
      echo
      echo "Follow the instructions in the Fabric docs to install the Fabric Binaries:"
      echo "https://hyperledger-fabric.readthedocs.io/en/latest/install.html"
      exit 1
    fi

    infoln "Generating certificates using Fabric CA"
    ${CONTAINER_CLI_COMPOSE} -f ${COMPOSE_FILE_CA_BASE} -f $COMPOSE_FILE_CA_ORG3 up -d 2>&1

    infoln "\n==================================================\n"
    . fabric-ca/registerEnroll.sh
    infoln "\n==================================================\n"

    sleep 10

    infoln "Creating Org3 Identities"
    createOrg3

  fi

  infoln "Generating CCP files for Org3"
  ./ccp-generate.sh
}

# Generate channel configuration transaction
function generateOrg3Definition() {
  which configtxgen
  if [ "$?" -ne 0 ]; then
    fatalln "configtxgen tool not found. exiting"
  fi
  infoln "Generating Org3 organization definition"
  export FABRIC_CFG_PATH=$PWD
  set -x
  configtxgen -printOrg Org3MSP > ../organizations/peerOrganizations/org3.example.com/org3.json
  res=$?
  { set +x; } 2>/dev/null
  if [ $res -ne 0 ]; then
    fatalln "Failed to generate Org3 organization definition..."
  fi
}

function Org3Up () {
  # start org3 nodes

  if [ "$CONTAINER_CLI" == "podman" ]; then
    cp ../podman/core.yaml ../../organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/
  fi

  if [ "${DATABASE}" == "couchdb" ]; then
    DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} -f ${COMPOSE_FILE_BASE} -f $COMPOSE_FILE_ORG3 -f ${COMPOSE_FILE_COUCH_BASE} -f $COMPOSE_FILE_COUCH_ORG3 up -d 2>&1
  else
    DOCKER_SOCK=${DOCKER_SOCK} ${CONTAINER_CLI_COMPOSE} -f ${COMPOSE_FILE_BASE} -f $COMPOSE_FILE_ORG3 up -d 2>&1
  fi
  if [ $? -ne 0 ]; then
    fatalln "ERROR !!!! Unable to start Org3 network"
  fi
}

# Generate the needed certificates, the genesis block and start the network.
function addOrg3 () {
  # If the test network is not up, abort
  if [ ! -d ../organizations/ordererOrganizations ]; then
    fatalln "ERROR: Please, run ./network.sh up createChannel first."
  fi

  # generate artifacts if they don't exist
  if [ ! -d "../organizations/peerOrganizations/org3.example.com" ]; then
    generateOrg3
    generateOrg3Definition
  fi

  infoln "Bringing up Org3 peer"
  Org3Up

  # Use the CLI container to create the configuration transaction needed to add
  # Org3 to the network
  infoln "Generating and submitting config tx to add Org3"
  ${CONTAINER_CLI} exec cli ./scripts/org3-scripts/updateChannelConfig.sh $CHANNEL_NAME $CLI_DELAY $CLI_TIMEOUT $VERBOSE
  if [ $? -ne 0 ]; then
    fatalln "ERROR !!!! Unable to create config tx"
  fi

  infoln "Joining Org3 peers to network"
  ${CONTAINER_CLI} exec cli ./scripts/org3-scripts/joinChannel.sh $CHANNEL_NAME $CLI_DELAY $CLI_TIMEOUT $VERBOSE
  if [ $? -ne 0 ]; then
    fatalln "ERROR !!!! Unable to join Org3 peers to network"
  fi
}

# Tear down running network
function networkDown () {
    cd ..
    ./network.sh down
}

## Call the script to deploy a chaincode to the channel
function deployCC() {
  export PATH=${PWD}/../../bin:$PATH
  export FABRIC_CFG_PATH=$PWD/../../config/
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org3MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/../organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=${PWD}/../organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
  export CORE_PEER_ADDRESS=localhost:11051
  infoln "Inside Deploy CC...."
  # scripts/deployCC.sh $CHANNEL_NAME $CC_NAME $CC_SRC_PATH $CC_SRC_LANGUAGE $CC_VERSION $CC_SEQUENCE $CC_INIT_FCN $CC_END_POLICY $CC_COLL_CONFIG $CLI_DELAY $MAX_RETRY $VERBOSE
  peer lifecycle chaincode package ipo.tar.gz --path ../../ipo-settlement/javascript-chaincode/ --lang node  --label ipo_1
  infoln "CC packaged.."
  peer lifecycle chaincode install ipo.tar.gz
  PACKAGE_ID=$(peer lifecycle chaincode calculatepackageid ${CC_NAME}.tar.gz)
  infoln "CC installed.."
  infoln "Got package id ${PACKAGE_ID} !"
  peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/../organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID mychannel --name ipo --version 1 --package-id $PACKAGE_ID --sequence 1 --init-required
  infoln "Approved for Organization"

  if [ $? -ne 0 ]; then
    fatalln "Deploying chaincode failed"
  fi
}

# Using crpto vs CA. default is cryptogen
CRYPTO="cryptogen"
# timeout duration - the duration the CLI should wait for a response from
# another container before giving up
CLI_TIMEOUT=10
#default for delay
CLI_DELAY=3
# channel name defaults to "mychannel"
CHANNEL_NAME="mychannel"
# chaincode language defaults to "NA"
CC_SRC_LANGUAGE="NA"
# chaincode name defaults to "NA"
CC_NAME="NA"
# chaincode path defaults to "NA"
CC_SRC_PATH="NA"
# endorsement policy defaults to "NA". This would allow chaincodes to use the majority default policy.
CC_END_POLICY="NA"
# collection configuration defaults to "NA"
CC_COLL_CONFIG="NA"
# chaincode init function defaults to "NA"
CC_INIT_FCN="NA"
# use this as the docker compose couch file
COMPOSE_FILE_COUCH_BASE=compose/compose-couch-org3.yaml
COMPOSE_FILE_COUCH_ORG3=compose/${CONTAINER_CLI}/docker-compose-couch-org3.yaml
# use this as the default docker-compose yaml definition
COMPOSE_FILE_BASE=compose/compose-org3.yaml
COMPOSE_FILE_ORG3=compose/${CONTAINER_CLI}/docker-compose-org3.yaml
# certificate authorities compose file
COMPOSE_FILE_CA_BASE=compose/compose-ca-org3.yaml
COMPOSE_FILE_CA_ORG3=compose/${CONTAINER_CLI}/docker-compose-ca-org3.yaml
# chaincode init function defaults to "NA"
CC_INIT_FCN="NA"
# Chaincode version
CC_VERSION="1.0"
# Chaincode definition sequence
CC_SEQUENCE=1
# database
DATABASE="leveldb"

# Get docker sock path from environment variable
SOCK="${DOCKER_HOST:-/var/run/docker.sock}"
DOCKER_SOCK="${SOCK##unix://}"

# Parse commandline args

## Parse mode
if [[ $# -lt 1 ]] ; then
  printHelp
  exit 0
else
  MODE=$1
  shift
fi

# parse flags

while [[ $# -ge 1 ]] ; do
  key="$1"
  case $key in
  -h )
    printHelp
    exit 0
    ;;
  -c )
    CHANNEL_NAME="$2"
    shift
    ;;
  -ca )
    CRYPTO="Certificate Authorities"
    ;;
  -t )
    CLI_TIMEOUT="$2"
    shift
    ;;
  -ccn )
    CC_NAME="$2"
    shift
    ;;
  -ccp )
    CC_SRC_PATH="$2"
    shift
    ;;
  -ccl )
    CC_SRC_LANGUAGE="$2"
    shift
    ;;
  -cci )
    CC_INIT_FCN="$2"
    shift
    ;;
  -d )
    CLI_DELAY="$2"
    shift
    ;;
  -s )
    DATABASE="$2"
    shift
    ;;
  -r )
    MAX_RETRY="$2"
    shift
    ;;
  -ccs )
    CC_SEQUENCE="$2"
    shift
    ;;
  -ccv )
    CC_VERSION="$2"
    shift
    ;;
  -verbose )
    VERBOSE=true
    ;;
  * )
    errorln "Unknown flag: $key"
    printHelp
    exit 1
    ;;
  esac
  shift
done


# Determine whether starting, stopping, restarting or generating for announce
if [ "$MODE" == "up" ]; then
  infoln "Adding org3 to channel '${CHANNEL_NAME}' with '${CLI_TIMEOUT}' seconds and CLI delay of '${CLI_DELAY}' seconds and using database '${DATABASE}'"
  echo
elif [ "$MODE" == "down" ]; then
  EXPMODE="Stopping network"
elif [ "$MODE" == "generate" ]; then
  EXPMODE="Generating certs and organization definition for Org3"
elif [ "$MODE" == "deployCC" ]; then
  infoln "Deploy CC for Org3"
else
  printHelp
  exit 1
fi

#Create the network using docker compose
if [ "${MODE}" == "up" ]; then
  addOrg3
elif [ "${MODE}" == "down" ]; then ## Clear the network
  networkDown
elif [ "${MODE}" == "generate" ]; then ## Generate Artifacts
  generateOrg3
  generateOrg3Definition
elif [ "$MODE" == "deployCC" ]; then
  infoln "deploying chaincode on channel '${CHANNEL_NAME}'"
  deployCC
else
  printHelp
  exit 1
fi
