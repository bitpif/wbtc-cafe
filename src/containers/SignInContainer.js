import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import DetectNetwork from "web3-detect-network";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { resetWallet, setNetwork } from '../utils/walletUtils'
// import { resetWallet, setNetwork } from '../utils/walletUtils'

import Web3 from "web3";
import EthCrypto from 'eth-crypto'
import Box from '3box';
import Portis from '@portis/web3';
import Torus from "@toruslabs/torus-embed";

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import CircularProgress from '@material-ui/core/CircularProgress';
import WifiIcon from '@material-ui/icons/Wifi';

import CurrencyInput from '../components/CurrencyInput';
import TransactionItem from '../components/TransactionItem';

import MetamaskIcon from '../assets/metamask.svg';
import PortisIcon from '../assets/portis.svg';
import WalletConnectIcon from '../assets/wallet-connect.svg';
import FortmaticIcon from '../assets/fortmatic.svg';
import TorusIcon from '../assets/torus.svg';

//
// import adapterDelegatedABI from "../utils/adapterDelegatedABI.json";
//
// const adapterDelegatedAddress = '0xA7d1D2b4755E9D578D13e06b5b2796d870F6867a'
// const adapterAddress = '0x5e822a5a9c5cd9b3444228697d319a9f94b83b98'
//
// const contractAddress = '0xe2590f8b8ddad007c936e43a6ab4f464922b1e8d' // adapter.sol
// const vestingAddress = '0x4e4b23e74D203c7009c6a9FFf7751d1fd611F187'
// const zbtcContractAddress = "0xc6069e8dea210c937a846db2cebc0f58ca111f26";
// const registryAddress = '0xbA563a8510d86dE95F5a50007E180d6d4966ad12'
// const uniswapExchangeAddress = '0x2f177704b7ceb1fa56c8956479f321b56ad9e3b4'
// const uniswapFactoryAddress = '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30'
// const zbtcUniswapExchangeAddress = '0x66Cf36abceb7f36640000C41dc626afC203180cF'
// const kovanUniswapFactory = "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30"
// const buttonChangerAddress = '0x1d45ed651788f1043564a9361fc8962bafe20186'
// const buttonChangerLiteAddress = '0x8040d61b43502b249248fc34a2e377d0ae8ad5cf'
// const basicVerifyAddress = '0x93ac46df2436b2578003568c7c043080935c0df6'



const styles = () => ({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(2),
      [theme.breakpoints.down('xs')]: {
          overflowY: 'scroll',
          overflowX: 'hidden',
          alignItems: 'flex-start'
      }
    },
    modalContent: {
      backgroundColor: '#fff',
      width: 360,
      maxWidth: '100%',
      padding: theme.spacing(2)
    },
    signInInput: {
      width: '100%'
    },
    title: {
    },
    titleContainer: {
      marginBottom: theme.spacing(3),
    },
    connectWalletPrompt: {
        padding: theme.spacing(1),
        // width: '100%',
        // paddingBottom: theme.spacing(1),
        // border: '1px solid ' +  theme.palette.grey['300'],
        borderRadius: theme.shape.borderRadius,
        // borderBottomLeftRadius: 0,
        // borderBottomRightRadius: 0,
        // marginBottom: theme.spacing(2),
        // border: '1px solid #EBEBEB',
        '& img': {
            height: 35,
            width: 'auto',
            marginRight: theme.spacing(1)
        },

        // background: '#141e30',
        // background: '-webkit-linear-gradient(to right, #141e30, #243b55)',
        // background: 'linear-gradient(to right, #141e30, #243b55)'
    },
    networkButton: {
        marginBottom: theme.spacing(3),
        textTransform: 'capitalize'
    },
    disabled: {
        opacity: 0.5,
        cursor: 'normal',
        pointerEvents: 'none'
    },
    walletOption: {
      padding: theme.spacing(2),
      borderRadius: 5,
      // color: '#fff',
      '& h6': {
          // marginTop: theme.spacing(1)
      },
      '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          // backgroundColor: theme.palette.grey['100'],
          cursor: 'pointer',
      }
    },
    spinner: {
      marginRight: theme.spacing(0.75),
      marginTop: 2
    }
})

class SignInContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
    }

    anchorRef = React.createRef()

    toggleNeworkMenu() {
        const { store } = this.props
        const showNetworkMenu = store.get('showNetworkMenu')
        store.set('showNetworkMenu', !showNetworkMenu)
    }

    // async initPortis() {
    //     const store = this.props.store
    //     store.set('walletLoading', true)
    //
    //     const network = store.get('selectedNetwork')
    //     const portis = new Portis('682fbfbd-b17a-4a81-92bb-83b381013d08', 'kovan');
    //     const web3 = new Web3(portis.provider);
    //     const walletType = 'portis'
    //     const accounts = await web3.eth.getAccounts()
    //     const sdk = new RenSDK(network === 'testnet' ? 'testnet' : 'chaosnet')
    //
    //     console.log('init portis', portis, web3, accounts)
    //
    //     try {
    //         const box = await Box.openBox(accounts[0], portis.provider)
    //         const space = await box.openSpace("roundabout")
    //         const txData = await space.public.get('transactions')
    //         const transactions = txData ? JSON.parse(txData) : []
    //
    //         store.set('walletLoading', false)
    //         store.set('walletAddress', accounts[0])
    //         store.set('web3', web3)
    //         store.set('sdk', sdk)
    //         store.set('walletType', walletType)
    //         store.set('space', space)
    //         store.set('box', box)
    //
    //         store.set('showSignIn', false)
    //
    //     } catch(e) {
    //         store.set('walletLoading', false)
    //         store.set('showSignIn', false)
    //         return
    //     }
    //     // portis.showPortis()
    //
    //     // window.mportis = portis
    //     // this.props.store.setAll({
    //     //     walletLoading: false,
    //     //     walletAddress: accounts[0]
    //     // })
    //     //
    //     // // this.setState({ web3, walletType, space: {}, box: {} }, () => {
    //     // this.props.store.setAll({ web3, walletType, space, box }, () => {
    //     //     // Update balances immediately and every 10 seconds
    //     //     // this.updateBalance();
    //     //     // setInterval(() => {
    //     //     //     this.updateBalance();
    //     //     // }, 10 * 1000);
    //     // });
    // }
    //
    // async initTorus() {
    //     const store = this.props.store
    //     store.set('walletLoading', true)
    //
    //     const torus = new Torus({
    //         buttonPosition: 'top-left' // default: bottom-left
    //     });
    //
    //     await torus.init({
    //         buildEnv: 'production', // default: production
    //         enableLogging: true, // default: false
    //         network: {
    //         host: 'kovan', // default: mainnet
    //         chainId: 42, // default: 1
    //         networkName: 'Kovan Test Network' // default: Main Ethereum Network
    //         },
    //         showTorusButton: false // default: true
    //     });
    //     await torus.login(); // await torus.ethereum.enable()
    //     const network = store.get('selectedNetwork')
    //     const web3 = new Web3(torus.provider);
    //     const walletType = 'torus'
    //     const accounts = await web3.eth.getAccounts()
    //     const sdk = new RenSDK(network === 'testnet' ? 'testnet' : 'chaosnet')
    //
    //     try {
    //         const box = await Box.openBox(accounts[0], torus.provider)
    //         const space = await box.openSpace("roundabout")
    //         const txData = await space.public.get('transactions')
    //         const transactions = txData ? JSON.parse(txData) : []
    //
    //         store.set('walletLoading', false)
    //         store.set('walletAddress', accounts[0])
    //         store.set('web3', web3)
    //         store.set('sdk', sdk)
    //         store.set('walletType', walletType)
    //         store.set('space', space)
    //         store.set('box', box)
    //         store.set('transactions', transactions)
    //
    //         store.set('showSignIn', false)
    //     } catch(e) {
    //         store.set('walletLoading', false)
    //         store.set('showSignIn', false)
    //     }
    // }

    // async watchBalance() {
    //   await this.updateBalance();
    //   setInterval(() => {
    //       this.updateBalance();
    //   }, 10 * 1000);
    // }
    //
    // async updateBalance() {
    //     const { web3, space, localAddress } = this.state;
    //
    //     if (!localAddress) {
    //       return
    //     }
    //
    //     // const contract = new web3.eth.Contract(zbtcABI, zbtcContractAddress);
    //     // const balance = await contract.methods.balanceOf(walletAddress).call();
    //
    //     // const contract = new web3.eth.Contract(ABI, contractAddress);
    //     const contract = new web3.eth.Contract(adapterDelegatedABI, adapterDelegatedAddress);
    //     // const balance = await contract.methods.balance().call();
    //     const balance = await contract.methods.balanceOf(localAddress).call();
    //
    //     const accounts = await web3.eth.getAccounts()
    //     const ethBal = await web3.eth.getBalance(localAddress); //Will give value in.
    //
    //     // console.log(accounts, ethBal)
    //
    //     this.setState({
    //         ethBalance: Number(web3.utils.fromWei(ethBal)).toFixed(8),
    //         btcBalance: parseInt(balance.toString()) / 10 ** 8,
    //         walletAddress: accounts[0],
    //         loadingBalances: false
    //     });
    //
    //     // const pending = await space.public.get('transactions')
    //     // console.log('get space', space, pending)
    // }

    render() {
        const {
            classes,
            store
        } = this.props

        const showSignIn = store.get('showSignIn')
        const walletLoading = store.get('walletLoading')
        const walletConnectMessage = store.get('walletConnectMessage')
        const showNetworkMenu = store.get('showNetworkMenu')
        const selectedNetwork = store.get('selectedNetwork')

        const metamaskPossible = window.ethereum || window.web3

        // console.log(this.props, this.state)

        return <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={classes.modal}
          open={showSignIn}
          onClose={() => {
            store.set('showSignIn', false)
          }}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={showSignIn}>
            <Grid container className={classes.modalContent}>

            </Grid>
          </Fade>
        </Modal>
    }
}

export default withStyles(styles)(withStore(SignInContainer))
