import React from 'react';
import Box from '3box';
import { ethers } from 'ethers'
import EthCrypto from 'eth-crypto'
import { createStore, withStore } from '@spyna/react-store'
import ApolloClient, { gql, InMemoryCache } from 'apollo-boost'
import { ApolloProvider, Query } from 'react-apollo'
import { storeListener } from './services/storeService'

import NavContainer from './containers/NavContainer'
import BalanceContainer from './containers/BalanceContainer'
import TransferContainer from './containers/TransferContainer'
import SwapContainer from './containers/SwapContainer'
import SignInContainer from './containers/SignInContainer'
import DepositModalContainer from './containers/DepositModalContainer'
import AboutModalContainer from './containers/AboutModalContainer'
import CancelModalContainer from './containers/CancelModalContainer'
import ViewGatewayContainer from './containers/ViewGatewayContainer'
import AssetChooserContainer from './containers/AssetChooserContainer'
import StackedAreaChart from './components/StackedAreaChart'
import TransactionsTableContainer from './containers/TransactionsTableContainer'

import { initDataWeb3, updateAllowance } from './utils/walletUtils'

import logo from './logo.svg';
// import BitcoinIcon from './bitcoin-simple.svg';
import RoundaboutIcon from './assets/roundabout.svg';
import MetamaskIcon from './assets/metamask.svg';
import PortisIcon from './assets/portis.svg';
import WalletConnectIcon from './assets/wallet-connect.svg';
import FortmaticIcon from './assets/fortmatic.svg';
import RenIcon from './ren.svg';
import CompoundIcon from './compound.svg';

import blueGrey from '@material-ui/core/colors/blueGrey';
import grey from '@material-ui/core/colors/grey';

import { withStyles, ThemeProvider } from '@material-ui/styles';
import theme from './theme/theme'
import classNames from 'classnames'

import Container from '@material-ui/core/Container'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import Table from '@material-ui/core/Table';

import RenSDK from "@renproject/ren";
import isIncognito from "is-incognito";

import {
    ZBTC_MAIN,
    ZBTC_TEST,
    WBTC_TEST,
    ADAPTER_MAIN,
    ADAPTER_TEST,
    BTC_SHIFTER_MAIN,
    BTC_SHIFTER_TEST
} from './utils/web3Utils'

const styles = () => ({
  container: {
    maxWidth: 450
  },
  chartContainer: {
    borderLeft: '0.5px solid ' + theme.palette.divider,
    padding: theme.spacing(3),
    paddingTop: theme.spacing(3.5)
  },
  contentContainer: {
    paddingTop: theme.spacing(3)
    // borderLeft: '0.5px solid ' + theme.palette.divider,
    // borderRight: '0.5px solid ' + theme.palette.divider
  },
  footerContainer: {
    // borderTop: '0.5px solid ' + theme.palette.divider,
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    fontSize: 10
  },
  transfersContainer: {
    // borderTop: '0.5px solid ' + theme.palette.divider,
    padding: theme.spacing(3)
  },
})

const initialState = {
    // networking
    wbtcAddress: WBTC_TEST,
    btcShifterAddress: BTC_SHIFTER_TEST,
    adapterAddress: ADAPTER_TEST,
    selectedNetwork: 'testnet',

    // wallet
    // walletType: '',
    // walletAddress: '',
    // walletLoading: false,

    dataWeb3: null,
    localWeb3: null,
    localWeb3Address: '',
    localWeb3Network: '',
    box: null,
    space: null,
    loadingBalances: true,
    wbtcBalance: 0,
    ethBalance: 0,
    sdk: new RenSDK("testnet"),

    // navigation
    selectedTab: 1,
    selectedAsset: 'btc',

    // modals
    showSignIn: false,
    showNetworkMenu: false,
    showDepositModal: false,
    depositModalTx: null,
    depositDisclosureChecked: false,
    showCancelModal: false,
    cancelModalTx: null,
    showGatewayModal: false,
    gatewayModalTx: null,
    showAboutModal: false,

    // transfers
    depositAmount: 0,
    depositAddress: '',
    withdrawAmount: 0,
    withdrawAddress: '',
    withdrawAddressValid: false,
    transferAmount: 0,
    transferAddress: '',
    transferAddressValid: false,
    selectedTransferTab: 0,
    transactions: [],

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
    'convert.conversionTotal': '',

    // swaps
    'swap.transactions': [],
    'swap.selectedOutputAsset': 'eth',
    'swap.inputAmount': '',
    'swap.outputDestination': ''
}

class AppWrapper extends React.Component {
    constructor(props) {
        super(props);
        this.state = {}
    }

    async componentDidMount() {
        // // recover transactions from local storage
        // const store = this.props.store
        // const localItems = localStorage.getItem('convert.transactions')
        // const transactions = localItems ? JSON.parse(localItems) : []
        // store.set('convert.transactions', transactions)

        initDataWeb3()
        this.watchWalletData()
    }

    async watchWalletData() {
        await updateAllowance();
        setInterval(async () => {
            await updateAllowance();
        }, 10 * 1000);
    }

    render() {
        const classes = this.props.classes
        storeListener(this.props.store)

        return (
          <ThemeProvider theme={theme}>
                <SignInContainer />
                <DepositModalContainer />
                <CancelModalContainer />
                <ViewGatewayContainer />
                <NavContainer />
                  <Container size='lg'>
                    <Grid container className={classes.contentContainer} spacing={2}>
                      <Grid item xs={12} sm={12} md={4}>
                        <AboutModalContainer />
                        <BalanceContainer />
                        <TransferContainer />
                      </Grid>
                      <Grid item xs={12} sm={12} md={8} className={classes.transfersContainer}>
                        <TransactionsTableContainer />
                      </Grid>
                    </Grid>
                </Container>
                <Grid container className={classes.footerContainer}>
                  <Container size='lg'>
                    <Grid container>
                      <Grid item xs={12}>
                        {/*<Typography variant='caption'>Copyright © WBTC Cafe 2020</Typography>*/}
                      </Grid>
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
