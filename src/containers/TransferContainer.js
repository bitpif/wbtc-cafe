import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import sb from "satoshi-bitcoin"
import AddressValidator from "wallet-address-validator";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import {
    addTx,
    updateTx,
    removeTx,
    initMonitoring,
    initConvertToEthereum,
    initConvertFromEthereum,
    initTransfer
} from '../utils/txUtils'
import { MINI_ICON_MAP, initLocalWeb3 } from '../utils/walletUtils'
import Web3 from "web3";
import { ethers } from 'ethers';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import CurrencyInput from '../components/CurrencyInput';
import TransactionItem from '../components/TransactionItem';

import adapterABI from "../utils/adapterABI.json";

const styles = () => ({
    transferActionTabs: {
        margin: '0px auto',
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
        '& div.MuiToggleButtonGroup-root': {
            width: '100%'
        },
        '& button': {
            width: '50%'
        }
    },
    depositAddressContainer: {
        // marginTop: theme.spacing(1)
    },
    depositAddress: {
        width: '100%',
        // marginTop: theme.spacing(1)
    },
    actionButtonContainer: {
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        textAlign: 'center',
        '& button': {
            // minHeight: 64,
            // borderRadius: theme.spacing(1),
            // background: 'linear-gradient(60deg,#ffc826,#fb8c00)',
            // boxShadow: 'none',
            '&.Mui-disabled': {
                // background: '#eee'
            },
            margin: '0px auto',
            fontSize: 12,
            minWidth: 175,
            padding: theme.spacing(1)
        }
    },
    amountField: {
        width: '100%'
    },
    depositButton: {
        // width: '100%'
    },
    withdrawButton: {
        // width: '100%'
        // margin: '0px auto'
    },
    actions: {
        paddingTop: theme.spacing(1),
        padding: theme.spacing(3)
    },
    transactionsContainer: {
        padding: theme.spacing(3),
        paddingTop: theme.spacing(0),
        marginTop: theme.spacing(2),
        borderTop: '1px solid #EBEBEB'
    },
    actionsContainer: {
        // border: '1px solid #EBEBEB',
        // borderTop: '0px solid transparent',
        // padding: theme.spacing(3),
        // paddingTop: 0,
        // border: '1px solid ' +  theme.palette.grey['300'],
        borderRadius: theme.shape.borderRadius,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
    },
    destChooser: {
      width: '100%',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(1),
      '& div.MuiToggleButtonGroup-root': {
          width: '100%'
      },
      '& button': {
          width: '50%'
      }
    },
    fees: {
        width: '100%',
        // borderRadius: 4,
        border: '1px solid ' + theme.palette.divider,
        fontSize: 12,
        padding: theme.spacing(1),
        paddingBottom: 0,
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(3),
        display: 'flex',
        flexDirection:'column',
        '& span': {
            marginBottom: theme.spacing(1)
        }
    },
    icon: {
        width: 16,
        height: 16,
        marginRight: theme.spacing(0.75),
        // marginLeft: theme.spacing(0.75),
    },
    toggle: {
      '& button': {
        minHeight: 'auto'
      }
    },
    title: {
      paddingTop: theme.spacing(2),
      paddingBottom: theme.spacing(3)
    }
})

class TransferContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
    }

    componentDidMount() {
        // for debugging
        window.addTx = addTx.bind(this)
        window.updateTx = updateTx.bind(this)
        window.removeTx = removeTx.bind(this)
        window.store = this.props.store
    }

    showDepositModal(tx) {
        const { store } = this.props
        store.set('showDepositModal', true)
        store.set('depositModalTx', tx)
    }

    async newDeposit() {
        const { store } = this.props
        if (!store.get('localWeb3')) return initLocalWeb3()

        const amount = store.get('convert.amount')
        const destination = store.get('convert.destination')
        const network = store.get('selectedNetwork')
        const asset = store.get('convert.selectedFormat')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            type: 'convert',
            instant: false,
            awaiting: 'btc-init',
            sourceAsset: 'btc',
            sourceNetwork: 'bitcoin',
            sourceNetworkVersion: network,
            destAddress: destination,
            destNetwork: 'ethereum',
            destNetworkVersion: network,
            destAsset: asset,
            amount: amount,
            error: false,
            txHash: ''
        }

        initConvertToEthereum(tx)

        //
        // const btcFeeRates = await fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended');
        // const feeRatesJson = await btcFeeRates.json();
        //
        // // make this smarter
        // store.set('btcTxFeeEstimate', sb.toBitcoin(feeRatesJson.fastestFee * 223))
        //
        // // initDeposit.bind(this)(tx)
        // this.showDepositModal(tx)

    }

    async newWithdraw() {
        // const { withdrawAmount, withdrawAddress, transactions } = this.props.store.getState()
        //
        // const tx = {
        //     id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
        //     network,
        //     type: 'convert',
        //     instant: false,
        //     awaiting: 'eth-init',
        //     destAddress: address,
        //     destNetwork: 'bitcoin',
        //     amount: amount,
        //     error: false,
        //     txHash: ''
        // }
        //
        // initWithdraw.bind(this)(tx)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        // const {
        //     depositAddress,
        //     depositAmount
        // } = this.state

        const walletAddress = store.get('walletAddress')
        const transactions = store.get('transactions')
        const selectedNetwork = store.get('selectedNetwork')
        const selectedTab  = store.get('selectedTab')
        const selectedTransferTab  = store.get('selectedTransferTab')
        const selectedAsset  = store.get('selectedAsset')
        const showAboutModal = store.get('showAboutModal')

        const depositAmount = store.get('depositAmount')
        const withdrawAmount = store.get('withdrawAmount')
        const withdrawAddressValid = store.get('withdrawAddressValid')
        const transferAmount = store.get('transferAmount')
        const transferAddressValid = store.get('transferAddressValid')

        const selectedDirection  = store.get('convert.selectedDirection')

        const localWeb3Address = store.get('localWeb3Address')
        const isSignedIn = localWeb3Address && localWeb3Address.length

        const amount = store.get('convert.amount')
        const fee = (Number(amount) * 0.001).toFixed(6)
        const total = Number(amount-fee).toFixed(6)

        const convertAddressValid = store.get('convert.destinationValid')
        const canConvert = amount > 0 && convertAddressValid


        console.log('transfer render', store.getState())

        return <React.Fragment>
            {selectedTab === 1 && <div className={classes.actionsContainer}>
                <Grid className={classes.actions}>
                    <Grid container justify='center'>
                        <Grid item xs={12} className={classes.title}>
                          <Typography variant='subtitle1'><b>Convert</b></Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Grid container justify='space-between' alignItems='center'>
                              <Typography variant='caption'>Format</Typography>
                              <Button
                                  size="small"
                                  className={classNames(classes.margin, classes.transferAssetButton)}
                                  onClick={()=> {}}>
                                  <img src={MINI_ICON_MAP['btc']} className={classes.icon} />
                                  Ren Bitcoin (renBTC)
                              </Button>
                          </Grid>
                        </Grid>
                        <Grid item xs={12}>

                            {<Grid container className={classes.transferActionTabs}>
                                <ToggleButtonGroup
                                    size='small'
                                    className={classes.toggle}
                                    value={String(selectedDirection)}
                                    exclusive
                                    onChange={(event, newValue) => {
                                        if (newValue) {
                                            store.set('convert.selectedDirection', Number(newValue))
                                            store.set('convert.amount', '')
                                            store.set('convert.destination', '')
                                        }
                                    }}>
                                    <ToggleButton key={0} value={'0'}>
                                      BTC → renBTC
                                    </ToggleButton>
                                    <ToggleButton key={1} value={'1'}>
                                      renBTC → BTC
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>}

                            {selectedDirection === 0 && <React.Fragment>
                                <Grid alignItems="center" container>
                                    <Grid item xs={12}>
                                        <CurrencyInput
                                            onAmountChange={(value)=>{
                                                store.set('convert.amount', value)
                                                // store.set('depositAddress', '')
                                            }}
                                            onCurrencyChange={()=>{}}
                                            items={['BTC']} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            id="standard-read-only-input"
                                            placeholder='Ethereum Destination'
                                            className={classes.depositAddress}
                                            margin="dense"
                                            variant="outlined"
                                            onChange={(event) => {
                                                store.set('convert.destination', event.target.value)
                                                store.set('convert.destinationValid', AddressValidator.validate(event.target.value, 'ETH'))
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                            </React.Fragment>}

                            {selectedDirection === 1 && <React.Fragment>
                                <Grid alignItems="center" container>
                                    <Grid item xs={12}>
                                        <CurrencyInput
                                            onAmountChange={(value)=>{
                                                store.set('convert.amount', value)
                                            }}
                                            onCurrencyChange={()=>{}}
                                            items={['renBTC']} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            id="standard-read-only-input"
                                            placeholder='Bitcoin Destination'
                                            className={classes.depositAddress}
                                            margin="dense"
                                            variant="outlined"
                                            onChange={(event) => {
                                                store.set('convert.destination', event.target.value)
                                                store.set('convert.destinationValid', AddressValidator.validate(event.target.value, 'BTC'))
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </React.Fragment>}

                            <Grid item xs={12}>
                                <Grid container direction='column' className={classes.fees}>
                                    <Grid item xs={12} className={classes.lineItem}>
                                        <Grid container justify='space-between'>
                                            <span>Exchange Rate</span>
                                            <span className={classes.amt}>1.0 BTC/renBTC</span>
                                        </Grid>
                                        <Grid container justify='space-between'>
                                            <span>Conversion Fee</span>
                                            <span className={classes.amt}>{amount ? `${fee} BTC` : '-'}</span>
                                        </Grid>
                                        <Grid container justify='space-between'>
                                            <span>Total</span>
                                            <span className={classes.amt}>{amount ? `~${total} renBTC` : '-'}</span>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                        </Grid>

                    </Grid>

                    {!isSignedIn && <Grid container justify='center' className={classes.actionButtonContainer}>
                        <Grid item xs={12}>
                            <Button
                                disabled={false}
                                variant='outlined'
                                size="small"
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={initLocalWeb3}
                                >
                                Connect Wallet
                            </Button>
                        </Grid>
                    </Grid>}


                    {isSignedIn && selectedDirection === 0 && <Grid container justify='center' className={classes.actionButtonContainer}>
                        <Grid item xs={12}>
                            <Button
                                disabled={!canConvert}
                                variant='outlined'
                                size="small"
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={this.newDeposit.bind(this)}
                                >
                                Convert BTC → renBTC
                            </Button>
                        </Grid>
                    </Grid>}

                    {isSignedIn && selectedDirection === 1 && <Grid container justify='center' className={classes.actionButtonContainer}>
                        <Grid item xs={12}>
                            <Button
                                disabled={!canConvert}
                                size="small"
                                variant='outlined'
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={this.newWithdraw.bind(this)}
                                >
                                {/*<UndoIcon className={classes.buttonIcon} />*/}
                                Convert renBTC → BTC
                            </Button>
                        </Grid>
                    </Grid>}

                </Grid>
                {transactions && transactions.length ?
                    <Grid container>
                        <Grid item xs={12} className={classes.transactionsContainer}>
                            {transactions.filter(t => ((selectedTransferTab === 0 && t.type === 'deposit') || (selectedTransferTab === 1 && t.type === 'withdraw'))).sort((a,b) => b.id - a.id).map((tx, index) => {
                                return <TransactionItem
                                    key={index}
                                    store={store}
                                    onTxClear={() => {
                                        const type = tx.type
                                        const awaiting = tx.awaiting

                                        if (type === 'deposit' && awaiting === 'btc-init') {
                                            store.set('showCancelModal', true)
                                            store.set('cancelModalTx', tx)
                                        } else {
                                            removeTx(this.props.store, tx.id)
                                        }
                                    }}
                                    network={selectedNetwork}
                                    tx={tx}
                                    {...tx} />
                            })}
                        </Grid>
                    </Grid>
                : null}
            </div>}
        </React.Fragment>
    }
}

export default withStyles(styles)(withStore(TransferContainer))
