import Web3 from "web3";
import RenSDK from "@renproject/ren";
import Web3Modal from 'web3modal'
import firebase from 'firebase'

import BTC from '../assets/btc.png'
import ETH from '../assets/eth.png'
import ZEC from '../assets/zec.jpg'
import DAI from '../assets/dai.png'
import USDC from '../assets/usdc.png'
import WBTC from '../assets/wbtc.png'

import {
    ADAPTER_MAIN,
    ADAPTER_TEST,
    WBTC_TEST,
    WBTC_MAIN
} from './web3Utils'

import {
    initMonitoring,
    gatherFeeData,
    updateTx
} from './txUtils'

import { getStore } from '../services/storeService'

import erc20ABI from "./erc20ABI.json";

let walletDataInterval = null

export const ASSETS = ['BTC', 'WBTC']

export const NAME_MAP = {
    btc: 'Bitcoin',
    eth: 'Ethereum',
    zec: 'Zcash',
    dai: 'DAI',
    usdc: 'USDC',
    wbtc: 'Wrapped Bitcoin'
}

export const SYMBOL_MAP = {
    btc: 'zBTC',
    eth: 'ETH',
    zec: 'zZEC',
    dai: 'DAI',
    usdc: 'USDC',
    wbtc: 'WBTC'
}

export const MINI_ICON_MAP = {
    btc: BTC,
    eth: ETH,
    zec: ZEC,
    dai: DAI,
    usdc: USDC,
    wbtc: WBTC
}

export const resetWallet = async function() {
    const store = getStore()
    store.set('localWeb3', null)
    store.set('localWeb3Address', '')
    store.set('localWeb3Network', '')
    store.set('space', null)
    store.set('convert.transactions', [])
}

export const updateAllowance = async function() {
    const store = getStore()

    const web3 = store.get('localWeb3')
    const walletAddress = store.get('localWeb3Address')
    const adapterAddress = store.get('convert.adapterAddress')
    const wbtcAddress = store.get('wbtcAddress')

    if (!web3 || !walletAddress) {
        return
    }

    const contract = new web3.eth.Contract(erc20ABI, wbtcAddress);
    const allowance = await contract.methods.allowance(walletAddress, adapterAddress).call();

    // console.log('allowance', allowance)

    store.set('convert.adapterWbtcAllowance', Number(parseInt(allowance.toString()) / 10 ** 8).toFixed(8))
}

export const setWbtcAllowance = async function() {
    const store = getStore()
    const walletAddress = store.get('localWeb3Address')
    const web3 = store.get('localWeb3')
    const adapterAddress = store.get('convert.adapterAddress')
    const wbtcAddress = store.get('wbtcAddress')

    const contract = new web3.eth.Contract(erc20ABI, wbtcAddress)
    store.set('convert.adapterWbtcAllowanceRequesting', true)
    try {
        await contract.methods.approve(adapterAddress, web3.utils.toWei('1000000000000000000')).send({
            from: walletAddress
        })
        updateAllowance();
        store.set('convert.adapterWbtcAllowanceRequesting', false)
    } catch(e) {
        // console.log(e)
        store.set('convert.adapterWbtcAllowanceRequesting', false)
    }
}

export const updateBalance = async function() {
    const store = getStore()

    const web3 = store.get('localWeb3')
    const walletAddress = store.get('localWeb3Address')
    const wbtcAddress = store.get('wbtcAddress')

    if (!web3 || !walletAddress) {
        return
    }

    const contract = new web3.eth.Contract(erc20ABI, wbtcAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const ethBal = await web3.eth.getBalance(walletAddress);

    store.set('ethBalance', Number(web3.utils.fromWei(ethBal)).toFixed(8))
    store.set('wbtcBalance', Number(parseInt(balance.toString()) / 10 ** 8).toFixed(8))
    store.set('loadingBalances', false)
}

export const watchWalletData = async function() {
    const store = getStore()
    if (walletDataInterval) {
        clearInterval(walletDataInterval)
    }
    await updateAllowance()
    await updateBalance()
    walletDataInterval = setInterval(async () => {
        await updateAllowance()
        await updateBalance()
    }, 10 * 1000)
}

export const initDataWeb3 = async function() {
   const store = getStore()
   const network = store.get('selectedNetwork')
   store.set('dataWeb3', new Web3(`https://${network === 'testnet' ? 'kovan' : 'mainnet'}.infura.io/v3/6de9092ee3284217bb744cc1a6daab94`))
}

export const initLocalWeb3 = async function() {
    const store = getStore()
    const selectedNetwork = store.get('selectedNetwork')
    const db = store.get('db')
    const fsUser = store.get('fsUser')
    const disclosureAccepted = store.get('disclosureAccepted')

    const providerOptions = {}

    const web3Modal = new Web3Modal({
        network: selectedNetwork === 'testnet' ? 'kovan' : 'mainnet', // optional
        cacheProvider: false, // optional
        providerOptions // required
    })

    const provider = await web3Modal.connect()
    const web3 = new Web3(provider)
    const currentProvider = web3.currentProvider
    const accounts = await web3.eth.getAccounts()
    const address = accounts[0]
    const addressLowerCase = address.toLowerCase()

    store.set('walletConnectError', false)

    let network = ''
    if (currentProvider.networkVersion === '1') {
        network = 'mainnet'
    } else if (currentProvider.networkVersion === '42' ||
      (currentProvider.authereum && currentProvider.authereum.networkId === 42)) {
        network = 'testnet'
    }

    if (network !== selectedNetwork) {
        store.set('showNetworkModal', true)
        return
    }

    store.set('localWeb3', web3)
    store.set('localWeb3Address', address)
    store.set('localWeb3Network', network)

    // recover from localStorage
    const lsData = localStorage.getItem('convert.transactions')
    const lsTransactions = lsData ? JSON.parse(lsData) : []
    const lsIds = lsTransactions.map(t => t.id)

    try {
        store.set('loadingTransactions', true)

        if (!disclosureAccepted) {
            const ok = window.confirm('Please take note that this is beta software and is provided on an "as is" and "as available" basis. WBTC Cafe does not give any warranties and will not be liable for any loss, direct or indirect through continued use of this site.')

            store.set('disclosureAccepted', ok)

            if (!ok) {
                throw new Error('Disclosure declined')
            }
        }

        let signature = ''

        // get from local storage if user has signed in already
        const localSigMap = localStorage.getItem('sigMap')
        const localSigMapData = localSigMap ? JSON.parse(localSigMap) : {}
        if (localSigMapData[addressLowerCase]) {
            signature = localSigMapData[addressLowerCase]
        } else {
            // get unique wallet signature for firebase backup
            signature = await web3.eth.personal.sign(web3.utils.utf8ToHex("Signing in to WBTC Cafe"), addressLowerCase)
            localSigMapData[addressLowerCase] = signature
            localStorage.setItem('sigMap', JSON.stringify(localSigMapData))
        }

        store.set('fsSignature', signature)

        // update user collection
        const doc = await db.collection("users").doc(fsUser.user.uid)
        const docData = await doc.get()
        // console.log(docData)
        if (docData.exists) {
            const data = docData.data()
            if (data.signatures.indexOf(signature) < 0) {
                // add a new signature if needed
                await doc.update({
                    signatures: data.signatures.concat([signature]),
                    updated: firebase.firestore.Timestamp.fromDate(new Date(Date.now()))
                })
            }
        } else {
            // create user
            await doc.set({
                uid: fsUser.user.uid,
                updated: firebase.firestore.Timestamp.fromDate(new Date(Date.now())),
                signatures: [signature]
            })
        }

        setTimeout(async () => {
            try {
                const fsDataSnapshot = await db.collection("transactions")
                    .where("walletSignature", "==", signature).get()

                let fsTransactions = []
                if (!fsDataSnapshot.empty) {
                    fsDataSnapshot.forEach(doc => {
                        const tx = JSON.parse(doc.data().data)
                        fsTransactions.push(tx)
                    })
                }
                const fsIds = fsTransactions.map(f => f.id)

                const uniqueLsTransactions = lsTransactions.filter(ltx => fsIds.indexOf(ltx.id) < 0)
                const transactions = fsTransactions.concat(uniqueLsTransactions)
                store.set('convert.transactions', transactions)

                store.set('fsEnabled', true)
                store.set('loadingTransactions', false)

                // if (network === 'testnet') {
                  watchWalletData()
                  gatherFeeData()
                  initMonitoring()
                // }

                // listen for changes
                currentProvider.on('accountsChanged', async () => {
                    window.location.reload()
                    // resetWallet()
                    // initLocalWeb3()
                })

                currentProvider.on('chainChanged', async () => {
                    window.location.reload()
                    // resetWallet()
                    // initLocalWeb3()
                })

                currentProvider.on('networkChanged', async () => {
                    window.location.reload()
                    // resetWallet()
                    // initLocalWeb3()
                })
            } catch(e) {
              store.set('loadingTransactions', false)
              store.set('walletConnectError', true)
              console.log(e)
            }
        }, 1000)
    } catch(e) {
        store.set('loadingTransactions', false)
        store.set('walletConnectError', true)
        console.log(e)
    }

    return
}

export const setAddresses = async function() {
    const store = getStore()
    const network = store.get('selectedNetwork')
    if (network === 'testnet') {
        store.set('convert.adapterAddress', ADAPTER_TEST)
        store.set('wbtcAddress', WBTC_TEST)
    } else {
        store.set('convert.adapterAddress', ADAPTER_MAIN)
        store.set('wbtcAddress', WBTC_MAIN)
    }
}

export const setNetwork = async function(network) {
    const store = getStore()
    store.set('selectedNetwork', network)
    store.set('sdk', new RenSDK(network))

    setAddresses.bind(this)()
}

window.setWbtcAllowance = setWbtcAllowance

export default {
    resetWallet,
    setNetwork,
    updateBalance
}
