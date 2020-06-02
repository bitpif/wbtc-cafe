import Web3 from "web3";
import RenSDK from "@renproject/ren";
import Box from '3box';
import Web3Modal from 'web3modal'

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
    gatherFeeData
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
   store.set('dataWeb3', new Web3(`https://${network === 'testnet' ? 'kovan' : 'mainnet'}.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2`))
}

export const initLocalWeb3 = async function() {
    const store = getStore()
    const selectedNetwork = store.get('selectedNetwork')
    store.set('spaceError', false)

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
    store.set('localWeb3Address', accounts[0])
    store.set('localWeb3Network', network)

    console.log(currentProvider);

    try {
        // // recover transactions from 3box
        // const box = await Box.openBox(accounts[0], currentProvider)
        // const space = await box.openSpace("wbtc-cafe")
        // const txData = await space.public.get('convert.transactions')
        // // console.log('txData', txData)
        // const transactions = txData ? JSON.parse(txData) : []
        // store.set('convert.transactions', transactions)
        // store.set('space', space)
        // window.space = space

        // recover from localStorage
        const txData = localStorage.getItem('convert.transactions')
        const transactions = txData ? JSON.parse(txData) : []
        store.set('convert.transactions', transactions)

        // if (network === 'testnet') {
          watchWalletData()
          gatherFeeData()
          initMonitoring()
        // }

        // listen for changes
        currentProvider.on('accountsChanged', async () => {
            resetWallet()
            initLocalWeb3()
        })

        currentProvider.on('chainChanged', async () => {
            resetWallet()
            initLocalWeb3()
        })

        currentProvider.on('networkChanged', async () => {
            resetWallet()
            initLocalWeb3()
        })
    } catch(e) {
        store.set('spaceError', true)
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
