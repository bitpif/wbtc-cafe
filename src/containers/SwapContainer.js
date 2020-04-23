import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import sb from "satoshi-bitcoin"
import AddressValidator from "wallet-address-validator";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { NAME_MAP, SYMBOL_MAP, ASSETS } from '../utils/walletUtils'
import {
    addTx,
    updateTx,
    removeTx,
    initMonitoring,
    initSwap,
    initDeposit,
    initWithdraw,
    initTransfer
} from '../utils/txUtils'
import Web3 from "web3";
import { ethers } from 'ethers';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

import Chip from '@material-ui/core/Chip'
import CurrencyInput from '../components/CurrencyInput';
import TransactionItem from '../components/TransactionItem';
import SwapTransaction from '../components/SwapTransaction'

import adapterABI from "../utils/adapterABI.json";

const styles = () => ({
    transferActionTabs: {
        margin: '0px auto',
        marginTop: theme.spacing(3),
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
        paddingTop: theme.spacing(0),
        paddingBottom: theme.spacing(2),
        '& button': {
            minHeight: 64,
            borderRadius: theme.spacing(1),
            background: 'linear-gradient(60deg,#ffc826,#fb8c00)',
            boxShadow: 'none',
            '&.Mui-disabled': {
                background: '#eee'
            }
        }
    },
    amountField: {
        width: '100%'
    },
    depositButton: {
        width: '100%'
    },
    withdrawButton: {
        width: '100%'
    },
    actions: {
        padding: theme.spacing(3),
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1)
    },
    transactionsContainer: {
        padding: theme.spacing(3),
        paddingTop: theme.spacing(0),
        marginTop: theme.spacing(0),
        // borderTop: '1px solid #EBEBEB'
        // borderTop: '1px solid #EBEBEB'
    },
    transactions: {
        border: '1px solid #EBEBEB',
        borderRadius: 4,
        padding: theme.spacing(1),
        paddingBottom: theme.spacing(0)
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
    fees: {
        width: '100%',
        borderRadius: 4,
        border: '1px solid #eee',
        fontSize: 12,
        padding: theme.spacing(1),
        paddingBottom: 0,
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(3),
        display: 'flex',
        flexDirection:'column',
        '& span': {
            marginBottom: theme.spacing(1)
        }
    }
})

class SwapContainer extends React.Component {

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
        const transactions = store.get('transactions')
        const depositAmount = store.get('depositAmount')

        const tx = {
            id: transactions.length,
            type: 'deposit',
            awaiting: 'btc-init',
            source: 'btc',
            dest: 'eth',
            amount: depositAmount,
            error: false
        }

        const btcFeeRates = await fetch('https://bitcoinfees.earn.com/api/v1/fees/recommended');
        const feeRatesJson = await btcFeeRates.json();

        // make this smarter
        store.set('btcTxFeeEstimate', sb.toBitcoin(feeRatesJson.fastestFee * 223))

        // initDeposit.bind(this)(tx)
        this.showDepositModal(tx)
    }

    async newSwap() {
        const { store } = this.props
        const inputAmount = store.get('swap.inputAmount')
        const inputAsset = store.get('selectedAsset')
        const outputAsset = store.get('swap.outputAsset')
        const outputDestination = store.get('swap.outputDestination')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            type: 'swap',
            awaiting: 'eth-init',
            source: inputAsset,
            dest: outputAsset,
            destAddress: outputDestination,
            amount: inputAmount,
            error: false
        }

        initSwap.bind(this)(tx)
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
        const transactions = store.get('swap.transactions')
        const selectedNetwork = store.get('selectedNetwork')
        const selectedTransferTab  = store.get('selectedTransferTab')
        const selectedTab  = store.get('selectedTab')
        const selectedAsset  = store.get('selectedAsset')
        const selectedOutputAsset  = store.get('swap.selectedOutputAsset')

        const inputAmount = store.get('swap.inputAmount')

        const isSignedIn = walletAddress && walletAddress.length

        const canSwap = inputAmount > 0.0001
        // const canDeposit = false
        // const canWithdraw = false
        // const canTransfer = false

        // console.log('transfer render', selectedTransferTab, transactions)

        console.log(store.getState())

        return <React.Fragment>
            {selectedTab === 0 && <div className={classes.actionsContainer}>
                <Grid className={classes.actions}>
                    <Grid container justify='center'>
                        <Grid item xs={12}>
                            <React.Fragment>
                                <Grid alignItems="center" container>
                                    <Grid item xs={12}>
                                        <CurrencyInput
                                            onAmountChange={(value)=>{
                                                store.set('swap.inputAmount', value)
                                            }}
                                            onCurrencyChange={()=>{}}
                                            items={[selectedAsset.toUpperCase()]} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <CurrencyInput
                                            onAmountChange={(value)=>{
                                            }}
                                            disabled={true}
                                            onCurrencyChange={(v)=>{
                                                store.set('swap.selectedOutputAsset', v.toLowerCase())
                                            }}
                                            items={ASSETS.filter(a => (a.toLowerCase() !== selectedAsset))} />
                                    </Grid>
                                    {<Grid item xs={12}>
                                        <TextField
                                            id="standard-read-only-input"
                                            placeholder={'Destination (optional)'}
                                            className={classes.depositAddress}
                                            margin="normal"
                                            variant="outlined"
                                            onChange={(event) => {
                                                store.set('swap.outputAddress', event.target.value)
                                                store.set('swap.outputAddressValid', AddressValidator.validate(event.target.value, selectedOutputAsset.toUpperCase()))
                                            }}
                                        />
                                    </Grid>}
                                </Grid>
                            </React.Fragment>
                        </Grid>

                        <Grid item xs={12}>
                            <Grid container direction='column' className={classes.fees}>
                                <Grid item xs={12} className={classes.lineItem}>
                                    <Grid container justify='space-between'>
                                        <span>Exchange rate</span>
                                        <span className={classes.amt}>123.00 BTC/USDC</span>
                                    </Grid>
                                    <Grid container justify='space-between'>
                                        <span>Fees</span>
                                        <span className={classes.amt}>0.2355</span>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid container justify='center' className={classes.actionButtonContainer}>
                        <Grid item xs={12}>
                            <Button
                                disabled={!isSignedIn || !canSwap}
                                variant="contained"
                                size="large"
                                color="primary"
                                aria-label="add"
                                fullWidth
                                className={classNames(classes.margin, classes.actionButton, classes.depositButton)}
                                onClick={this.newSwap.bind(this)}
                                >
                                {/*<RedoIcon className={classes.buttonIcon} />*/}
                                Swap
                            </Button>
                        </Grid>
                    </Grid>
                </Grid>
                {transactions && transactions.length ?
                    <Grid container>
                        <Grid item xs={12} className={classes.transactionsContainer}>
                            <div className={classes.transactions}>
                                {transactions.sort((a,b) => b.id - a.id).map((tx, index) => {
                                    return <SwapTransaction tx={tx} index={index} />
                                })}
                            </div>
                        </Grid>
                    </Grid>
                : null}
            </div>}
        </React.Fragment>
    }
}

export default withStyles(styles)(withStore(SwapContainer))
