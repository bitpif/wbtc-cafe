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
import AssetChooserContainer from './containers/AssetChooserContainer'
import StackedAreaChart from './components/StackedAreaChart'
import TransactionsTableContainer from './containers/TransactionsTableContainer'



import { initBrowserWallet } from './utils/walletUtils'

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
    ADAPTER_MAIN,
    ADAPTER_TEST,
    BTC_SHIFTER_MAIN,
    BTC_SHIFTER_TEST
} from './utils/web3Utils'

const client = new ApolloClient({
  // uri: process.env.REACT_APP_GRAPHQL_ENDPOINT,
  uri: 'https://api.thegraph.com/subgraphs/name/amcassetti/interop-stats',
  cache: new InMemoryCache(),
})

const TRANSACTIONS_QUERY = gql`
  query days {
    days(orderBy: _timestamp, orderDirection: asc, first: 1000) {
      id
      _wbtc
      _sbtc
      _imbtc
      _timestamp
    }
  }
`

// const TRANSACTIONS_QUERY = gql`
//   query transactions {
//     transactions(orderBy: _timestamp, orderDirection: asc, first: 1000) {
//       id
//       _asset
//       _type
//       _amount
//       _timestamp
//     }
//   }
// `

function gatherData(data) {
    let totals = {
        wBTC: 0,
        imBTC: 0,
        sBTC: 0,
        pBTC: 0,
        renBTC: 0
    }

    return data.sort((a,b) => (a._timestamp - b._timestamp))
      .map(d => {
          ['wBTC', 'imBTC', 'sBTC', 'pBTC', 'renBTC'].map(k => {
              const id = '_' + k.toLowerCase()
              if (!d[id]) {
                return
              }
              const amount = k === 'sBTC' ? Number(d[id]) / 10**18 : Number(d[id]) / 100000000
              totals[k] = amount
              d = Object.assign(d, totals)
          })
          // // console.log(totals)
          d._timestamp = Number(d._timestamp)
          return d
      })
}


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
    borderLeft: '0.5px solid ' + theme.palette.divider,
    borderRight: '0.5px solid ' + theme.palette.divider
  },
  footerContainer: {
    borderTop: '0.5px solid ' + theme.palette.divider,
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    fontSize: 10
  },
  transfersContainer: {
    borderTop: '0.5px solid ' + theme.palette.divider,
    padding: theme.spacing(3)
  },
})

const initialState = {
    // networking
    zbtcAddress: ZBTC_TEST,
    btcShifterAddress: BTC_SHIFTER_TEST,
    adapterAddress: ADAPTER_TEST,
    selectedNetwork: 'testnet',

    // wallet
    walletType: '',
    walletAddress: '',
    walletLoading: false,
    loadingBalances: true,
    btcBalance: 0,
    ethBalance: 0,
    sdk: new RenSDK("testnet"),
    web3: null,
    box: null,
    space: null,

    localWeb3: null,
    localWeb3Address: '',
    localWeb3Network: '',

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
    btcTxFeeEstimate: '',
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
    'convert.transactions': [],
    'convert.pendingConvertToEthereum': [],
    'convert.selectedFormat': 'renbtc',
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
        // recover transactions from local storage
        const store = this.props.store
        const localItems = localStorage.getItem('convert.transactions')
        const transactions = localItems ? JSON.parse(localItems) : []
        store.set('convert.transactions', transactions)
    }

    render() {
        const classes = this.props.classes
        storeListener(this.props.store)

        return (
          <ThemeProvider theme={theme}>
                <SignInContainer />
                <DepositModalContainer />
                <CancelModalContainer />
                <NavContainer />
                  <Container size='lg'>
                    <Grid container className={classes.contentContainer}>
                      <Grid item sm={12} md={4}>
                        <AboutModalContainer />
                        <BalanceContainer />
                        <Grid item xs={12}>
                            <AssetChooserContainer />
                            <TransferContainer />
                        </Grid>
                      </Grid>
                      <Grid item sm={12} md={8} className={classes.chartContainer}>
                        <Typography variant='subtitle1'><b>Circulating Supply</b></Typography>
                        {<Query
                          query={TRANSACTIONS_QUERY}
                          variables={{
                          }}
                        >
                          {({ data, error, loading }) => {
                            // console.log('Query result', data, error, loading)
                            return loading ? (
                              <span></span>
                            ) : error ? (
                              <span>Error</span>
                            ) : (
                              <StackedAreaChart data={gatherData(data.days)} />
                            )
                          }}
                        </Query>}
                      </Grid>
                      <Grid item sm={12} className={classes.transfersContainer}>
                        <TransactionsTableContainer />
                      </Grid>
                    </Grid>
                </Container>
                <Grid container className={classes.footerContainer}>
                  <Container size='lg'>
                    <Grid container>
                      <Grid item xs={12}>
                        <Typography variant='caption'>Copyright © Interops 2020</Typography>
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
            <ApolloProvider client={client}>
                <AppWrapperComponent classes={classes}/>
            </ApolloProvider>
        );
    }
}

export default createStore(withStyles(styles)(App), initialState)
