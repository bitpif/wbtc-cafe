import { withStore } from '@spyna/react-store'
import RenJS from "@renproject/ren";
import BigNumber from "bignumber.js";
import adapterABI from "../utils/adapterCurveABI.json";
// import adapterABI from "../utils/adapterABI.json";
import zbtcABI from "../utils/erc20ABI.json";
import curveABI from "../utils/curveABI.json";
// import shifterABI from "../utils/shifterABI.json";
import { getStore } from '../services/storeService'
import {
    ZBTC_MAIN,
    ZBTC_TEST,
    ADAPTER_MAIN,
    ADAPTER_TEST,
    BTC_SHIFTER_MAIN,
    BTC_SHIFTER_TEST,
    CURVE_TEST
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

export const addTx = (tx) => {
    const store = getStore()
    const storeString = 'convert.transactions'
    let txs = store.get(storeString)
    txs.push(tx)
    store.set(storeString, txs)

    const space = store.get('space')
    console.log('space', space)

    if (space) {
        space.public.set(storeString, JSON.stringify(txs))
    }

    // use localStorage
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const updateTx = (newTx) => {
    const store = getStore()
    const storeString = 'convert.transactions'
    const txs = store.get(storeString).map(t => {
        if (t.id === newTx.id) {
            // const newTx = Object.assign(t, props)
            return newTx
        }
        return t
    })
    store.set(storeString, txs)

    const space = store.get('space')
    if (space) {
        space.public.set(storeString, JSON.stringify(txs))
    }

    // use localStorage
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const removeTx = (tx) => {
    const store = getStore()
    const storeString = 'convert.transactions'
    let txs = store.get(storeString).filter(t => (t.id !== tx.id))
    // console.log(txs)
    store.set(storeString, txs)

    const space = store.get('space')
    if (space) {
        space.public.set(storeString, JSON.stringify(txs))
    }

    // use localStorage
    localStorage.setItem(storeString, JSON.stringify(txs))

    // for debugging
    window.txs = txs
}

export const txExists = function(tx) {
    return getStore().get('convert.transactions').filter(t => t.id === tx.id).length > 0
}

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

    updateTx(Object.assign(tx, { awaiting: 'eth-settle' }))

    console.log('completeDeposit', renResponse, tx, adapterContract)

    // const utxoAmount = Number(renResponse.in.utxo.amount)
    const utxoAmount = renResponse.autogen.amount

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
        updateTx(Object.assign(tx, { awaiting: '', txHash: result.transactionHash, error: false }))
    } catch(e) {
        console.log(e)
        updateTx(Object.assign(tx, { error: true }))
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
        suggestedAmount: RenJS.utils.value(amount, "btc").sats().toNumber(), // Convert to Satoshis
        sendTo: adapterAddress,
        contractFn,
        contractParams,
        nonce: params && params.nonce ? params.nonce : RenJS.utils.randomNonce(),
    }

    console.log('init mint', data, tx)

    const mint = sdk.lockAndMint(data)

    return mint
}

export const initBurn = async function(tx) {
    // const { txHash } = tx
    // const { sdk, localWeb3 } = getStore().getState()
    //
    // const adapter = new localWeb3.eth.Contract(curveABI, CURVE_TEST)
    //
    // const burn = await sdk.burnAndRelease({
    //     // Send BTC from the Ethereum blockchain to the Bitcoin blockchain.
    //     // This is the reverse of shiftIn.
    //     sendToken: RenJS.Tokens.BTC.Eth2Btc,
    //
    //     // The web3 provider to talk to Ethereum
    //     web3Provider: localWeb3.currentProvider,
    //
    //     // The transaction hash of our contract call
    //     ethTxHash: txHash,
    // }).readFromEthereum();
    //
    // console.log(burn)
    //
    // return burn
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
        btcTxHash,
        btcTxVOut
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
        updateTx(Object.assign(tx, { error: false }))
    }

    // ren already exposed a signature
    if (renResponse && renSignature && !error) {
        completeConvertToEthereum.bind(this)(tx)
    } else {
        // create or re-create shift in
        const mint = await initMint.bind(this)(tx)

        console.log('initConvertToEthereum mint', mint)

        if (!params) {
            addTx(Object.assign(tx, {
                params: mint.params,
                renBtcAddress: mint.gatewayAddress()
            }))
        }

        // wait for btc
        let deposit
        if (awaiting === 'ren-settle' && btcTxHash && String(btcTxVOut) !== 'undefined') {
            deposit = await mint.wait(2, {
                txHash: btcTxHash,
                vOut: btcTxVOut
            })
        } else {
            deposit = await mint
                .wait(2)
                .on("deposit", dep => {
                    console.log('on deposit', dep)
                    if (dep.utxo) {
                        if (awaiting === 'btc-init') {
                            store.set('showGatewayModal', false)
                            store.set('gatewayModalTx', null)

                            updateTx(Object.assign(tx, {
                                awaiting: 'btc-settle',
                                btcConfirmations: dep.utxo.confirmations,
                                btcTxHash: dep.utxo.txHash,
                                btcTxVOut: dep.utxo.vOut
                            }))
                        } else {
                            updateTx(Object.assign(tx, {
                                btcConfirmations: dep.utxo.confirmations,
                                btcTxHash: dep.utxo.txHash,
                                btcTxVOut: dep.utxo.vOut
                            }))
                        }
                    }
                })
        }

        console.log('deposit', deposit)

        updateTx(Object.assign(tx, { awaiting: 'ren-settle' }))

        try {
            const signature = await deposit.submit();
            updateTx(Object.assign(tx, {
                renResponse: signature.renVMResponse,
                renSignature: signature.signature
            }))

            completeConvertToEthereum.bind(this)(tx)
        } catch(e) {
            console.log('renvm submit error', e)
        }
    }
}

export const initConvertFromEthereum = async function(tx) {
    const store = getStore()
    const web3 = store.get('localWeb3')
    // const btcShifterAddress = store.get('btcShifterAddress')
    const walletAddress = store.get('localWeb3Address')
    const { id, awaiting, amount, destAddress, txHash } = tx

    const from = walletAddress;
    const adapter = new web3.eth.Contract(adapterABI, ADAPTER_TEST);

    if (!txExists.bind(this)(tx)) {
        addTx(tx)
    } else if (tx.error) {
        // clear error when re-attempting
        updateTx(Object.assign(tx, { error: false }))
    }

    console.log('initWithdraw', tx)

    // call burn on shifter contract
    // let burn
    // if (!txHash) {
        // updateTx(store, Object.assign(tx, { awaiting: 'eth-settle' }))
        try {
            const result = await adapter.methods.swapThenBurn(
                RenJS.utils.BTC.addressToHex(destAddress), //_to
                RenJS.utils.value(amount, "btc").sats().toNumber(), // _amount in Satoshis
                0
            ).send({ from })

            // console.log(result)

            updateTx(Object.assign(tx, { awaiting: '', txHash: result.transactionHash }))
            // burn = await initBurn.bind(this)(Object.assign(tx, { txHash: result.transactionHash }))
        } catch(e) {
            console.log('eth burn error', e)
            updateTx(Object.assign(tx, { error: true }))
            return
        }
    // } else {
    //     burn = await initBurn.bind(this)(tx)
    // }

    // console.log('initWithdraw', burn)

    // updateTx(store, Object.assign(tx, { awaiting: 'ren-settle' }))

    // submit to RenVM
    // try {
    //     setWindowBlocker()
    //
    //     const out = await burn.submitToRenVM();
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

export const gatherFeeData = async function() {
    const store = getStore()
    const dataWeb3 = store.get('dataWeb3')
    const amount = store.get('convert.amount')

    if (!amount || !dataWeb3) return

    const amountInSats = RenJS.utils.value(amount, "btc").sats().toNumber()
    // console.log(amountInSats.toNumber())
    const curve = new dataWeb3.eth.Contract(curveABI, CURVE_TEST)
    try {
        const swapResult = await curve.methods.get_dy(0, 1, amountInSats).call()
        const exchangeRate = Number(swapResult / amountInSats).toFixed(4)
        const fee = (Number(amount) * 0.001).toFixed(8)
        const total = Number((swapResult / (10 ** 8))-fee).toFixed(8)

        store.set('convert.exchangeRate', exchangeRate)
        store.set('convert.networkFee', fee)
        store.set('convert.conversionTotal', total)

        console.log('swapResult', swapResult, exchangeRate, fee, total)
    } catch(e) {
        console.log(e)
    }
}

export const initMonitoring = function() {
    const store = getStore()
    const network = store.get('selectedNetwork')
    const pending = store.get('convert.pendingConvertToEthereum')
    let txs = store.get('convert.transactions')
        // .filter(t => t.network === network)

    console.log('initMonitoring', store.getState())

    txs.map(tx => {
        if (tx.sourceNetwork === 'bitcoin') {
            initConvertToEthereum.bind(this)(tx)
        }
        // if (tx.awaiting && !tx.instant) {
            // if (pending.indexOf(tx.id) < 0) {

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
