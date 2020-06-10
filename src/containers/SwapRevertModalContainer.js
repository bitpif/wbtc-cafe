import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';

import {
    completeConvertToEthereum,
    initConvertFromEthereum,
    updateTx
} from '../utils/txUtils'

const styles = () => ({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(2),
      [theme.breakpoints.down('xs')]: {
          overflowY: 'scroll',
          overflowX: 'hidden',
          alignItems: 'flex-start'
      }
    },
    modalContent: {
      backgroundColor: '#fff',
      width: 400,
      maxWidth: '100%',
      padding: theme.spacing(2)
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        // marginBottom: theme.spacing(2),
        fontWeight: 'bold'
    },
    titleContainer: {
      marginBottom: theme.spacing(3),
    },
    content: {
      fontSize: 14,
      width: '100%',
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2)
    },
    button: {
        marginTop: theme.spacing(3)
    },
    receiptTitle: {
        fontSize: 14
    },
    receiptAmount: {
        textAlign: 'right',
        fontSize: 14
    },
    total: {
        fontWeight: 'bold',
        marginTop: theme.spacing(1)
    },
    rates: {
        textDecoration: 'italic'
    },
    continueTitle: {
        marginBottom: theme.spacing(1)
    }
})

class SwapRevertModalContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = props.store.getState()
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const showSwapRevertModal = store.get('showSwapRevertModal')
        const swapRevertModalTx = store.get('swapRevertModalTx')
        const swapRevertModalExchangeRate = store.get('swapRevertModalExchangeRate')
        const selectedNetwork = store.get('selectedNetwork')
        const fees = store.get('fees')

        if (!swapRevertModalTx || !fees) return <div/>

        const amount = Number(swapRevertModalTx.sourceAmount).toFixed(8)
        const fixedFee = Number(fees['btc']['lock'] / (10 ** 8))
        const dynamicFeeRate = Number(fees['btc'].ethereum['mint'] / 10000)
        const renVMFee = (Number(swapRevertModalTx.sourceAmount) * dynamicFeeRate).toFixed(8)
        const networkFee = Number(fixedFee).toFixed(8)
        const total = Number(amount-renVMFee-fixedFee) > 0 ? Number(amount-renVMFee-fixedFee).toFixed(8) : '0.00000000'
        const minRate = Number((swapRevertModalTx.minExchangeRate).toFixed(8))

        return <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={classes.modal}
          open={showSwapRevertModal}
          onClose={() => {
            store.set('showSwapRevertModal', false)
            store.set('swapRevertModalTx', null)
            store.set('swapRevertModalExchangeRate', '')
          }}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={showSwapRevertModal}>
            <Grid container className={classes.modalContent}>
                <Typography variant='subtitle1' className={classes.title}>
                    Warning: You Won't Receive Enough WBTC
                </Typography>


                <Typography variant='body1' className={classes.content}>
                    If you submit this transaction now, the amount of WBTC received won't reach the minimum amount, and the smart contract will send renBTC&nbsp;instead. This minimum amount was set to protect you from&nbsp;front-runners.
                    <br />
                    <br />
                    This may be the result of the market exchange rate for WBTC/renBTC dropping below your minimum exchange rate, or an incorrect amount of BTC was sent to the gateway address.
                </Typography>
                <Grid item xs={12}>
                  <Grid container className={classes.rates}>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classes.receiptTitle}>
                              Current Market Rate
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${swapRevertModalExchangeRate} WBTC/renBTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classes.receiptTitle}>
                              Min. Required Rate
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${minRate} WBTC/renBTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Typography variant='body1' className={classes.content}>
                    As an alternative, you can also try again at a later time when the exchange rate is {minRate}&nbsp;WBTC/renBTC or higher, after which you will receive&nbsp;WBTC.
                </Typography>

                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={12}>
                           <Typography variant='body1' className={classNames(classes.receiptTitle, classes.total, classes.continueTitle)}>
                              Continuing With renBTC
                           </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classes.receiptTitle}>
                              Bitcoin Sent
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${amount} BTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classes.receiptTitle}>
                              RenVM Fee
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${renVMFee} BTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classes.receiptTitle}>
                              Bitcoin Fee
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${networkFee} BTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classNames(classes.receiptTitle, classes.total)}>
                              You Will Receive
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classNames(classes.receiptAmount, classes.total)}>
                              {`${total} renBTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
                <Button
                    variant={"outlined"}
                    size='large'
                    color="primary"
                    fullWidth={true}
                    className={classNames(classes.button)}
                    onClick={() => {
                        if (swapRevertModalTx.sourceAsset === 'wbtc') {
                            initConvertFromEthereum(swapRevertModalTx, true)
                        } else {
                            const newTx = updateTx(Object.assign(swapRevertModalTx, { swapReverted: true }))
                            completeConvertToEthereum(newTx, true)
                        }
                        store.set('showSwapRevertModal', false)
                    }}
                    >
                    Continue and Receive renBTC
                </Button>
            </Grid>
          </Fade>
        </Modal>
    }
}

export default withStyles(styles)(withStore(SwapRevertModalContainer))
