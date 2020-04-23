import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import DetectNetwork from "web3-detect-network";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { initBrowserWallet } from '../utils/walletUtils'
import { removeTx } from '../utils/txUtils'
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


// import adapterDelegatedABI from "../utils/adapterDelegatedABI.json";

const adapterDelegatedAddress = '0xA7d1D2b4755E9D578D13e06b5b2796d870F6867a'
const adapterAddress = '0x5e822a5a9c5cd9b3444228697d319a9f94b83b98'

const contractAddress = '0xe2590f8b8ddad007c936e43a6ab4f464922b1e8d' // adapter.sol
const vestingAddress = '0x4e4b23e74D203c7009c6a9FFf7751d1fd611F187'
const zbtcContractAddress = "0xc6069e8dea210c937a846db2cebc0f58ca111f26";
const registryAddress = '0xbA563a8510d86dE95F5a50007E180d6d4966ad12'
const uniswapExchangeAddress = '0x2f177704b7ceb1fa56c8956479f321b56ad9e3b4'
const uniswapFactoryAddress = '0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30'
const zbtcUniswapExchangeAddress = '0x66Cf36abceb7f36640000C41dc626afC203180cF'
const kovanUniswapFactory = "0xD3E51Ef092B2845f10401a0159B2B96e8B6c3D30"
const buttonChangerAddress = '0x1d45ed651788f1043564a9361fc8962bafe20186'
const buttonChangerLiteAddress = '0x8040d61b43502b249248fc34a2e377d0ae8ad5cf'
const basicVerifyAddress = '0x93ac46df2436b2578003568c7c043080935c0df6'



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
      width: 360,
      maxWidth: '100%',
      padding: theme.spacing(2)
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
    cancelButton: {
        marginTop: theme.spacing(3),
    },
    backButton: {
        marginTop: theme.spacing(1),
    },
    snackbar: {
        backgroundColor: '#1976d2'
    },
    connectWalletPrompt: {
        padding: theme.spacing(1),
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

        // background: '#141e30',
        // background: '-webkit-linear-gradient(to right, #141e30, #243b55)',
        // background: 'linear-gradient(to right, #141e30, #243b55)'
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
      content: {
          fontSize: 14
      }
    },
})

class CancelModalContainer extends React.Component {

    constructor(props) {
        super(props);
        this.state = {}
    }

    cancelDeposit() {
        const { store } = this.props
        const cancelModalTx = store.get('cancelModalTx')

        removeTx(store, cancelModalTx.id)

        store.set('showCancelModal', false)
        store.set('cancelModalTx', null)
    }

    goBack() {
        const { store } = this.props

        store.set('showCancelModal', false)
        store.set('cancelModalTx', null)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const showCancelModal = store.get('showCancelModal')
        const cancelModalTx = store.get('cancelModalTx')

        if (!cancelModalTx) return null

        // console.log(this.props, this.state)

        return <Modal
          aria-labelledby="transition-modal-title"
          aria-describedby="transition-modal-description"
          className={classes.modal}
          open={showCancelModal}
          onClose={() => {
            store.set('showCancelModal', false)
            store.set('cancelModalTx', null)
          }}
          closeAfterTransition
          BackdropComponent={Backdrop}
          BackdropProps={{
            timeout: 500,
          }}
        >
          <Fade in={showCancelModal}>
            <Grid container className={classes.modalContent}>
                <Grid className={classNames(classes.connectWalletPrompt)} container alignItems='center' justify='center'>

                      <Grid item xs={12}>
                          <Grid container>
                              {<Typography variant='subtitle1' className={classes.title}>
                                Are you sure?
                              </Typography>}

                              <Typography variant='body1' className={classes.content}>
                                Bitcoin sent to this deposit address will be no longer be accessible.
                              </Typography>

                              {<Button
                                  variant="contained"
                                  size='large'
                                  color="primary"
                                  fullWidth={true}
                                  className={classNames(classes.cancelButton)}
                                  onClick={this.cancelDeposit.bind(this)}
                                  >
                                  Cancel deposit
                              </Button>}

                              {<Button
                                  size='large'
                                  color="primary"
                                  fullWidth={true}
                                  className={classNames(classes.backButton)}
                                  onClick={this.goBack.bind(this)}
                                  >
                                  Go back
                              </Button>}


                          </Grid>
                      </Grid>
                </Grid>
            </Grid>
          </Fade>
        </Modal>
    }
}

export default withStyles(styles)(withStore(CancelModalContainer))
