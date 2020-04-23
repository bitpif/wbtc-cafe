import { withStore } from '@spyna/react-store'
import RenJS from "@renproject/ren";
import BigNumber from "bignumber.js";
import adapterABI from "../utils/adapterCurveABI.json";
// import adapterABI from "../utils/adapterABI.json";
import zbtcABI from "../utils/zbtcABI.json";
// import shifterABI from "../utils/shifterABI.json";
import { getStore } from '../services/storeService'
import {
    ZBTC_MAIN,
    ZBTC_TEST,
    ADAPTER_MAIN,
    ADAPTER_TEST,
    BTC_SHIFTER_MAIN,
    BTC_SHIFTER_TEST
} from './web3Utils'

export const windowBlocker = function(event) {
    // Cancel the event as stated by the standard.
    event.preventDefault();

    const msg = 'WARNING: closing the browser window now may result in loss of funds. Are you sure?';

    // Chrome requires returnValue to be set.
    event.returnValue = msg
    return msg
}

export const setWindowBlocker = function() {
    window.addEventListener('beforeunload', windowBlocker);
}

export const removeWindowBlocker = function() {
    window.removeEventListener('beforeunload', windowBlocker);
}

export const addTx = (store, tx) => {
    const storeString = tx.type === 'convert' ? 'convert.transactions' : 'transfer.transactions'
    let txs = store.get(storeString)
    txs.push(tx)
    store.set(storeString, txs)

    // const space = store.get('space')
    // if (space) {
    //     space.public.set(storeString, JSON.stringify(txs))
    // }

    // use localStorage
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const updateTx = (store, newTx) => {
    const storeString = newTx.type === 'convert' ? 'convert.transactions' : 'transfer.transactions'
    const txs = store.get(storeString).map(t => {
        if (t.id === newTx.id) {
            // const newTx = Object.assign(t, props)
            return newTx
        }
        return t
    })
    store.set(storeString, txs)

    // const space = store.get('space')
    // if (space) {
    //     space.public.set(storeString, JSON.stringify(txs))
    // }

    // use localStorage
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const removeTx = (store, tx) => {
    const storeString = tx.type === 'convert' ? 'convert.transactions' : 'transfer.transactions'
    let txs = store.get(storeString).filter(t => (t.id !== tx.id))
    // console.log(txs)
    store.set(storeString, txs)

    // const space = store.get('space')
    // if (space) {
    //     space.public.set(storeString, JSON.stringify(txs))
    // }

    // use localStorage
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

// export const completeDeposit = async function(tx) {
//     const { store }  = this.props
//     const web3 = store.get('web3')
//     const walletAddress = store.get('walletAddress')
//     const adapterAddress = store.get('adapterAddress')
//     const { params, awaiting, renResponse, renSignature } = tx
//
//     const adapterContract = new web3.eth.Contract(adapterABI, adapterAddress)
//     // console.log('adapterContract', adapterContract)
//
//     updateTx(store, Object.assign(tx, { awaiting: 'eth-settle' }))
//
//     try {
//         const result = await adapterContract.methods.deposit(
//             params.contractCalls[0].contractParams[0].value,
//             params.sendAmount,
//             renResponse.autogen.nhash,
//             renSignature
//         ).send({
//             from: walletAddress
//         })
//         // console.log('result', result)
//         updateTx(store, Object.assign(tx, { awaiting: '' }))
//     } catch(e) {
//         // console.log(e)
//         updateTx(store, Object.assign(tx, { error: true }))
//     }
// }
//
// export const initShiftIn = function(tx) {
//     const { amount, renBtcAddress, params, ethSig } = tx
//     const {
//         sdk,
//         web3,
//         walletAddress,
//         adapterAddress
//     } = this.props.store.getState()
//
//     const data = {
//         // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
//         sendToken: RenSDK.Tokens.BTC.Btc2Eth,
//
//         // Amount of BTC we are sending (in Satoshis)
//         sendAmount: Math.floor(amount * (10 ** 8)), // Convert to Satoshis
//
//         // The contract we want to interact with
//         sendTo: adapterAddress,
//
//         // The name of the function we want to call
//         contractFn: "deposit",
//
//         // Arguments expected for calling `deposit`
//         contractParams: [
//             {
//                 name: "_msg",
//                 type: "bytes",
//                 value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
//             }
//         ],
//
//         nonce: params && params.nonce ? params.nonce : RenSDK.utils.randomNonce()
//     }
//
//     const shiftIn = sdk.shiftIn(data)
//
//     return shiftIn
// }
//
// export const initShiftOut = async function(tx) {
//     const { txHash } = tx
//     const { sdk, web3 } = this.props.store.getState()
//
//     const shiftOut = await sdk.shiftOut({
//         // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
//         // This is the reverse of shiftIn.
//         sendToken: RenSDK.Tokens.BTC.Eth2Btc,
//
//         // The web3 provider to talk to Ethereum
//         web3Provider: web3.currentProvider,
//
//         // The transaction hash of our contract call
//         txHash,
//     }).readFromEthereum();
//
//     return shiftOut
// }
//
// export const initDeposit = async function(tx) {
//     const { store }  = this.props
//     const web3 = store.get('web3')
//     const { params, awaiting, renResponse, renSignature, error } = tx
//
//     // completed
//     if (!awaiting) return
//
//     // clear error when re-attempting
//     if (error) {
//         updateTx(store, Object.assign(tx, { error: false }))
//     }
//
//     // ren already exposed a signature
//     if (renResponse && renSignature) {
//         completeDeposit.bind(this)(tx)
//     } else {
//         // create or re-create shift in
//         const shiftIn = await initShiftIn.bind(this)(tx)
//
//         if (!params) {
//             addTx(store, Object.assign(tx, {
//                 params: shiftIn.params,
//                 renBtcAddress: shiftIn.addr()
//             }))
//         }
//
//         // console.log('initDeposit shiftIn', shiftIn, error)
//
//
//         // wait for btc
//         const deposit = await shiftIn.waitForDeposit(2);
//
//         // store message id
//
//         updateTx(store, Object.assign(tx, { awaiting: 'ren-settle' }))
//         // console.log('initDeposit deposit', deposit)
//
//         // TO-DO: check if the user has gas before proceeding
//         // get signature from RenVM
//         try {
//             setWindowBlocker()
//
//             const signature = await deposit.submitToRenVM();
//             updateTx(store, Object.assign(tx, {
//                 renResponse: signature.response,
//                 renSignature: signature.signature
//             }))
//
//             // console.log('initDeposit sig', signature)
//             removeWindowBlocker()
//
//             completeDeposit.bind(this)(tx)
//         } catch(e) {
//             removeWindowBlocker()
//
//             // // submit to renvm failed, recover using message id
//             // if (e.message && e.message.indexOf('has been seen') > -1) {
//             //     const split = e.message.split('reason: ')[1]
//             //     const messageId = split ? split.slice(0, 44) : ''
//             //     if (!messageId) return
//             //     const renData = await shiftIn.renVMNetwork.queryShiftIn(messageId)
//             //     // console.log('renData', renData)
//             //
//             //     // TO-DO: populate tx with renData
//             // }
//         }
//     }
// }

export const completeConvertToEthereum = async function(tx) {
    const store = getStore()
    const web3 = store.get('web3')
    const localWeb3 = store.get('localWeb3')
    const localWeb3Address = store.get('localWeb3Address')
    const web3Context = store.get('web3Context')
    const pending = store.get('convert.pendingConvertToEthereum')

    // const adapterAddress = store.get('adapterAddress')
    const { id, type, params, renResponse, renSignature } = tx

    let adapterContract
    if (type === 'convert') {
        adapterContract = new localWeb3.eth.Contract(adapterABI, store.get('convert.adapterAddress'))
    }

    // const gasPrice = await web3Context.lib.eth.getGasPrice()
    // console.log('gasPrice', gasPrice)

    updateTx(store, Object.assign(tx, { awaiting: 'eth-settle' }))

    console.log('completeDeposit', renResponse, tx, adapterContract)

    const utxoAmount = Number(renResponse.in.utxo.amount)

    try {
        let result
        if (type === 'convert') {
            result = await adapterContract.methods.mintThenSwap(
                params.contractCalls[0].contractParams[0].value,
                params.contractCalls[0].contractParams[1].value,
                utxoAmount,
                renResponse.autogen.nhash,
                renSignature
            ).send({
                from: localWeb3Address
            })
        }
        store.set('convert.pendingConvertToEthereum', pending.filter(p => p !== id))
        updateTx(store, Object.assign(tx, { awaiting: '', txHash: result.transactionHash, error: false }))
    } catch(e) {
        console.log(e)
        updateTx(store, Object.assign(tx, { error: true }))
    }
}

export const initMint = function(tx) {
    const {
      type,
      amount,
      params,
      destAddress,
    } = tx
    const store = getStore()
    const {
        sdk,
        gjs,
        web3,
    } = store.getState()

    let adapterAddress = ''
    let contractFn = ''
    let contractParams = []

    if (type === 'convert') {
        adapterAddress = store.get('convert.adapterAddress')
        contractFn = 'mintThenSwap'
        contractParams = [
            {
                name: "_minWbtcAmount",
                type: "uint256",
                value: 0
            },
            {
                name: "_wbtcDestination",
                type: "address",
                value: destAddress
            }
        ]
    }

    // store data or update params with nonce
    const data = {
        sendToken: RenJS.Tokens.BTC.Btc2Eth,
        sendAmount: RenJS.utils.value(amount, "btc").sats(), // Convert to Satoshis
        sendTo: adapterAddress,
        contractFn,
        contractParams,
        nonce: params && params.nonce ? params.nonce : RenJS.utils.randomNonce(),
    }

    console.log(data, tx)

    const mint = sdk.lockAndMint(data)

    // window.shiftIns.push(mint)

    return mint
}

export const initConvertToEthereum = async function(tx) {
    const store = getStore()
    const {
        id,
        params,
        awaiting,
        renResponse,
        renSignature,
        error,
    } = tx

    const pending = store.get('convert.pendingConvertToEthereum')
    if (pending.indexOf(id) < 0) {
        store.set('convert.pendingConvertToEthereum', pending.concat([id]))
    }

    console.log('initConvertToEthereum', tx)

    // completed
    if (!awaiting) return

    // clear error when re-attempting
    if (error) {
        updateTx(store, Object.assign(tx, { error: false }))
    }

    // ren already exposed a signature
    if (renResponse && renSignature && !error) {
        completeConvertToEthereum.bind(this)(tx)
    } else {
        // create or re-create shift in
        const mint = await initMint.bind(this)(tx)

        console.log('initConvertToEthereum mint', mint)

        if (!params) {
            addTx(store, Object.assign(tx, {
                params: mint.params,
                renBtcAddress: mint.addr()
            }))
        }

        // wait for btc
        const deposit = await mint
            .wait(2)
            .on("deposit", dep => {
                // console.log('on deposit', dep)
                if (dep.utxo) {
                    if (awaiting === 'btc-init') {
                        updateTx(store, Object.assign(tx, {
                            awaiting: 'btc-settle',
                            btcConfirmations: dep.utxo.confirmations,
                            btcTxHash: dep.utxo.txid
                        }))
                    } else {
                        updateTx(store, Object.assign(tx, {
                            btcConfirmations: dep.utxo.confirmations,
                            btcTxHash: dep.utxo.txid
                        }))
                    }
                }
            })

        updateTx(store, Object.assign(tx, { awaiting: 'ren-settle' }))

        try {
            const signature = await deposit.submit();
            updateTx(store, Object.assign(tx, {
                renResponse: signature.renVMResponse,
                renSignature: signature.signature
            }))

            completeConvertToEthereum.bind(this)(tx)
        } catch(e) {
            console.log(e)
        }
    }
}

export const initConvertFromEthereum = async function(tx) {
    // const { store } = this.props
    // const web3 = store.get('web3')
    // const btcShifterAddress = store.get('btcShifterAddress')
    // const walletAddress = store.get('walletAddress')
    // const { id, awaiting, amount, destAddress, txHash } = tx
    //
    // const from = walletAddress;
    // const btcShifterContract = new web3.eth.Contract(shifterABI, btcShifterAddress);
    //
    // if (!txExists.bind(this)(tx)) {
    //     addTx(store, tx)
    // } else if (tx.error) {
    //     // clear error when re-attempting
    //     updateTx(store, Object.assign(tx, { error: false }))
    // }
    //
    // // console.log('initWithdraw', tx, btcShifterAddress)
    //
    // // call burn on shifter contract
    // let shiftOut
    // if (!txHash) {
    //     try {
    //         const result = await btcShifterContract.methods.shiftOut(
    //             // web3.utils.fromAscii(`Withdrawing ${amount} BTC`), // _msg
    //             RenSDK.Tokens.BTC.addressToHex(destAddress), //_to
    //             Math.floor(amount * (10 ** 8)), // _amount in Satoshis
    //         ).send({ from })
    //
    //         // console.log(result)
    //
    //         updateTx(store, Object.assign(tx, { awaiting: 'eth-settle', txHash }))
    //         shiftOut = await initShiftOut.bind(this)(Object.assign(tx, { txHash: result.transactionHash }))
    //     } catch(e) {
    //         // console.log('eth burn error', e)
    //         updateTx(store, Object.assign(tx, { error: true }))
    //         return
    //     }
    // } else {
    //     shiftOut = await initShiftOut.bind(this)(tx)
    // }
    //
    // // console.log('initWithdraw', shiftOut)
    //
    // updateTx(store, Object.assign(tx, { awaiting: 'ren-settle' }))
    //
    // // submit to RenVM
    // try {
    //     setWindowBlocker()
    //
    //     const out = await shiftOut.submitToRenVM();
    //     // console.log('initWithdraw', out)
    //     updateTx(store, Object.assign(tx, { awaiting: '', renTx: out }))
    //
    //     removeWindowBlocker()
    // } catch(e) {
    //     // TO-DO: graceful recover
    //     removeWindowBlocker()
    // }
}

export const initSwap = async function(tx) {
    // const store = getStore()
    // // const web3 = store.get('web3')
    // // const transferAmount = store.get('transferAmount')
    // // const transferAddress = store.get('transferAddress')
    // // const zbtcAddress = store.get('zbtcAddress')
    // // const walletAddress = store.get('walletAddress')
    // // const contract = new web3.eth.Contract(zbtcABI, zbtcAddress);
    // //
    // addTx(store, Object.assign(tx, {}))
}

export const initTransfer = async function() {
    // const store = getStore()
    // const web3 = store.get('web3')
    // const transferAmount = store.get('transferAmount')
    // const transferAddress = store.get('transferAddress')
    // const zbtcAddress = store.get('zbtcAddress')
    // const walletAddress = store.get('walletAddress')
    // const contract = new web3.eth.Contract(zbtcABI, zbtcAddress);
    //
    // const amount = new BigNumber(Number(transferAmount * 100000000).toFixed(8))
    //
    // try {
    //     await contract.methods.transfer(transferAddress, amount.toString()).send({
    //         from: walletAddress
    //     });
    // } catch(e) {
    //     // console.log(e)
    // }
}

export const initMonitoring = function() {
    const store = getStore()
    const network = store.get('selectedNetwork')
    const pending = store.get('convert.pendingConvertToEthereum')
    let txs = store.get('convert.transactions')
        // .filter(t => t.network === network)

    console.log('initMonitoring', store.getState())

    txs.map(tx => {
        // if (tx.awaiting && !tx.instant) {
            // if (pending.indexOf(tx.id) < 0) {
                initConvertToEthereum.bind(this)(tx)
            // }
        // }
    })

    // // transfers via gateway js
    // recoverTrades.bind(this)()
}

export default {
    addTx,
    updateTx,
    removeTx,
    initMint,
    initConvertToEthereum,
    initConvertFromEthereum,
    initMonitoring,
    initTransfer
}
