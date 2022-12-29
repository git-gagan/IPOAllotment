# Please use the following steps directly to install and approve chaincode on Org3

Assume yourself in the test-network/

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=$PWD/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051


peer lifecycle chaincode package ipo.tar.gz --path ../ipo-settlement/javascript-chaincode/ --lang node  --label ipo_1

peer lifecycle chaincode install ipo.tar.gz

peer lifecycle chaincode queryinstalled

export CC_PACKAGE_ID=ipo_1:397c0d7a9ec0cba892a22e8ece470334d77df94f5ae1fb479ae8b0cdadba1fac

peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem" --channelID mychannel --name ipo --version 1 --package-id $CC_PACKAGE_ID --sequence 1 --init-required

peer lifecycle chaincode querycommitted --channelID mychannel --name ipo --cafile "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp
/tlscacerts/tlsca.example.com-cert.pem"

# To check

peer chaincode query -C mychannel -n ipo -c '{"Args":["queryAllShares"]}'