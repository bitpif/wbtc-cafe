import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { ZBTC_MAIN } from '../utils/web3Utils'
import { updateBalance, initBrowserWallet, NAME_MAP, SYMBOL_MAP, MINI_ICON_MAP } from '../utils/walletUtils'
import zbtcABI from "../utils/erc20ABI.json";
import Web3 from "web3";
import EthCrypto from 'eth-crypto'
import Box from '3box';
import Portis from '@portis/web3';
import Torus from "@toruslabs/torus-embed";

import BitcoinIcon from '../assets/bitcoin-simple.svg';
import EthereumIcon from '../assets/eth-white.svg';
import ZcashIcon from '../assets/zec-white.svg';


import RoundaboutIcon from '../assets/roundabout.svg';
import AccountIcon from '@material-ui/icons/AccountCircle';
import WifiIcon from '@material-ui/icons/Wifi';
import CallMadeIcon from '@material-ui/icons/CallMade';


import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Badge from '@material-ui/core/Badge';

import CurrencyInput from '../components/CurrencyInput';
import TransactionItem from '../components/TransactionItem';


const styles = () => ({
    container: {
        // padding: theme.spacing(3),
        // paddingTop: theme.spacing(4),
        // paddingBottom: theme.spacing(0)
    },
    actionTabs: {
      // margin: '0px auto',
      borderBottom: '1px solid #eee',
      width: '100%',
      '& button': {
          // color: '#ffffff80',
          '& span': {
              // fontSize: 10,
          },
          paddingLeft: 0,
          paddingRight: theme.spacing(4),
          [theme.breakpoints.down('xs')]: {
              minWidth: 'auto',
              fontSize: 12
          },
          [theme.breakpoints.up('sm')]: {
              minWidth: 'auto',
          },
      },
      '& button.MuiTab-textColorSecondary.Mui-selected': {
          // color: '#fff',
      },
      '& material-icons': {
          fontSize: '1em',
          display: 'none'
      },
      '& span.MuiTabs-indicator': {
          backgroundColor: 'transparent'
      },
      '& .MuiTab-wrapper': {
          alignItems: 'flex-start'
      },
      '& svg': {
          height: '16px',
          width: '20px',
          paddingTop: '1px',
          display: 'block',
          float: 'right'
      }
    },
    tabIcon: {
        height: '1em',
        width: 'auto',
        '& img': {
            height: '100%',
            width: 'auto'
        }
    },
    bitcoinIcon: {
        width: 80,
        height: 'auto',
        marginBottom: theme.spacing(1)
    },
    badge: {
        '& span': {
            fontSize: 9,
            height: 18,
            minWidth: 18,
            backgroundColor: '#fb9200'
        }
    },
    connectButton: {
        top: 8,
        left: 8,
        position: 'absolute'
    },
    aboutButton: {
        top: 8,
        left: 8,
        position: 'absolute'
    },
    balances: {
        position: 'relative',
        // border: '1px solid ' +  theme.palette.grey['300'],
        // minHeight: 185,
        borderRadius: theme.shape.borderRadius,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        '& tr:last-child td': {
            borderBottom: 'none'
        },
        // background: '#f7971e',  /* fallback for old browsers */
        // background: '-webkit-linear-gradient(to right, #f7971e, #ffd200)',  /* Chrome 10-25, Safari 5.1-6 */
        // background: 'linear-gradient(to right, #f7971e, #ffd200)', /* W3C, IE 10+/ Edge, Firefox 16+, Chrome 26+, Opera 12+, Safari 7+ */

        // background: 'linear-gradient(60deg,#ffa726,#fb8c00)',
        // background: 'linear-gradient(60deg,#ffc826,#fb8c00)',

        // marginBottom: theme.spacing(2),
        paddingTop: theme.spacing(1),
        paddingLeft: theme.spacing(3),
        paddingRight: theme.spacing(3),
        paddingBottom: theme.spacing(0),
        // color: '#fff'
    },
    btc: {
        // background: 'linear-gradient(60deg,#ffc826,#fb8c00)'
    },
    eth: {
        // background: 'linear-gradient(60deg,#243B55,#141E30)'
    },
    zec: {
        // background: 'linear-gradient(60deg,#fda510,#29221e)'
    },
    dai: {
        // background: 'linear-gradient(60deg,#56B4D3,#348F50)'
    },
    usdc: {
        // background: 'linear-gradient(60deg,#1488CC,#2B32B2)'
    },
    info: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    accountButton: {
      '& svg': {
        marginRight: theme.spacing(1)
        },
        [theme.breakpoints.down('xs')]: {
            width: '100%',
            marginTop: theme.spacing(2)
        }
    },
    icon: {
        width: 20,
        height: 'auto',
        marginRight: theme.spacing(0.75),
    },
    header: {
        // marginTop: theme.spacing(2),
        // marginBottom: theme.spacing(4),
        padding: theme.spacing(3),
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(2)
    },
    select: {
        display: 'flex',
        alignItems: 'center',
        fontSize: 14
    }
})

const ICON_MAP = {
    btc: BitcoinIcon,
    eth: EthereumIcon,
    zec: ZcashIcon,
    dai: EthereumIcon,
    usdc: EthereumIcon,
}

class BalanceContainer extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {
        // // console.log('balance did mount', window.ethereum, window.ethereum.selectedAddress)
        window.setTimeout(() => {
            // connect to metamask automatically if able
            // if (window.ethereum && window.ethereum.selectedAddress) {
            //     initBrowserWallet.bind(this)()
            // }
            //
            // this.watchBalance()
        }, 10)
    }

    async watchBalance() {
        await updateBalance.bind(this)();
        setInterval(() => {
            updateBalance.bind(this)();
        }, 10 * 1000);
    }

    clearInputs(){
        const { store } = this.props
        store.set('depositAmount', '')
        store.set('withdrawAmount', '')
        store.set('withdrawAddress', '')
        store.set('transferAmount', '')
        store.set('transferAddress', '')
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const walletAddress = store.get('walletAddress')

        const loadingBalances = store.get('loadingBalances')
        const btcBalance = store.get('btcBalance')
        const selectedTab = store.get('selectedTab')
        const selectedAsset = store.get('selectedAsset')
        const showAboutModal = store.get('showAboutModal')
        const transactions = store.get('transactions')
        const depositCount = transactions.filter((t) => (t.type === 'deposit' && t.awaiting)).length
        const withdrawCount = transactions.filter((t) => (t.type === 'withdraw' && t.awaiting)).length

        return <React.Fragment>
            <div className={classes.container}>
                {/*<Grid container justify='space-between' alignItems='center' className={classNames(classes.header)}>
                    <div className={classes.select}>
                        <img src={MINI_ICON_MAP['wbtc']} className={classes.icon} />
                        <span>Wrapped Bitcoin</span>
                    </div>
                    <div>
                        <span>{loadingBalances ? '0.00000000' : Number(btcBalance).toFixed(8)}</span>
                    </div>
                </Grid>*/}
                {/*<Grid container alignItems='center' justify='center' direction='column' className={classNames(classes.balances, classes[selectedAsset])}>
                  <Grid container>
                      <Tabs
                        className={classes.actionTabs}
                        value={selectedTab}
                        onChange={(event, newValue) => {
                            store.set('selectedTab', newValue)
                            this.clearInputs.bind(this)()
                        }}
                        indicatorColor="secondary"
                        textColor="secondary"
                      >
                          <Tab label={`Swap${withdrawCount ? ' (' + withdrawCount + ')' : ''}`} />
                          <Tab label={`Transfer${depositCount ? ' (' + (depositCount + withdrawCount) + ')' : ''}`} />
                          <Tab label={`Stream${depositCount ? ' (' + (depositCount + withdrawCount) + ')' : ''}`} />
                      </Tabs>
                  </Grid>
                </Grid>*/}
            </div>
        </React.Fragment>
    }
}

export default withStyles(styles)(withStore(BalanceContainer))
