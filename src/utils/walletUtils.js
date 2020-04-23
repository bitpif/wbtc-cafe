import Web3 from "web3";
import RenSDK from "@renproject/ren";
import DetectNetwork from "web3-detect-network";
import Box from '3box';
import Portis from '@portis/web3';
import Torus from "@toruslabs/torus-embed";
import Web3Modal from 'web3modal'
import Authereum from "authereum"
import Fortmatic from "fortmatic";

import BTC from '../assets/btc.png'
import ETH from '../assets/eth.png'
import ZEC from '../assets/zec.jpg'
import DAI from '../assets/dai.png'
import USDC from '../assets/usdc.png'
import WBTC from '../assets/wbtc.png'

import {
    ZBTC_MAIN,
    ZBTC_TEST,
    ADAPTER_MAIN,
    ADAPTER_TEST,
    BTC_SHIFTER_MAIN,
    BTC_SHIFTER_TEST
} from './web3Utils'

import {
    initMonitoring
} from './txUtils'

import { getStore } from '../services/storeService'

import zbtcABI from "./zbtcABI.json";

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

export const initLocalWeb3 = async function() {
    const store = getStore()

    const providerOptions = {
        authereum: {
            package: Authereum, // required
            options: {
                networkName: 'kovan'
            }
        },
        torus: {
            package: Torus, // required
            options: {
                network: {
                    host: 'kovan'
                }
            }
        },
        fortmatic: {
            package: Fortmatic, // required
            options: {
                key: "pk_test_D12A04424946656D" // required
            }
        }
    }

    const web3Modal = new Web3Modal({
        network: "kovan", // optional
        cacheProvider: false, // optional
        providerOptions // required
    })

    console.log('web3Modal', web3Modal)

    const provider = await web3Modal.connect()
    const web3 = new Web3(provider)
    const accounts = await web3.eth.getAccounts()
    let network = ''
    if (web3.currentProvider.networkVersion === '1') {
        network = 'mainnet'
    } else if (web3.currentProvider.networkVersion === '42') {
        network = 'testnet'
    }

    store.set('localWeb3', web3)
    store.set('localWeb3Address', accounts[0])
    store.set('localWeb3Network', network)

    if (network === 'testnet') {
        // updateWalletData.bind(this)()
        initMonitoring()
    }

    if (window.ethereum) {
        window.ethereum.on('accountsChanged', function (accounts) {
            store.set('localWeb3Address', accounts[0])
        })
    }

    // // recover transactions from 3box
    // const box = await Box.openBox(accounts[0], web3.currentProvider)
    // const space = await box.openSpace("interops")
    // const txData = await space.public.get('convert.transactions')
    // const transactions = txData ? JSON.parse(txData) : []
    // store.set('convert.transactions', transactions)
    // window.space = space

    return
}

export const resetWallet = async function() {
    const {
        store
    } = this.props
    store.set('walletType', '')
    store.set('walletAddress', '')
    store.set('walletLoading', false)
    store.set('transactions', [])
}

export const updateBalance = async function() {
    const store = this.props.store

    const web3 = store.get('web3')
    const walletAddress = store.get('walletAddress')
    const zbtcAddress = store.get('zbtcAddress')

    if (!web3 || !walletAddress) {
        return
    }
    // else if (web3.eth.accounts[0] && (web3.eth.accounts[0].toLowerCase() !== walletAddress.toLowerCase())) {
    //     // sign out when wallet switches
    //     resetWallet.bind(this)()
    // }

    // console.log(web3.eth.accounts, walletAddress)

    const contract = new web3.eth.Contract(zbtcABI, zbtcAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const ethBal = await web3.eth.getBalance(walletAddress);

    // console.log('update balance', balance, ethBal)

    if (!ethBal) return

    store.set('ethBalance', Number(web3.utils.fromWei(ethBal)).toFixed(8))
    store.set('btcBalance', parseInt(balance.toString()) / 10 ** 8)
    store.set('loadingBalances', false)
}

export const setNetwork = async function(network) {
    const {
        store
    } = this.props
    store.set('selectedNetwork', network)
    store.set('showNetworkMenu', false)

    setAddresses.bind(this)()
    resetWallet.bind(this)()
}

export const setAddresses = async function() {
    const {
        store
    } = this.props
    const network = store.get('selectedNetwork')
    if (network === 'testnet') {
        store.set('zbtcAddress', ZBTC_TEST)
        store.set('btcShifterAddress', BTC_SHIFTER_TEST)
        store.set('adapterAddress', ADAPTER_TEST)
    } else {
        store.set('zbtcAddress', ZBTC_MAIN)
        store.set('btcShifterAddress', BTC_SHIFTER_MAIN)
        store.set('adapterAddress', ADAPTER_MAIN)
    }
}

export const initBrowserWallet = async function() {
    const store = this.props.store

    store.set('showSignIn', true)
    store.set('walletLoading', true)
    store.set('walletConnectMessage', 'Connecting Metamask wallet...')

    let web3Provider;

    // Initialize web3 (https://medium.com/coinmonks/web3-js-ethereum-javascript-api-72f7b22e2f0a)
    // Modern dApp browsers...
    if (window.ethereum) {
        web3Provider = window.ethereum;
        try {
            // Request account access
            await window.ethereum.enable();
        } catch (error) {
            // User denied account access...
            // console.error("User denied account access")
        }
    }
    // Legacy dApp browsers...
    else if (window.web3) {
        web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
        this.log("Please install MetaMask!");
    }

    const network = store.get('selectedNetwork')
    const web3Network = await DetectNetwork(web3Provider)

    if (network === 'testnet' && web3Network.type !== 'kovan') {
        store.set('walletLoading', false)
        store.set('walletConnectMessage', 'Please set your Metamask to the Kovan network to continue.')
        return
    } else if (network === 'mainnet' && web3Network.type !== 'mainnet') {
        store.set('walletLoading', false)
        store.set('walletConnectMessage', 'Please set your Metamask to the Mainnet network to continue.')
        return
    }

    const web3 = new Web3(web3Provider);
    const walletType = 'browser'
    const accounts = await web3.eth.getAccounts()
    const sdk = new RenSDK(network === 'testnet' ? 'testnet' : 'chaosnet')

    // console.log('init browser', web3, sdk)

    // this.signAndSubmit()

    await window.ethereum.enable();

    try {
        store.set('walletConnectMessage', 'Connecting to 3Box...')

        const box = await Box.openBox(window.ethereum.selectedAddress, window.ethereum)
        const space = await box.openSpace("roundabout")
        const txData = await space.public.get('transactions')
        const transactions = txData ? JSON.parse(txData) : []

        store.set('walletLoading', false)
        store.set('walletConnectMessage', '')
        store.set('walletAddress', accounts[0])
        store.set('web3', web3)
        store.set('sdk', sdk)
        store.set('walletType', walletType)
        store.set('box', box)
        store.set('space', space)
        store.set('transactions', transactions)

        // for debugging
        window.txs = transactions

        store.set('showSignIn', false)

        updateBalance.bind(this)();
        initMonitoring.bind(this)()
    } catch (e) {
        store.set('walletConnectMessage', '')
        store.set('walletLoading', false)
        store.set('showSignIn', false)
    }

    window.ethereum.on('accountsChanged', (accounts) => {
        resetWallet.bind(this)()
        store.set('showSignIn', true)
    })
}

export const initPortis = async function() {
    const store = this.props.store
    store.set('walletLoading', true)
    store.set('walletConnectMessage', 'Connecting Portis wallet...')

    const network = store.get('selectedNetwork')
    const portis = new Portis('682fbfbd-b17a-4a81-92bb-83b381013d08', network === 'testnet' ? 'kovan' : 'mainnet');
    const web3 = new Web3(portis.provider);
    const walletType = 'portis'
    const accounts = await web3.eth.getAccounts()
    const sdk = new RenSDK(network === 'testnet' ? 'testnet' : 'chaosnet')

    // console.log('init portis', portis, web3, accounts)

    try {
        store.set('walletConnectMessage', 'Connecting to 3Box...')

        const box = await Box.openBox(accounts[0], portis.provider)
        const space = await box.openSpace("roundabout")
        const txData = await space.public.get('transactions')
        const transactions = txData ? JSON.parse(txData) : []

        store.set('walletLoading', false)
        store.set('walletConnectMessage', '')
        store.set('walletAddress', accounts[0])
        store.set('web3', web3)
        store.set('sdk', sdk)
        store.set('walletType', walletType)
        store.set('space', space)
        store.set('box', box)
        store.set('transactions', transactions)
        store.set('showSignIn', false)

        // for debugging
        window.txs = transactions

        updateBalance.bind(this)();
        initMonitoring.bind(this)()

    } catch (e) {
        store.set('walletConnectMessage', '')
        store.set('walletLoading', false)
        store.set('showSignIn', false)
        return
    }
}

export const initTorus = async function() {
    const store = this.props.store
    store.set('walletLoading', true)
    store.set('walletConnectMessage', 'Connecting Torus wallet...')

    const torus = new Torus({
        buttonPosition: 'top-left' // default: bottom-left
    });

    const network = store.get('selectedNetwork')

    const torusConfig = network === 'testnet' ? {
        buildEnv: 'production', // default: production
        enableLogging: true, // default: false
        network: {
            host: 'kovan', // default: mainnet
            chainId: 42, // default: 1
            networkName: 'Kovan Test Network' // default: Main Ethereum Network
        },
        showTorusButton: false // default: true
    } : {
        buildEnv: 'production', // default: production
        enableLogging: true, // default: false
        network: {
            host: 'mainnet', // default: mainnet
            chainId: 1, // default: 1
            networkName: 'Main Ethereum Network' // default: Main Ethereum Network
        },
        showTorusButton: false // default: true
    }

    await torus.init(torusConfig);
    await torus.login(); // await torus.ethereum.enable()
    const web3 = new Web3(torus.provider);
    const walletType = 'torus'
    const accounts = await web3.eth.getAccounts()
    const sdk = new RenSDK(network === 'testnet' ? 'testnet' : 'chaosnet')

    try {
        store.set('walletConnectMessage', 'Connecting to 3Box...')
        const box = await Box.openBox(accounts[0], torus.provider)
        const space = await box.openSpace("roundabout")
        const txData = await space.public.get('transactions')
        const transactions = txData ? JSON.parse(txData) : []

        store.set('walletLoading', false)
        store.set('walletConnectMessage', '')
        store.set('walletAddress', accounts[0])
        store.set('web3', web3)
        store.set('sdk', sdk)
        store.set('walletType', walletType)
        store.set('space', space)
        store.set('box', box)
        store.set('transactions', transactions)

        // for debugging
        window.txs = transactions

        store.set('showSignIn', false)

        updateBalance.bind(this)();
        initMonitoring.bind(this)()
    } catch (e) {
        store.set('walletConnectMessage', '')
        store.set('walletLoading', false)
        store.set('showSignIn', false)
    }
}



export default {
    initBrowserWallet,
    resetWallet,
    setNetwork,
    updateBalance
}
