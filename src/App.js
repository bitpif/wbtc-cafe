import React from 'react';
import { createStore, withStore } from '@spyna/react-store'
import { storeListener } from './services/storeService'
import queryString from 'query-string'

import NavContainer from './containers/NavContainer'
import TransferContainer from './containers/TransferContainer'
import DepositModalContainer from './containers/DepositModalContainer'
import CancelModalContainer from './containers/CancelModalContainer'
import ViewGatewayContainer from './containers/ViewGatewayContainer'
import NetworkModalContainer from './containers/NetworkModalContainer'
import SwapRevertModalContainer from './containers/SwapRevertModalContainer'
import TransactionsTableContainer from './containers/TransactionsTableContainer'

import { initDataWeb3, setNetwork } from './utils/walletUtils'
import { updateRenVMFees } from './utils/txUtils'


import RenVM from './assets/renvm-powered.svg';

import { withStyles, ThemeProvider } from '@material-ui/styles';
import theme from './theme/theme'
import classNames from 'classnames'

import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Table from '@material-ui/core/Table';

import RenSDK from "@renproject/ren";

import firebase from 'firebase'

import {
    ZBTC_MAIN,
    ZBTC_TEST,
    WBTC_TEST,
    ADAPTER_MAIN,
    ADAPTER_TEST,
    BTC_SHIFTER_MAIN,
    BTC_SHIFTER_TEST,
    CURVE_TEST,
    CURVE_MAIN
} from './utils/web3Utils'

require('dotenv').config()

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FB_KEY,
  authDomain: window.location.hostname,
  projectId: 'wbtc-portal'
})

// firebase.firestore().enablePersistence()

const styles = () => ({
  container: {
    maxWidth: 450
  },
  contentContainer: {
    paddingTop: theme.spacing(3)
  },
  footerContainer: {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    fontSize: 10,
    '& a': {
        color: '#333',
        marginRight: theme.spacing(2)
    }
  },
  footerLogo: {
    height: 32,
    width: 'auto',
    marginRight: theme.spacing(2),
    // border: '1px solid ' + theme.palette.divider,
    // borderRadius: 4
  },
  transfersContainer: {
    padding: theme.spacing(3)
  },
  disclosure: {
      '& div': {
          border: '0.5px solid ' + theme.palette.divider,
          background: '#fff',
          // height: '100%',
          paddingTop: theme.spacing(1.5),
          paddingBottom: theme.spacing(1),
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2),
          fontSize: 12
      },
      // '& '
  }
})

const initialState = {
    // networking
    wbtcAddress: '',
    adapterAddress: '',
    selectedNetwork: '',

    // wallet & web3
    dataWeb3: null,
    localWeb3: null,
    localWeb3Address: '',
    localWeb3Network: '',
    walletConnectError: false,
    box: null,
    space: null,
    spaceError: false,
    loadingBalances: true,
    wbtcBalance: 0,
    ethBalance: 0,
    sdk: null,
    fees: null,
    queryParams: {},
    db: firebase.firestore(),
    fsUser: null,
    fsSignature: null,
    fsEnabled: false,
    loadingTransactions: false,
    disclosureAccepted: false,

    // navigation
    selectedTab: 1,
    selectedAsset: 'btc',

    // modals
    showNetworkMenu: false,
    showDepositModal: false,
    depositModalTx: null,
    depositDisclosureChecked: false,
    showCancelModal: false,
    cancelModalTx: null,
    showGatewayModal: false,
    gatewayModalTx: null,
    showAboutModal: false,
    showSwapRevertModal: false,
    swapRevertModalTx: null,
    swapRevertModalExchangeRate: '',

    // conversions
    'convert.adapterAddress': ADAPTER_TEST,
    'convert.adapterWbtcAllowance': '',
    'convert.adapterWbtcAllowanceRequesting': '',
    'convert.transactions': [],
    'convert.pendingConvertToEthereum': [],
    'convert.selectedFormat': 'wbtc',
    'convert.selectedDirection': 0,
    'convert.amount': '',
    'convert.destination': '',
    'convert.destinationValid': false,
    'convert.exchangeRate': '',
    'convert.networkFee': '',
    'convert.renVMFee': '',
    'convert.conversionTotal': '',
    'convert.maxSlippage': 0.01,
}

class AppWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    async componentDidMount() {
        const store = this.props.store
        const params = queryString.parse(window.location.search)
        store.set('queryParams', params)

        // default to mainnet
        setNetwork(params.network === 'testnet' ? 'testnet' : 'mainnet')

        initDataWeb3()
        updateRenVMFees()
    }

    render() {
        const classes = this.props.classes
        storeListener(this.props.store)
        const selectedNetwork = this.props.store.get('selectedNetwork')

        // console.log(this.props.store.getState())

        return (
          <ThemeProvider theme={theme}>
                <DepositModalContainer />
                <CancelModalContainer />
                <ViewGatewayContainer />
                <NetworkModalContainer />
                <SwapRevertModalContainer />
                <NavContainer />
                  <Container size='lg'>

                    <Grid container className={classes.contentContainer} spacing={2}>
                      <Grid item xs={12} className={classes.disclosure}>
                        <div>
                            <marquee scrollamount={6}>Welcome to the WBTC Cafe! This is a new project, so please use caution.</marquee>
                        </div>
                      </Grid>
                      <Grid item xs={12} sm={12} md={4}>
                        <TransferContainer />
                      </Grid>
                      <Grid item xs={12} sm={12} md={8} className={classes.transfersContainer}>
                        <TransactionsTableContainer />
                      </Grid>
                    </Grid>
                </Container>
                <Grid container className={classes.footerContainer}>
                  <Container size='lg'>
                    <Grid container alignItems='center' justify='flex-start'>
                        <a target='_blank' href={'https://renproject.io'}>
                          <img className={classes.footerLogo} src={RenVM} />
                        </a>
                        <Typography className={classes.footerLinks} variant='caption'><a target='_blank' href={'https://' + (selectedNetwork === 'testnet' ? 'kovan.' : '') + 'etherscan.io/address/' + (selectedNetwork === 'testnet' ? ADAPTER_TEST : ADAPTER_MAIN)}>Contract</a> <a target='_blank' href={'https://' + (selectedNetwork === 'testnet' ? 'kovan.' : '') + 'etherscan.io/address/' + (selectedNetwork === 'testnet' ? CURVE_TEST : CURVE_MAIN)}>Liquidity Pool</a> <a target='_blank' href={'https://www.curve.fi/ren'}>Swap renBTC → WBTC</a></Typography>
                    </Grid>
                  </Container>
                </Grid>
            </ThemeProvider>
        );
    }
}

const AppWrapperComponent = withStore(AppWrapper)

class App extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        const { classes } = this.props
        return (
            <AppWrapperComponent classes={classes}/>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
