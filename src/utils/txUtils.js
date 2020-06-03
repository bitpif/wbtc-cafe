import RenJS from "@renproject/ren";
import adapterABI from "../utils/adapterCurveABI.json";
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';

import curveABI from "../utils/curveABI.json";
import { getStore } from '../services/storeService'
import {
    CURVE_TEST,
    CURVE_MAIN
} from './web3Utils'

// Changing TX State
export const addTx = (tx) => {
    const store = getStore()
    const storeString = 'convert.transactions'
    let txs = store.get(storeString)
    txs.push(tx)
    store.set(storeString, txs)

    const space = store.get('space')
    // console.log('space', space)

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

    return newTx
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

export const getTx = function(id) {
    return getStore().get('convert.transactions').filter(t => t.id === id)[0]
}

export const txExists = function(tx) {
    return getStore().get('convert.transactions').filter(t => t.id === tx.id).length > 0
}

// External Data
export const updateRenVMFees = async function() {
    const store = getStore()
    try {
        const fees = await fetch('https://lightnode-mainnet.herokuapp.com', {
            method: 'POST', // or 'PUT'
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: 67,
              jsonrpc: "2.0",
              method: "ren_queryFees",
              params: {}
            })
        })
        const data = (await fees.json()).result
        // console.log(data)
        // console.log('renvm fees', await fees.json())
        store.set('fees', data)
    } catch(e) {
        console.log(e)
    }
}

export const getExchangeRate = async function(tx) {
    const store = getStore()
    const dataWeb3 = store.get('dataWeb3')
    const selectedNetwork = store.get('selectedNetwork')
    const {
        amount,
        sourceAsset
    } = tx

    const amountInSats = RenJS.utils.value(amount, "btc").sats().toNumber()
    const curve = new dataWeb3.eth.Contract(curveABI, selectedNetwork === 'testnet' ? CURVE_TEST : CURVE_MAIN)
    try {
        const swapResult = (sourceAsset === 'wbtc' ?
          await curve.methods.get_dy(1, 0, amountInSats).call() :
          await curve.methods.get_dy(0, 1, amountInSats).call()) / (10 ** 8)
        return Number(swapResult / amount).toFixed(4)
    } catch (e) {
        console.log(e)
    }
}

export const gatherFeeData = async function() {
    const store = getStore()
    const dataWeb3 = store.get('dataWeb3')
    const amount = store.get('convert.amount')
    const selectedNetwork = store.get('selectedNetwork')
    const fees = store.get('fees')
    const selectedAsset = store.get('selectedAsset')
    const selectedDirection = store.get('convert.selectedDirection')
    const fixedFeeKey = selectedDirection ? 'release' : 'lock'
    const dynamicFeeKey = selectedDirection ? 'burn' : 'mint'

    const fixedFee = Number(fees[selectedAsset][fixedFeeKey] / (10 ** 8))
    const dynamicFeeRate = Number(fees[selectedAsset].ethereum[dynamicFeeKey] / 10000)

    if (!amount || !dataWeb3 || !fees) return

    try {
        let exchangeRate
        let renVMFee
        let total
        const amountInSats = RenJS.utils.value(amount, "btc").sats().toNumber()
        const curve = new dataWeb3.eth.Contract(curveABI, selectedNetwork === 'testnet' ? CURVE_TEST : CURVE_MAIN)

        // withdraw
        if (selectedDirection) {
            const swapResult = await curve.methods.get_dy(1, 0, amountInSats).call() / (10 ** 8)
            exchangeRate = Number(swapResult / amount).toFixed(4)
            renVMFee = (Number(swapResult) * dynamicFeeRate).toFixed(8)
            total = Number(swapResult-renVMFee-fixedFee) > 0 ? Number(swapResult-renVMFee-fixedFee).toFixed(6) : '0.000000'
        } else {
            renVMFee = (Number(amount) * dynamicFeeRate).toFixed(8)
            const amountAfterMint = Number(amount-renVMFee-fixedFee) > 0 ? Number(amount-renVMFee-fixedFee) : 0
            const amountAfterMintInSats = Math.round(RenJS.utils.value(amountAfterMint, "btc").sats().toNumber())

            console.log(amountAfterMintInSats, renVMFee, fixedFee)

            if (amountAfterMintInSats) {
                const swapResult = await curve.methods.get_dy(0, 1, amountAfterMintInSats).call() / (10 ** 8)
                exchangeRate = Number(swapResult / amountAfterMint).toFixed(4)
                total = Number(swapResult).toFixed(6)
            } else {
                exchangeRate = Number(0).toFixed(4)
                total = Number(0).toFixed(6)
            }
        }

        store.set('convert.exchangeRate', exchangeRate)
        store.set('convert.renVMFee', renVMFee)
        store.set('convert.networkFee', fixedFee)
        store.set('convert.conversionTotal', total)
    } catch(e) {
        console.log(e)
    }
}

export const getTaggedTxs = async function() {
    const store = getStore()
    const localWeb3Address = store.get('localWeb3Address')
    try {
        const res = await fetch('https://lightnode-testnet.herokuapp.com', {
            method: 'POST', // or 'PUT'
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: 67,
              jsonrpc: "2.0",
              method: "ren_queryTxs",
              params: {
                tags: [Base64.stringify(sha256(localWeb3Address))]
              }
            })
        })
        const data = (await res.json())
        console.log(data)
        // console.log('renvm fees', await fees.json())
        // store.set('fees', data)
    } catch(e) {
        console.log(e)
    }
}

// BTC to WBTC
export const monitorMintTx = async function(tx) {
    const store = getStore()
    const sdk = store.get('sdk')
    const web3 = store.get('localWeb3')

    const interval = setInterval(async () => {
        // Get latest tx state every iteration
        const latestTx = getTx(tx.id)
        console.log('latestTx', latestTx)

        // Get transaction details
        const txDetails = await web3.eth.getTransaction(latestTx.destTxHash)
        const currentBlock = await web3.eth.getBlockNumber()
        const confs =  txDetails.blockNumber === null || txDetails.blockNumber > currentBlock ? 0 : currentBlock - txDetails.blockNumber

        // Update confs
        if (confs > 0) {
            updateTx(Object.assign(latestTx, {
                destTxConfs: confs,
                awaiting: '',
                error: false
            }))
            clearInterval(interval)
        }
    }, 1000)
}

export const completeConvertToEthereum = async function(transaction, approveSwap) {
    const store = getStore()
    const localWeb3 = store.get('localWeb3')
    const localWeb3Address = store.get('localWeb3Address')
    const pending = store.get('convert.pendingConvertToEthereum')
    const renResponse = transaction.renResponse

    // amount user sent
    const userBtcTxAmount = Number((renResponse.in.utxo.amount / (10 ** 8)).toFixed(8))
    // amount in renvm after fixed fee
    const utxoAmount = renResponse.autogen.amount
    // update amount to the actual amount sent
    const tx = updateTx(Object.assign(transaction, { sourceAmount: userBtcTxAmount }))

    const { id, sourceAmount, params, renSignature, minSwapProceeds } = tx
    const adapterContract = new localWeb3.eth.Contract(adapterABI, store.get('convert.adapterAddress'))

    // if swap will revert to renBTC, let the user know before proceeding
    const exchangeRate = await getExchangeRate(tx)
    const expectedProceeds = Number(sourceAmount * exchangeRate)
    console.log(exchangeRate, expectedProceeds, minSwapProceeds)
    if (!approveSwap && expectedProceeds < minSwapProceeds) {
        store.set('swapRevertModalTx', tx)
        store.set('showSwapRevertModal', true)
        store.set('swapRevertModalExchangeRate', exchangeRate)
        updateTx(Object.assign(tx, { awaiting: 'eth-settle', error: true }))
        return
    }

    if (!tx.destTxHash) {
        updateTx(Object.assign(tx, {
            awaiting: 'eth-settle',
        }))
        try {
            await adapterContract.methods.mintThenSwap(
                params.contractCalls[0].contractParams[0].value,
                params.contractCalls[0].contractParams[1].value,
                utxoAmount,
                renResponse.autogen.nhash,
                renSignature
            ).send({
                from: localWeb3Address
            })
            .on('transactionHash', hash => {
                console.log(hash)
                const newTx = updateTx(Object.assign(tx, {
                    destTxHash: hash,
                    error: false
                }))
                monitorMintTx(newTx)
            })

            store.set('convert.pendingConvertToEthereum', pending.filter(p => p !== id))
        } catch(e) {
            console.log(e)
            updateTx(Object.assign(tx, { error: true }))
        }
    } else {
        monitorMintTx(getTx(tx.id))
    }
}

export const initMint = function(tx) {
    const {
      type,
      amount,
      params,
      destAddress,
      minSwapProceeds
    } = tx
    const store = getStore()
    const {
        sdk
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
                value: RenJS.utils.value(minSwapProceeds, "btc").sats().toNumber()
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
        // tags: [Base64.stringify(sha256(localWeb3Address))]
    }

    // console.log('init mint', data, tx)
    const mint = sdk.lockAndMint(data)

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
        sourceTxHash,
        sourceTxVOut
    } = tx

    const pending = store.get('convert.pendingConvertToEthereum')
    if (pending.indexOf(id) < 0) {
        store.set('convert.pendingConvertToEthereum', pending.concat([id]))
    }

    // completed
    if (!awaiting) return

    // clear error when re-attempting
    if (error) {
        updateTx(Object.assign(tx, { error: false }))
    }

    // ren already exposed a signature
    if (renResponse && renSignature && !error) {
        // sometimes api calls fail when loading the page
        completeConvertToEthereum.bind(this)(tx)
    } else {
        // create or re-create shift in
        const mint = await initMint.bind(this)(tx)

        console.log('initConvertToEthereum mint', mint, tx)

        if (!params) {
            addTx(Object.assign(tx, {
                params: mint.params,
                renBtcAddress: await mint.gatewayAddress()
            }))
        }

        // wait for btc
        const targetConfs = tx.sourceNetworkVersion === 'testnet' ? 2 : 6
        let deposit
        if (awaiting === 'ren-settle' && sourceTxHash && String(sourceTxVOut) !== 'undefined') {
            deposit = await mint.wait(targetConfs, {
                txHash: sourceTxHash,
                vOut: sourceTxVOut
            })
        } else {
            deposit = await mint
                .wait(targetConfs)
                .on("deposit", dep => {
                    // console.log('on deposit', dep)
                    if (dep.utxo) {
                        if (awaiting === 'btc-init') {
                            store.set('showGatewayModal', false)
                            store.set('gatewayModalTx', null)

                            updateTx(Object.assign(tx, {
                                awaiting: 'btc-settle',
                                btcConfirmations: dep.utxo.confirmations,
                                sourceTxHash: dep.utxo.txHash,
                                sourceTxVOut: dep.utxo.vOut
                            }))
                        } else {
                            updateTx(Object.assign(tx, {
                                btcConfirmations: dep.utxo.confirmations,
                                sourceTxHash: dep.utxo.txHash,
                                sourceTxVOut: dep.utxo.vOut
                            }))
                        }
                    }
                })
        }

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

// WBTC to BTC
export const monitorBurnTx = async function(tx) {
    const store = getStore()
    const sdk = store.get('sdk')
    const web3 = store.get('localWeb3')
    const targetConfs = tx.sourceNetworkVersion === 'testnet' ? 13 : 30

    let burn;
    try {
        burn = await sdk.burnAndRelease({
            sendToken: RenJS.Tokens.BTC.Eth2Btc,
            web3Provider: web3.currentProvider,
            ethereumTxHash: tx.sourceTxHash,
        }).readFromEthereum()
    } catch(e) {
        console.log(e)
        updateTx(Object.assign(tx, { error: true }))
        return
    }

    const interval = setInterval(async () => {
        // Get latest tx state every iteration
        const latestTx = getTx(tx.id)
        console.log('latestTx', latestTx, burn)

        // Get transaction details
        const txDetails = await web3.eth.getTransaction(latestTx.sourceTxHash)
        const currentBlock = await web3.eth.getBlockNumber()
        const confs =  txDetails.blockNumber === null || txDetails.blockNumber > currentBlock ? 0 : currentBlock - txDetails.blockNumber

        // Update confs
        if (confs !== latestTx.sourceTxConfs) {
            updateTx(Object.assign(latestTx, { sourceTxConfs: confs }))
        }

        // After enough confs, start watching RenVM
        if (latestTx.sourceTxConfs >= targetConfs) {
          if (latestTx.awaiting === 'eth-settle') {
            updateTx(Object.assign(latestTx, {
              awaiting: 'ren-settle'
            }))
          }

          try {
            const renVMTx = await burn.queryTx()
            console.log('renVMTx', renVMTx)
            if (renVMTx.txStatus === 'done') {
                updateTx(Object.assign(latestTx, {
                  awaiting: '' ,
                  error: false,
                }))
                clearInterval(interval)
            }
          } catch(e) {
            console.log(e)
          }
        }
    }, 1000)
}

export const initConvertFromEthereum = async function(tx, approveSwap) {
    const store = getStore()
    const web3 = store.get('localWeb3')
    const adapterAddress = store.get('convert.adapterAddress')
    const walletAddress = store.get('localWeb3Address')
    const { amount, destAddress, minSwapProceeds } = tx

    const from = walletAddress;
    const adapter = new web3.eth.Contract(adapterABI, adapterAddress);

    if (!txExists.bind(this)(tx)) {
        addTx(tx)
    } else if (tx.error) {
        // clear error when re-attempting
        updateTx(Object.assign(tx, { error: false }))
    }

    // if swap will revert to renBTC, let the user know before proceeding
    const exchangeRate = await getExchangeRate(tx)
    const expectedProceeds = Number(amount * exchangeRate)
    if (!approveSwap && expectedProceeds < minSwapProceeds) {
        store.set('swapRevertModalTx', tx)
        store.set('showSwapRevertModal', true)
        return
    }

    console.log('initWithdraw', tx)

    try {
        await adapter.methods.swapThenBurn(
            RenJS.utils.BTC.addressToHex(destAddress), //_to
            RenJS.utils.value(amount, "btc").sats().toNumber(), // _amount in Satoshis
            RenJS.utils.value(minSwapProceeds, "btc").sats().toNumber()
        ).send({ from })
        .on('transactionHash', hash => {
            console.log(hash)
            updateTx(Object.assign(tx, {
              awaiting: 'eth-settle',
              sourceTxHash: hash,
              error: false
            }))
            monitorBurnTx(getTx(tx.id))
        })
    } catch(e) {
        console.log('eth burn error', e)
        updateTx(Object.assign(tx, { error: true }))
        return
    }
}

export const initMonitoring = function() {
    const store = getStore()
    const network = store.get('selectedNetwork')
    let txs = store.get('convert.transactions').filter(t => t.sourceNetworkVersion === network)

    txs.map(tx => {
        if (tx.sourceNetwork === 'bitcoin') {
            initConvertToEthereum.bind(this)(tx)
        } else if (tx.sourceNetwork === 'ethereum' && tx.awaiting && !tx.error) {
            monitorBurnTx(tx)
        }
    })
}

window.getTaggedTxs = getTaggedTxs

export default {
    addTx,
    updateTx,
    removeTx,
    initMint,
    initConvertToEthereum,
    initConvertFromEthereum,
    initMonitoring,
}
