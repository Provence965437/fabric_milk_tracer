// origin_salesterminal
package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
)

type salesterminal struct{}

func (t *salesterminal) Init(stub shim.ChaincodeStubInterface) peer.Response {
	_, args := stub.GetFunctionAndParameters()

	var a_parm = args[0]
	var b_parm = args[1]
	var c_parm = args[2]

	fmt.Printf(" parm is %s %s %s  \n", a_parm, b_parm, c_parm)

	return shim.Success([]byte("success invok and Not opter !!!!!!"))

}

func (t *salesterminal) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	_, args := stub.GetFunctionAndParameters()

	var opttype = args[0]
	var assetname = args[1]
	var optcontont = args[2]

	fmt.Printf("parm is %s %s %s  \n", opttype, assetname, optcontont)

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
			return shim.Error(fmt.Sprintf("GetHistoryForKey failed, Error accessing state: %s ", err))
		}
		defer keysIter.Close()
		var keys []string

		for keysIter.HasNext() {
			response, iterErr := keysIter.Next()
			if iterErr != nil {
				return shim.Error(fmt.Sprintf("GetHistoryForKey opteration failed. Error accessing state :%s", err))
			}
			txid := response.TxId
			txvalue := response.Value
			txstatus := response.IsDelete
			txtimestamp := response.Timestamp

			tm := time.Unix(txtimestamp.Seconds, 0)
			datestr := tm.Format("2006-01-02 03:04:05 PM")

			fmt.Printf("Tx info - rxid:%s  value: %s if delete: %t datetime : %s\n", txid, string(txvalue), txstatus, datestr)
			keys = append(keys, string(txvalue)+":"+datestr)

		}
		jsonKeys, err := json.Marshal(keys)
		if err != nil {
			return shim.Error(fmt.Sprintf("query opteration failed.Error marshaling JSON: %s", err))
		}

		return shim.Success(jsonKeys)

	} else if opttype == "getmilkhistory" {
		keysIter, err := stub.GetHistoryForKey(assetname)

		if err != nil {
			return shim.Error(fmt.Sprintf("GetHistoryForKey failed.Error accessing state: %s", err))
		}
		defer keysIter.Close()

		var keys []string
		var values []string

		for keysIter.HasNext() {
			response, iterErr := keysIter.Next()
			if iterErr != nil {
				return shim.Error(fmt.Sprintf("GetHistoryForKey opteration failed. Error accessing state :%s", err))
			}
			txid := response.TxId
			txvalue := response.Value
			txstatus := response.IsDelete
			txtimestamp := response.Timestamp

			tm := time.Unix(txtimestamp.Seconds, 0)
			datestr := tm.Format("2006-01-02 03:04:05 PM")

			fmt.Printf("Tx info - rxid:%s  value: %s if delete: %t datetime : %s\n", txid, string(txvalue), txstatus, datestr)

			keys = append(keys, string(txvalue)+":"+datestr)

			values = append(values, string(txvalue))
		}
		//获取工厂编号
		machiningid := values[0]

		//调用加工厂的chaincode获取加工厂的溯源信息
		machining_history_parm := []string{"invoke", "gethistory", machiningid, "a"}
		queryArgs := make([][]byte, len(machining_history_parm))
		for i, arg := range machining_history_parm {
			queryArgs[i] = []byte(arg)
		}

		response := stub.InvokeChaincode("origin_machining", queryArgs, "milkgen")

		if response.Status != shim.OK {
			errStr := fmt.Sprintf("Failed to query chaincode. Got error: %s", response.Payload)
			fmt.Printf(errStr)
			return shim.Error(errStr)
		}

		//获取加工的信息
		result := string(response.Payload)

		fmt.Printf("machining info -  result : %s  \n ", result)

		var machinginfos []string
		if err := json.Unmarshal([]byte(result), &machinginfos); err != nil {
			return shim.Error(fmt.Sprintf("query operation failed.Error marshaling JSON:%s", err))
		}

		for _, v := range machinginfos {
			keys = append(keys, v)
		}

		milid := machinginfos[0]
		fmt.Printf("mil info -  milid : %s  \n", milid)

		milidarr := strings.Split(milid, ":")
		cowid := milidarr[0]

		fmt.Printf("mil info - cowid : %s   \n", cowid)

		//通过牛奶的编号获取溯源信息
		cow_parms := []string{"invoke", "gethistory", cowid, "a"}
		queryArgs1 := make([][]byte, len(cow_parms))
		for i, arg := range cow_parms {
			queryArgs1[i] = []byte(arg)
		}

		cow_response := stub.InvokeChaincode("origin_dairyfarm", queryArgs1, "milkgen")

		if cow_response.Status != shim.OK {
			errStr := fmt.Sprintf("Failed to query chaincode. Got error: %s", cow_response.Payload)
			fmt.Printf(errStr)
			return shim.Error(errStr)
		}

		cow_result := string(cow_response.Payload)

		fmt.Printf("cow info - result :%s \n", cow_result)

		var cowhistorys []string
		if err := json.Unmarshal([]byte(cow_result), &cowhistorys); err != nil {
			return shim.Error(fmt.Sprint("query operation failed.Error marshaling JSON:%s", err))
		}

		for _, v1 := range cowhistorys {
			keys = append(keys, v1)
		}

		jsonKeys, err := json.Marshal(keys)
		if err != nil {
			return shim.Error(fmt.Sprintf("query operation failed.Error marshaling JSON:%s", err))
		}

		return shim.Success(jsonKeys)

	} else {
		return shim.Success([]byte("success invok and No operation !!!!!!!!"))
	}
}
func main() {
	err := shim.Start(new(salesterminal))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
