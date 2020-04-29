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
    BTC_SHIFTER_TEST,
    WBTC_TEST
} from './web3Utils'

import {
    initMonitoring,
    gatherFeeData
} from './txUtils'

import { getStore } from '../services/storeService'

import erc20ABI from "./erc20ABI.json";

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

export const updateAllowance = async function() {
    const store = getStore()

    const web3 = store.get('localWeb3')
    const walletAddress = store.get('localWeb3Address')

    if (!web3 || !walletAddress) {
        return
    }

    const contract = new web3.eth.Contract(erc20ABI, WBTC_TEST);
    const allowance = await contract.methods.allowance(walletAddress, ADAPTER_TEST).call();

    console.log('allowance', allowance)

    store.set('convert.adapterWbtcAllowance', Number(web3.utils.fromWei(allowance)).toFixed(8))
}

export const setWbtcAllowance = async function() {
    const store = getStore()
    const walletAddress = store.get('localWeb3Address')
    const web3 = store.get('localWeb3')

    const contract = new web3.eth.Contract(erc20ABI, WBTC_TEST)
    store.set('convert.adapterWbtcAllowanceRequesting', true)
    try {
        await contract.methods.approve(ADAPTER_TEST, web3.utils.toWei('1000000000000000000')).send({
            from: walletAddress
        })
        updateAllowance();
        store.set('convert.adapterWbtcAllowanceRequesting', false)
    } catch(e) {
        console.log(e)
        store.set('convert.adapterWbtcAllowanceRequesting', false)
    }
}

export const updateBalance = async function() {
    const store = this.props.store

    const web3 = store.get('localWeb3')
    const walletAddress = store.get('localWeb3Address')
    const wbtcAddress = store.get('wbtcAddress')

    if (!web3 || !walletAddress) {
        return
    }

    const contract = new web3.eth.Contract(erc20ABI, wbtcAddress);
    const balance = await contract.methods.balanceOf(walletAddress).call();
    const ethBal = await web3.eth.getBalance(walletAddress);

    // console.log('update balance', balance, ethBal)
    // if (!ethBal) return

    store.set('ethBalance', Number(web3.utils.fromWei(ethBal)).toFixed(8))
    store.set('wbtcBalance', parseInt(balance.toString()) / 10 ** 8)
    store.set('loadingBalances', false)
}

export const initDataWeb3 = async function() {
   const store = getStore()
   const network = store.get('selectedNetwork')
   store.set('dataWeb3', new Web3(`https://${network === 'testnet' ? 'kovan' : 'mainnet'}.infura.io/v3/7be66f167c2e4a05981e2ffc4653dec2`))
}

export const initLocalWeb3 = async function() {
    const store = getStore()
    store.set('spaceError', false)

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
        store.set('showNetworkModal', true)
        return
    } else if (web3.currentProvider.networkVersion === '42') {
        network = 'testnet'
    }

    store.set('localWeb3', web3)
    store.set('localWeb3Address', accounts[0])
    store.set('localWeb3Network', network)

    try {
        // recover transactions from 3box
        const box = await Box.openBox(accounts[0], web3.currentProvider)
        const space = await box.openSpace("wbtc-cafe")
        const txData = await space.public.get('convert.transactions')
        console.log('txData', txData)
        const transactions = txData ? JSON.parse(txData) : []
        store.set('convert.transactions', transactions)
        store.set('space', space)
        window.space = space

        if (network === 'testnet') {
            // updateWalletData.bind(this)()
            updateAllowance()
            gatherFeeData()
            initMonitoring()
        }

        if (window.ethereum) {
            window.ethereum.on('accountsChanged', function (accounts) {
                store.set('localWeb3Address', accounts[0])
                updateAllowance()
            })
        }
    } catch(e) {
        store.set('spaceError', true)
    }

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

window.setWbtcAllowance = setWbtcAllowance

export default {
    resetWallet,
    setNetwork,
    updateBalance
}
