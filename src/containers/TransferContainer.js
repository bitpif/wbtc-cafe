import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import sb from "satoshi-bitcoin"
import AddressValidator from "wallet-address-validator";
import NumberFormat from 'react-number-format'
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import {
    addTx,
    updateTx,
    removeTx,
    initMonitoring,
    initConvertToEthereum,
    initConvertFromEthereum,
    initTransfer,
    gatherFeeData
} from '../utils/txUtils'
import { MINI_ICON_MAP, NAME_MAP, initLocalWeb3, setWbtcAllowance } from '../utils/walletUtils'
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
import ActionLink from '../components/ActionLink';

import adapterABI from "../utils/adapterABI.json";

const styles = () => ({
    container: {
        background: '#fff',
        border: '0.5px solid ' + theme.palette.divider
    },
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
        marginBottom: theme.spacing(1.5),
        display: 'flex',
        flexDirection:'column',
        '& span': {
            marginBottom: theme.spacing(1)
        }
    },
    slippage: {
        width: '100%',
        border: '1px solid ' + theme.palette.divider,
        fontSize: 12,
        padding: theme.spacing(1),
        paddingBottom: 0,
        marginTop: theme.spacing(1),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing(3),
        '& span': {
            marginBottom: theme.spacing(1)
        }
    },
    slippageRate: {
        '& a': {
            marginLeft: theme.spacing(1)
        },
        '& span': {
            marginLeft: theme.spacing(1)
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
    },
    total: {
        fontWeight: 'bold'
    },
    customSlippage: {
        width: 30,
        fontSize: 12,
        marginTop: -4,
        marginLeft: theme.spacing(1)
    },
    amountContainer: {
        flex: 1
    },
    maxLink: {
        fontSize: 12,
        textDecoration: 'underline',
        cursor: 'pointer',
        paddingLeft: theme.spacing(1),
        paddingTop: theme.spacing(0.5)
    }
})

class TransferContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
        this.wbtcAmountRef = React.createRef()
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
        // if (!store.get('localWeb3') || !store.get('space')) return initLocalWeb3()

        const amount = store.get('convert.amount')
        const destination = store.get('convert.destination')
        const network = store.get('selectedNetwork')
        const asset = store.get('convert.selectedFormat')
        const maxSlippage = store.get('convert.maxSlippage')
        const exchangeRate = store.get('convert.exchangeRate')
        const expectedTotal = store.get('convert.conversionTotal')
        const minSwapProceeds = Number((Number(expectedTotal) * Number(1 - maxSlippage)).toFixed(6))
        const adapterAddress = store.get('convert.adapterAddress')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            type: 'convert',
            instant: false,
            awaiting: 'btc-init',
            sourceAsset: 'btc',
            sourceAmount: '',
            sourceNetwork: 'bitcoin',
            sourceNetworkVersion: network,
            destAddress: destination,
            destNetwork: 'ethereum',
            destNetworkVersion: network,
            destAsset: asset,
            destTxHash: '',
            destTxConfs: 0,
            amount: amount,
            error: false,
            swapReverted: false,
            minSwapProceeds: minSwapProceeds,
            adapterAddress
            // minSwapProceeds: 100
            // txHash: '',
        }

        // initConvertToEthereum(tx)

        store.set('depositModalTx', tx)
        store.set('showDepositModal', true)
    }

    async newWithdraw() {
        const { store } = this.props
        if (!store.get('localWeb3')) return initLocalWeb3()
        // if (!store.get('localWeb3') || !store.get('space')) return initLocalWeb3()

        const amount = store.get('convert.amount')
        const destination = store.get('convert.destination')
        const network = store.get('selectedNetwork')
        const asset = store.get('convert.selectedFormat')
        const maxSlippage = store.get('convert.maxSlippage')
        const exchangeRate = store.get('convert.exchangeRate')
        const minSwapProceeds = Number((Number(amount * exchangeRate) * Number(1 - maxSlippage)).toFixed(6))
        const adapterAddress = store.get('convert.adapterAddress')

        const tx = {
            id: 'tx-' + Math.floor(Math.random() * (10 ** 16)),
            type: 'convert',
            instant: false,
            awaiting: 'eth-settle',
            sourceAsset: asset,
            sourceAmount: amount,
            sourceNetwork: 'ethereum',
            sourceNetworkVersion: network,
            sourceTxHash: '',
            sourceTxConfs: 0,
            destAddress: destination,
            destNetwork: 'bitcoin',
            destNetworkVersion: network,
            destAsset: 'btc',
            amount: amount,
            error: false,
            minSwapProceeds: minSwapProceeds,
            // minSwapProceeds: 100
            // txHash: ''
        }

        initConvertFromEthereum(tx)
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
        const space = store.get('space')
        const wbtcBalance = store.get('wbtcBalance')

        const amount = store.get('convert.amount')
        const exchangeRate = store.get('convert.exchangeRate')
        const fee = store.get('convert.networkFee')
        const renVMFee = store.get('convert.renVMFee')
        const total = store.get('convert.conversionTotal')

        const allowance = store.get('convert.adapterWbtcAllowance')
        const hasAllowance = Number(amount) <= Number(allowance)
        const allowanceRequesting = store.get('convert.adapterWbtcAllowanceRequesting')

        const convertAddressValid = store.get('convert.destinationValid')
        const canConvertTo = amount > 0.00010001 && convertAddressValid
        const canConvertFrom = Number(total) > 0.00010001 && amount <= Number(wbtcBalance) && convertAddressValid

        const sourceAsset = selectedDirection ? 'WBTC' : 'BTC'
        const destAsset = selectedDirection ? 'BTC' : 'WBTC'

        const maxSlippage = store.get('convert.maxSlippage')
        const slippageOptions = [0.005, 0.01, 0.05]
        const customSlippageValue = slippageOptions.indexOf(maxSlippage) > -1 ? maxSlippage : 0

        // console.log('transfer render', store.getState())

        return <div className={classes.container}>
            {selectedTab === 1 && <div className={classes.actionsContainer}>
                <Grid className={classes.actions}>
                    <Grid container justify='center'>
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
                                            gatherFeeData()
                                        }
                                    }}>
                                    <ToggleButton key={0} value={'0'}>
                                      <img src={MINI_ICON_MAP['wbtc']} className={classes.icon} /> Get WBTC
                                    </ToggleButton>
                                    <ToggleButton key={1} value={'1'}>
                                      <img src={MINI_ICON_MAP['btc']} className={classes.icon} /> Get BTC
                                    </ToggleButton>
                                </ToggleButtonGroup>
                            </Grid>}

                            {selectedDirection === 0 && <React.Fragment>
                                <Grid alignItems="center" container>
                                    <Grid item xs={12}>
                                        <CurrencyInput
                                            onAmountChange={(value)=>{
                                                let amount = value
                                                if (value < 0) {
                                                    amount = ''
                                                }
                                                store.set('convert.amount', amount)
                                                gatherFeeData()
                                            }}
                                            onCurrencyChange={()=>{}}
                                            items={['BTC']} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            id="standard-read-only-input"
                                            placeholder='Ethereum Destination Address'
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
                                        <Grid container direction='row' alignItems='center'>
                                            <Grid item className={classes.amountContainer}>
                                                <CurrencyInput
                                                    inputRef={this.wbtcAmountRef}
                                                    onAmountChange={(value)=>{
                                                        let amount = value
                                                        if (value < 0) {
                                                            amount = ''
                                                        }
                                                        store.set('convert.amount', amount)
                                                        gatherFeeData()
                                                    }}
                                                    onCurrencyChange={()=>{}}
                                                    items={['WBTC']} />
                                            </Grid>
                                            <ActionLink className={classes.maxLink}
                                                onClick={() => {
                                                    this.wbtcAmountRef.current.value = store.get('wbtcBalance')
                                                    // console.log(this.wbtcAmountRef.current.value)
                                                }}>Max</ActionLink>
                                        </Grid>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField
                                            id="standard-read-only-input"
                                            placeholder='Bitcoin Destination Address'
                                            className={classes.depositAddress}
                                            margin="dense"
                                            variant="outlined"
                                            onChange={(event) => {
                                                store.set('convert.destination', event.target.value)
                                                store.set('convert.destinationValid', AddressValidator.validate(
                                                    event.target.value,
                                                    selectedDirection ? 'BTC' : 'ETH',
                                                    selectedNetwork === 'testnet' ? 'testnet' : 'prod'
                                                ))
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
                                            <span className={classes.amt}>{exchangeRate && amount ? `1 ${sourceAsset} = ${exchangeRate} ${destAsset}` : '-'} </span>
                                        </Grid>
                                        <Grid container justify='space-between'>
                                            <span>RenVM Fee</span>
                                            <span className={classes.amt}>{renVMFee && amount ? `${renVMFee} BTC` : '-'}</span>
                                        </Grid>
                                        <Grid container justify='space-between'>
                                            <span>{NAME_MAP[selectedAsset]} Fee</span>
                                            <span className={classes.amt}>{fee && amount ? `${fee} BTC` : '-'}</span>
                                        </Grid>
                                        <Grid container justify='space-between' className={classes.total}>
                                            <span>You Will Receive</span>
                                            <span className={classes.amt}>{total && amount ? `~${total} ${destAsset}` : '-'}</span>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                            <Grid item xs={12}>
                                <Grid container direction='column' className={classes.slippage}>
                                    <Grid item xs={12} className={classes.lineItem}>
                                        <Grid container justify='space-between'>
                                            <span>Max. slippage</span>
                                            <div className={classes.slippageRate}>
                                                {slippageOptions.map(r => {
                                                    const label = `${r * 100}%`
                                                    if (maxSlippage === r) {
                                                        return <span>{label}</span>
                                                    } else {
                                                        return <ActionLink onClick={() => {
                                                            store.set('convert.maxSlippage', r)
                                                        }}>{label}</ActionLink>
                                                    }
                                                })}
                                                <NumberFormat
                                                    className={classes.customSlippage}
                                                    decimalScale={2}
                                                    suffix={'%'}
                                                    allowLeadingZeros={true}
                                                    allowNegative={false}
                                                    onValueChange={values => {
                                                        const float = values.floatValue
                                                        if (!float) {
                                                            store.set('convert.maxSlippage', slippageOptions[0])
                                                        } else if (float > 100) {
                                                            store.set('convert.maxSlippage', 1)
                                                        } else {
                                                            store.set('convert.maxSlippage', Number((float / 100).toFixed(4)))
                                                        }
                                                    }}
                                                />

                                            </div>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>

                        </Grid>

                    </Grid>

                    {selectedDirection === 0 && <Grid container justify='center' className={classes.actionButtonContainer}>
                        <Grid item xs={12}>
                            <Button
                                disabled={!canConvertTo}
                                variant={canConvertTo ? 'outlined' : 'contained'}
                                size="small"
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={this.newDeposit.bind(this)}
                                >
                                Get WBTC
                            </Button>
                        </Grid>
                    </Grid>}

                    {selectedDirection === 1 && <Grid container justify='center' className={classes.actionButtonContainer}>
                        <Grid item xs={12}>
                            {hasAllowance ? <Button
                                disabled={!canConvertFrom}
                                size="small"
                                variant={canConvertFrom ? 'outlined' : 'contained'}
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={this.newWithdraw.bind(this)}
                                >
                                {/*<UndoIcon className={classes.buttonIcon} />*/}
                                Get BTC
                            </Button> : <Button
                                disabled={allowanceRequesting}
                                size="small"
                                variant={!allowanceRequesting ? 'outlined' : 'contained'}
                                className={classNames(classes.margin, classes.actionButton)}
                                onClick={setWbtcAllowance}
                                >
                                Allow WBTC
                            </Button>}
                        </Grid>
                    </Grid>}

                </Grid>
            </div>}
        </div>
    }
}

export default withStyles(styles)(withStore(TransferContainer))
