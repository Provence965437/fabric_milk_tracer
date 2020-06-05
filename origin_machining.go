// origin_machining.go
package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
)

type machining struct{}

func (t *machining) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success([]byte("success invok and Not opter !!!!1!! "))
}

func (t *machining) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	_, args := stub.GetFunctionAndParameters()

	var opttype = args[0]
	var assetname = args[1]
	var optcontont = args[2]

	fmt.Printf("parm is %s %s %s \n", opttype,assetname, optcontont)
	if opttype == "putvalue" {
		stub.PutState(assetname, []byte(optcontont))
		return shim.Success([]byte("success put " + optcontont))
	} else if opttype == "getlastvalue" {
		var keyvalue []byte
		var err error
		keyvalue, err = stub.GetState(assetname)

		if err != nil {
			return shim.Error("find error!")
		}

		return shim.Success(keyvalue)
	} else if opttype == "gethistory" {
		keysIter, err := stub.GetHistoryForKey(assetname)

		if err != nil {
			return shim.Error(fmt.Sprintf("GetHistoryForKey fialed.Error accessing state: %s", err))
		}
		defer keysIter.Close()
		var keys []string
		for keysIter.HasNext() {
			response, iterErr := keysIter.Next()
			if iterErr != nil {
				return shim.Error(fmt.Sprintf("GetHistoryForKey operation failed.Error accessing state: %s", err))
			}
			txid := response.TxId
			txvalue := response.Value
			txstatus := response.IsDelete
			txtimestamp := response.Timestamp

			tm := time.Unix(txtimestamp.Seconds, 0)
			datestr := tm.Format("2006-01-02 03:04:05 PM")

			fmt.Printf("Tx info - txid:%s value:%s if delete:%t datatime:%s \n", txid, string(txvalue), txstatus, datestr)
			keys = append(keys, string(txvalue)+":"+datestr)

		}
		jsonKeys, err := json.Marshal(keys)
		if err != nil {
			return shim.Error(fmt.Sprintf("query operation failed.Error marshaling JSON: %s", err))
		}
		return shim.Success(jsonKeys)
	} else {
		return shim.Success([]byte("success invok and No operation !!!!!!!!"))
	}

}

func main() {
	err := shim.Start(new(machining))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
