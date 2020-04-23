import React from 'react';
import { withStyles, ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import classNames from 'classnames'
import blueGrey from '@material-ui/core/colors/blueGrey';
import grey from '@material-ui/core/colors/grey';

import { initConvertToEthereum, initConvertFromEthereum } from '../utils/txUtils'

import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import LinearProgress from '@material-ui/core/LinearProgress';
import ClearIcon from '@material-ui/icons/Clear';

import RenSDK from "@renproject/ren";

const contractAddress = "0xb2731C04610C10f2eB6A26ad14E607d44309FC10";

const theme = createMuiTheme({
  palette: {
    primary: blueGrey,
    secondary: grey,
  },
});

const styles = () => ({
    paper: {
      padding: theme.spacing(2),
      border: '1px solid #EBEBEB',
      borderRadius: theme.shape.borderRadius,
      // textAlign: 'center',
      // color: theme.palette.text.secondary,
    },
    pendingItem: {
      marginBottom: theme.spacing(2),
      position: 'relative',
      minHeight: 96
    },
    pendingTitle: {
        margin: 0
    },
    pendingSubTitle: {
        // marginBottom: theme.spacing(1),
        fontSize: 14
    },
    progress: {
        marginTop: theme.spacing(1),
    },
    pendingMsg: {
        // float: 'right'
    },
    amountContainer: {
        textAlign: 'right'
    },
    txLink: {
        // float: 'right'
    },
    clearContainer: {
        height: '100%'
    },
    clearButton: {
        // position: 'absolute',
        // top: theme.spacing(1),
        // right: theme.spacing(1)
    }
})

class TransactionItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
        }
    }

    async componentDidMount() {
        const { type, awaiting, params, gatewayAddress, amount } = this.props
    }

    render() {
        // console.log(this.props)
        const { type, source, awaiting, amount, id, destAddress, renBtcAddress, network, store, error, tx } = this.props
        const classes = this.props.classes

        // let title = `Pending ${source} ${type}`
        let title = ''
        let msg = ''
        let txLink = ''
        let completed = 0

        const btcAddress = renBtcAddress || destAddress
        const linkPath = btcAddress && btcAddress.charAt(0) === '2' ? 'btctest' : 'btc'
        const isDepositFirstStep = awaiting === 'btc-init' && type === 'deposit'
        const isWithdrawFirstStep = awaiting === 'eth-init' && type === 'withdraw' && !error
        const isSubmittingToRen = awaiting === 'ren-init' || awaiting === 'ren-settle'
        const isSubmittingToEth = (awaiting === 'eth-settle' && error === false) || isWithdrawFirstStep

        if (type === 'deposit') {
            if (awaiting === 'btc-init') {
                // msg = 'Awaiting BTC transaction...'
                // msg = 'Send exactly ' + amount + ' BTC to ' + renBtcAddress
                title = `Scanning for deposit to`
                msg = renBtcAddress
                completed = 0
            } else if (awaiting === 'ren-settle') {
                title = `Deposit`
                msg = 'Submitting to RenVM. This may take a few minutes...'
                completed = 33
            } else if (awaiting === 'eth-init') {
                title = `Deposit`
                msg = error ? <span>Deposit on Ethereum incomplete. <a href='javascript:;' className={classes.txLink} onClick={()=>{
                    initConvertToEthereum.bind(this)(tx)
                }}>Retry</a></span> : 'Completing deposit on Ethereum...'
                completed = 66
            } else if (awaiting === 'eth-settle') {
                title = `Deposit`
                msg = error ? <span>Deposit on Ethereum incomplete. <a href='javascript:;' className={classes.txLink} onClick={()=>{
                    initConvertToEthereum.bind(this)(tx)
                }}>Retry</a></span> : 'Minting zBTC...'
                completed = 66
            } else if (awaiting === '') {
                title = `Deposit`
                msg = <a className={classes.txLink} target='_blank' href={'https://www.blockchain.com/' + linkPath + '/address/' + renBtcAddress}>View BTC Transaction</a>
                completed = 100
                // txLink = 'https://www.blockchain.com/' + linkPath + '/address/' + renBtcAddress
            }
        } else if (type === 'withdraw') {
            if (awaiting === 'eth-init') {
                title = `Withdraw`
                msg = error ? <span>Withdraw on Ethereum incomplete. <a href='javascript:;' className={classes.txLink} onClick={()=>{
                    initConvertFromEthereum.bind(this)(tx)
                }}>Retry</a></span> : 'Withdrawing on Ethereum...'
                completed = 0
            } else if (awaiting === 'eth-settle') {
                title = `Withdraw`
                msg = 'Retrieving zBTC burn event...'
                completed = 25
            } else if (awaiting === 'ren-init') {
                title = `Withdraw`
                msg = 'Submitting to RenVM. This may take a few minutes...'
                completed = 50
            } else if (awaiting === 'ren-settle') {
                title = `Withdraw`
                msg = 'Submitting to RenVM. This may take a few minutes...'
                completed = 75
            } else if (awaiting === '') {
                title = `Withdraw`
                // msg = 'Completed'
                msg = <a className={classes.txLink} target='_blank' href={'https://www.blockchain.com/' + linkPath + '/address/' + destAddress}>View BTC Transaction</a>
                // txLink = 'https://www.blockchain.com/' + linkPath + '/address/' + destAddress
                completed = 100
            }
        }

        return <div className={classes.pendingItem}><div key={id} className={classes.paper}>
            <Grid container>
                <Grid item xs={11}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Grid container alignItems='center'>
                                <Grid item xs={8}>
                                    {<Typography variant='subtitle1' className={classes.pendingTitle}>
                                        {title}
                                    </Typography>}
                                </Grid>
                                <Grid item xs={4} className={classes.amountContainer}>
                                    <Typography variant='subtitle1'>{amount} BTC</Typography>
                                </Grid>
                            </Grid>
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant='subtitle2' className={classes.pendingSubTitle}>
                                <span className={classes.pendingMsg}>{msg}</span>
                                {/*txLink && <a className={classes.txLink} target='_blank' href={txLink}>View Transaction</a>*/}
                            </Typography>
                        </Grid>
                        <Grid item xs={12}>
                            {completed < 100 && <LinearProgress className={classes.progress} variant={isDepositFirstStep || isWithdrawFirstStep ? "indeterminate" : "determinate"} value={completed} valueBuffer={completed} />}
                        </Grid>
                    </Grid>
                </Grid>
                {(!isSubmittingToRen && !isSubmittingToEth) && <Grid item xs={1}>
                    <Grid container justify='flex-end' alignItems='center' className={classes.clearContainer}>
                        <IconButton onClick={this.props.onTxClear} aria-label="delete" className={classes.clearButton} size="small">
                            <ClearIcon fontSize="inherit" />
                        </IconButton>
                    </Grid>
                </Grid>}
            </Grid>
        </div></div>
    }
}

export default withStyles(styles)(TransactionItem);
