import React from 'react';
import theme from '../theme/theme'
import { withStyles } from '@material-ui/styles';
import { removeTx, initConvertFromEthereum, completeConvertToEthereum } from '../utils/txUtils'
import { getStore } from '../services/storeService'

const styles = () => ({
    viewLink: {
        fontSize: 12,
        marginRight: theme.spacing(1),
        textDecoration: 'underline',
        cursor: 'pointer',
    }
})

const ConversionActions = function(props) {
    const {
        tx,
        classes
    } = props

    const store = getStore()
    const direction = tx.destNetwork === 'ethereum' ? 'in' : 'out'

    return <React.Fragment>
      <div>
        {direction === 'in' && tx.destTxHash ? <a className={classes.viewLink} target='_blank' href={'https://' + (tx.destNetworkVersion === 'testnet' ? 'kovan.' : '') + 'etherscan.io/tx/'+tx.destTxHash}>View ETH Transaction</a> : null}
        {direction === 'in' && tx.awaiting === 'btc-init' && !tx.error && <React.Fragment>
            <a className={classes.viewLink} onClick={() => {
                // view modal
                store.set('showGatewayModal', true)
                store.set('gatewayModalTx', tx)
            }}>View Gateway Address</a>
            <a className={classes.viewLink} onClick={() => {
                // TODO: are you sure modal
                store.set('showCancelModal', true)
                store.set('cancelModalTx', tx)
            }}>Cancel</a>
        </React.Fragment>}
        {direction === 'in' && tx.awaiting === 'btc-settle' && tx.sourceTxHash && <a className={classes.viewLink} target='_blank' href={`https://sochain.com/tx/BTC${tx.sourceNetworkVersion === 'testnet' ? 'TEST' : ''}/${tx.sourceTxHash}`}>View BTC Transaction</a>}

        {direction === 'out' && tx.sourceTxHash && tx.awaiting === 'eth-settle' ? <a className={classes.viewLink} target='_blank' href={'https://' + (tx.sourceNetworkVersion === 'testnet' ? 'kovan.' : '') + 'etherscan.io/tx/'+tx.sourceTxHash}>View Transaction</a> : null}
        {direction === 'out' && tx.awaiting === '' && tx.destAddress && <a className={classes.viewLink} target='_blank' href={`https://sochain.com/address/BTC${tx.destNetworkVersion === 'testnet' ? 'TEST' : ''}/${tx.destAddress}`}>View BTC Transaction</a>}

        {(tx.error && tx.awaiting === 'eth-settle' || tx.awaiting === 'eth-init') && <React.Fragment>
            <a className={classes.viewLink} onClick={() => {
                if (direction === 'out') {
                    initConvertFromEthereum(tx)
                } else {
                    completeConvertToEthereum(tx)
                }
            }}>Submit</a>
            {direction === 'out' && <a className={classes.viewLink} onClick={() => {
                removeTx(tx)
            }}>Cancel</a>}
        </React.Fragment>}

        {!tx.awaiting && !tx.error && <a className={classes.viewLink} onClick={() => {
            removeTx(tx)
        }}>Clear</a>}

        {direction === 'out' && tx.error && tx.sourceTxHash && <a className={classes.viewLink} onClick={() => {
            removeTx(tx)
        }}>Clear</a>}
      </div>
    </React.Fragment>
}

export default withStyles(styles)(ConversionActions);
