import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { removeTx } from '../utils/txUtils'
import { resetWallet, setNetwork, MINI_ICON_MAP } from '../utils/walletUtils'
import ConversionStatus from '../components/ConversionStatus';

import Web3 from "web3";
import EthCrypto from 'eth-crypto'
import Box from '3box';
import Portis from '@portis/web3';
import Torus from "@toruslabs/torus-embed";

import RoundaboutIcon from '../assets/roundabout.svg';
import AccountIcon from '@material-ui/icons/AccountCircle';
import WifiIcon from '@material-ui/icons/Wifi';

import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';

import BTC from '../assets/btc.png'
import ETH from '../assets/eth.png'
import ZEC from '../assets/zec.jpg'
import DAI from '../assets/dai.png'
import USDC from '../assets/usdc.png'

const styles = () => ({
    viewLink: {
        fontSize: 12,
        marginRight: theme.spacing(1),
        textDecoration: 'underline',
        cursor: 'pointer',
        color: '#fff'
    },
    titleWrapper: {
      paddingBottom: theme.spacing(2)
    }
})

class TransactionsTableContainer extends React.Component {

    constructor(props) {
        super(props);
    }

    async componentDidMount() {
    }

    cancel() {

    }

    render() {
        const {
            classes,
            store
        } = this.props

        const transactions = store.get('convert.transactions')

        return <div>
          <div className={classes.titleWrapper}>
            <Typography variant='subtitle1'><b>Conversions</b></Typography>
          </div>
          <Table className={classes.table}>
            <TableHead>
              <TableRow>
                <TableCell align="left">Date</TableCell>
                <TableCell align="left">Conversion</TableCell>
                <TableCell>Status</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.map((tx, i) => {
                const destAsset = tx.destAsset.toUpperCase()
                const sourceAsset = tx.sourceAsset.toUpperCase()
                return <TableRow key={i}>
                  <TableCell align="left"><Typography variant='caption'>01/20/2020</Typography></TableCell>
                  <TableCell align="left"><Typography variant='caption'>{tx.amount} {sourceAsset} → {destAsset}</Typography></TableCell>
                  <TableCell><Typography variant='caption'><ConversionStatus tx={tx} /></Typography></TableCell>
                  <TableCell>
                      {tx.awaiting === 'btc-init' || tx.error || !tx.awaiting ? <div>
                      {tx.txHash ? <a className={classes.viewLink} target='_blank' href={'https://' + (tx.network === 'testnet' ? 'kovan.' : '') + 'etherscan.io/tx/'+tx.txHash}>View transaction</a> : null}
                      <span className={classes.viewLink} onClick={() => {
                          removeTx(store, tx)
                      }}>{!tx.awaiting ? 'Clear' : 'Cancel'}</span></div> : null}
                  </TableCell>
                </TableRow>
              })}
            </TableBody>
          </Table>
        </div>
    }
}

export default withStyles(styles)(withStore(TransactionsTableContainer))
