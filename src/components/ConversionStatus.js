import React from 'react';
import theme from '../theme/theme'
// import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';
import Typography from '@material-ui/core/Typography';

const styles = () => ({
})

const ConversionStatus = function(props) {
    const {
        tx,
    } = props

    const direction = tx.destNetwork === 'ethereum' ? 'in' : 'out'
    const targetBtcConfs = tx.sourceNetworkVersion === 'testnet' ? 2 : 6
    const targetEthConfs = tx.sourceNetworkVersion === 'testnet' ? 13 : 30

    return <React.Fragment>
            {tx.destNetwork === 'ethereum' ? <Typography variant='caption'>
                {tx.awaiting === 'btc-init' ? <span>
                    {`Waiting for BTC to be sent`}
                </span> : null}
                {tx.awaiting === 'btc-settle' ? <span>
                    {`BTC transaction confirming (${tx.btcConfirmations}/${targetBtcConfs} complete)`}
                </span> : null}
                {tx.awaiting === 'ren-settle' ? <span>
                    {`Submitting to RenVM`}
                </span> : null}
                {tx.awaiting === 'eth-init' ? <span>
                    {`Submit to Ethereum`}
                </span> : null}
                {tx.awaiting === 'eth-settle' ? <span>
                    {tx.error ? `Submit to Ethereum` : `Submitting to Ethereum`}
                </span> : null}
                {!tx.awaiting ? <span>{`Complete`}</span> : null}
            </Typography> : <Typography variant='caption'>
                {tx.awaiting === 'eth-settle' ? <span>
                    {tx.error ? (tx.sourceTxHash ? `Transaction Failed` : `Submit to Ethereum`) : `Transaction confirming (${tx.sourceTxConfs}/${targetEthConfs} complete)`}
                </span> : null}
                {tx.awaiting === 'ren-settle' ? <span>
                    {`Submitting to RenVM`}
                </span> : null}
                {!tx.awaiting ? <span>{`Complete`}</span> : null}
            </Typography>}
    </React.Fragment>
}

export default withStyles(styles)(ConversionStatus);
