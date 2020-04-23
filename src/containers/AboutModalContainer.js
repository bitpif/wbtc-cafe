import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import DetectNetwork from "web3-detect-network";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { initBrowserWallet } from '../utils/walletUtils'
import { initDeposit } from '../utils/txUtils'
import Web3 from "web3";
import EthCrypto from 'eth-crypto'
import Box from '3box';
import Portis from '@portis/web3';
import Torus from "@toruslabs/torus-embed";

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';
import Modal from '@material-ui/core/Modal';
import Backdrop from '@material-ui/core/Backdrop';
import Fade from '@material-ui/core/Fade';
import Divider from '@material-ui/core/Divider';
import ArrowForwardIcon from '@material-ui/icons/ArrowForward';
import SnackbarContent from '@material-ui/core/SnackbarContent';

import CurrencyInput from '../components/CurrencyInput';
import TransactionItem from '../components/TransactionItem';

import MetamaskIcon from '../assets/metamask.svg';
import PortisIcon from '../assets/portis.svg';
import WalletConnectIcon from '../assets/wallet-connect.svg';
import FortmaticIcon from '../assets/fortmatic.svg';
import TorusIcon from '../assets/torus.svg';
import InfoIcon from '@material-ui/icons/Info';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import ClearIcon from '@material-ui/icons/Clear';

const styles = () => ({
    modal: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing(2),
      // [theme.breakpoints.down('xs')]: {
          overflowY: 'scroll',
          overflowX: 'hidden',
          alignItems: 'flex-start'
      // }
    },
    modalContent: {
      backgroundColor: '#fff',
      padding: theme.spacing(2),
      position: 'relative',
      // border: '1px solid #EBEBEB',
      width: 480,
      maxWidth: '100%',
      // borderRadius: theme.shape.borderRadius
    },
    signInInput: {
      width: '100%'
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
    },
    arrow: {
        width: 30
    },
    section: {
        marginBottom: theme.spacing(3),
    },
    subtitle: {
        marginTop: theme.spacing(4),
        marginBottom: theme.spacing(3)
    },
    divider: {
        marginTop: theme.spacing(3),
        marginBottom: theme.spacing(3)
    },
    dividerTotal: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    },
    showButton: {
        marginTop: theme.spacing(1),
    },
    snackbar: {
        backgroundColor: '#1976d2'
    },
    connectWalletPrompt: {
        padding: theme.spacing(1),
        paddingTop: theme.spacing(2),
        paddingBottom: theme.spacing(2),
        width: 480,
        maxWidth: '100%',
        // width: '100%',
        // paddingBottom: theme.spacing(1),
        // border: '1px solid ' +  theme.palette.grey['300'],
        borderRadius: theme.shape.borderRadius,
        // borderBottomLeftRadius: 0,
        // borderBottomRightRadius: 0,
        // marginBottom: theme.spacing(2),
        // border: '1px solid #EBEBEB',
        '& img': {
            height: 35,
            width: 'auto',
            marginRight: theme.spacing(1)
        },
        position: 'relative'

        // background: '#141e30',
        // background: '-webkit-linear-gradient(to right, #141e30, #243b55)',
        // background: 'linear-gradient(to right, #141e30, #243b55)'
    },
    receiptTitle: {
        '& span': {
            fontSize: 14,
            fontWeight: 'bold'
        },
        marginBottom: theme.spacing(1)
    },
    description: {
        // '& span': {
            fontSize: 14,
        // }
    },
    receiptAmount: {
        textAlign: 'right'
    },
    total: {
        fontWeight: 'bold'
    },
    disabled: {
        opacity: 0.5,
        cursor: 'normal',
        pointerEvents: 'none'
    },
    walletOption: {
      padding: theme.spacing(2),
      borderRadius: 5,
      // color: '#fff',
      '& h6': {
          // marginTop: theme.spacing(1)
      },
      '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          // backgroundColor: theme.palette.grey['100'],
          cursor: 'pointer',
      },
    },
    exit: {
      position: 'absolute',
      top: 8,
      right: 8,
      zIndex: 1000
    }
})

class AboutModalContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {}
    }

    getStarted() {
        const { store } = this.props
        const depositModalTx = store.get('depositModalTx')

        store.set('showAboutModal', false)
        store.set('showSignIn', true)
    }

    exit() {
        const { store } = this.props
        const depositModalTx = store.get('depositModalTx')

        store.set('showAboutModal', false)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const showAboutModal = store.get('showAboutModal')

        // console.log(this.props, this.state)

        return <React.Fragment>
            <Modal
              aria-labelledby="transition-modal-title"
              aria-describedby="transition-modal-description"
              className={classes.modal}
              open={showAboutModal}
              onClose={() => {
                  store.set('showAboutModal', false)
              }}
              closeAfterTransition
              BackdropComponent={Backdrop}
              BackdropProps={{
                timeout: 500,
              }}
            >
              <Fade in={showAboutModal}>
                {<Grid container className={classes.modalContent}>
                    <div className={classes.exit} >
                        <IconButton onClick={this.exit.bind(this)} size="large">
                            <ClearIcon fontSize="inherit" />
                        </IconButton>
                    </div>
                    <Grid className={classNames(classes.connectWalletPrompt)} container alignItems='center' justify='center'>
                          <Grid item xs={12}>
                              <Grid container>
                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               What is Roundabout?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                Roundabout helps you transfer Bitcoin to and from your Ethereum wallet using <a href='https://docs.renproject.io/ren/' target='_blank'>RenVM</a> and the <a href='https://chaos.renproject.io/' target='_blank'>Ren Chaosnet</a>.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               What is&nbsp;RenVM?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                RenVM is a decentralised, trustless, and Byzantine fault tolerant virtual machine replicated over thousands of machines. Anyone can run a node and participate in powering the virtual machine. To learn more about how RenVM works, <a href='https://docs.renproject.io/ren/renvm/introduction' target='_blank'>click here</a>.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               Where does my Bitcoin go when it's&nbsp;deposited?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                Bitcoin is held in wallets that are controlled by RenVM.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               What happens after I send Bitcoin to a deposit&nbsp;address?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                After your transaction has 2 confirmations on the Bitcoin network, you can then mint yourself Bitcoin on Ethereum (<a href='https://etherscan.io/address/0xc04956c6472cdd58766614f8d47f6826ac477fb9' target='_blank'>zBTC</a>) using secure data returned from the RenVM&nbsp;network.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               Is my Bitcoin safe when it's held by&nbsp;RenVM?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                RenVM is experimental technology that is not battle-tested and is still undergoing formal security audits. <b>Do not deposit Bitcoin that you aren't willing to lose due to unforeseen technical issues with RenVM or the Roundabout app.</b> To learn more about RenVM's security, <a href='https://docs.renproject.io/ren/renvm/safety-and-liveliness' target='_blank'>click here</a>.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               Can anyone prevent me from withdrawing my Bitcoin on Ethereum to real&nbsp;Bitcoin?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                No single party can prevent you from burning your Bitcoin on Ethereum and withdrawing the corresponding Bitcoin from RenVM.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                                Are there&nbsp;fees?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                The RenVM network charges 0.01% for all deposits and withdraws.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                               Do I need an account to use&nbsp;Roundabout?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                No, all you need is an Ethereum wallet.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  <Grid item xs={12} className={classes.section}>
                                    <Grid container>
                                        <Grid item xs={12} className={classes.receiptTitle}>
                                            <Typography variant='caption'>
                                                What is&nbsp;3Box?
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    <Grid container>
                                        <Grid item xs={12}>
                                             <Typography variant='caption' className={classes.description}>
                                                <a href='https://3box.io/' target='_blank'>3Box</a> is a secure and decentralized user data storage system. Roundabout uses 3Box to store your pending deposits and withdraws in case you leave the app and come back&nbsp;later.
                                             </Typography>
                                        </Grid>
                                    </Grid>
                                  </Grid>

                                  {/*<Grid item xs={12} className={classes.divider}>
                                      <Divider />
                                  </Grid>*/}

                                  {<Button
                                      variant="contained"
                                      size='large'
                                      color="primary"
                                      fullWidth={false}
                                      className={classNames(classes.showButton)}
                                      onClick={this.getStarted.bind(this)}
                                      >
                                      Get started
                                  </Button>}
                              </Grid>
                          </Grid>
                    </Grid>
                </Grid>}
                </Fade>
            </Modal>
        </React.Fragment>
    }
}

export default withStyles(styles)(withStore(AboutModalContainer))
