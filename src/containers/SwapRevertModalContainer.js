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
        marginTop: theme.spacing(1)
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
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(2)
    },
    rates: {
        // textDecoration: 'italic',
        marginBottom: theme.spacing(2)
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
        const net = Number(amount-renVMFee-fixedFee) > 0 ? Number(amount-renVMFee-fixedFee).toFixed(8) : '0.00000000'
        const total = Number(net * swapRevertModalExchangeRate).toFixed(8)
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
                    Exchange Rate Change
                </Typography>

                <Typography variant='body1' className={classes.content}>
                    The swap has increased in price since you intiated your transaction. Would you like to complete the swap at the current market&nbsp;rate?
                </Typography>
                <Grid item xs={12}>
                  <Grid container>
                      <Grid item xs={6}>
                           <Typography variant='body1' className={classes.receiptTitle}>
                              Initial Min. Rate
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${minRate} WBTC/renBTC`}
                          </Typography>
                      </Grid>
                  </Grid>
                </Grid>
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
                           <Typography variant='body1' className={classes.receiptTitle}>
                              Funds Swapped
                           </Typography>
                      </Grid>
                      <Grid item xs={6}>
                          <Typography variant='body1' className={classes.receiptAmount}>
                              {`${net} renBTC`}
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
                              {`~${total} WBTC`}
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
                        completeConvertToEthereum(swapRevertModalTx, 'wbtc')
                        store.set('showSwapRevertModal', false)
                    }}
                    >
                    Continue Swap
                </Button>
                <Button
                    size='large'
                    color="primary"
                    fullWidth={true}
                    className={classNames(classes.button)}
                    onClick={() => {
                        const newTx = updateTx(Object.assign(swapRevertModalTx, { swapReverted: true }))
                        completeConvertToEthereum(newTx, 'renbtc')
                        store.set('showSwapRevertModal', false)
                    }}
                    >
                    Get renBTC Instead
                </Button>
            </Grid>
          </Fade>
        </Modal>
    }
}

export default withStyles(styles)(withStore(SwapRevertModalContainer))
