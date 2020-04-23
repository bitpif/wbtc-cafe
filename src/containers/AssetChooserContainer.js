import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'
import RenSDK from "@renproject/ren";
import { createTransaction, submitToEthereum } from '../utils/renUtils'
import { resetWallet, setNetwork, MINI_ICON_MAP } from '../utils/walletUtils'

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

import BTC from '../assets/btc.png'
import ETH from '../assets/eth.png'
import ZEC from '../assets/zec.jpg'
import DAI from '../assets/dai.png'
import USDC from '../assets/usdc.png'

const styles = () => ({
    container: {
        padding: theme.spacing(3),
        display: 'flex',
        '& :last-child': {
            // paddingRight: 0
        },
        borderBottom: '0.5px solid ' + theme.palette.divider,
        display: 'flex',
        alignItems: 'center'
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      marginRight: theme.spacing(1.5)
    },
    on: {
      marginRight: theme.spacing(2)
    },
    buttonContainer: {
        // width: '30%',
        flex: 1,
        minWidth: 50,
        paddingRight: theme.spacing(2)
    },
    button: {
        marginBottom: theme.spacing(2),
        width: '100% !important',
        backgroundColor: 'transparent',
        color: '#333',
        boxShadow: '0px 0px 0px 0px rgba(0, 0, 0, 0.05) !important',
        border: '1px solid #EBEBEB',
        '&:hover': {
            backgroundColor: '#fff',
            boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.10) !important'
        },
        '& .MuiFab-label': {
            textTransform: 'initial',
        },
        fontSize: 14
        // minWidth: 100
    },
    icon: {
        width: 20,
        height: 'auto',
        marginRight: theme.spacing(1),
    },
    active: {
        boxShadow: '0px 0px 20px 0px rgba(0, 0, 0, 0.10) !important',
        backgroundColor: '#fff',
    }
})

class AssetChooserContainer extends React.Component {

    constructor(props) {
        super(props);
    }

    anchorRef = React.createRef()

    async componentDidMount() {
    }

    toggleNeworkMenu() {
        const { store } = this.props
        const showNetworkMenu = store.get('showNetworkMenu')
        store.set('showNetworkMenu', !showNetworkMenu)
    }

    toggleAsset(symbol) {
        const { store } = this.props
        store.set('selectedAsset', symbol)
    }

    render() {
        const {
            classes,
            store
        } = this.props

        const walletAddress = store.get('walletAddress')
        const showNetworkMenu = store.get('showNetworkMenu')
        const selectedNetwork = store.get('selectedNetwork')
        const selectedAsset = store.get('selectedAsset')

        const isSignedIn = walletAddress && walletAddress.length

        // console.log(this.props, this.state, this.props.store.getState())

        return <Grid item xs={12} className={classes.container}>
            <div className={classes.item}>
              <Button
                  size="small"
                  className={classNames(classes.margin, classes.transferAssetButton)}
                  onClick={()=> {}}>
                <img src={MINI_ICON_MAP['btc']} className={classes.icon} />
                <Typography><b>BTC</b></Typography>
              </Button>
            </div>
            <Typography className={classes.on}>on</Typography>
              <div className={classes.item}>
                  <WifiIcon className={classes.icon} />
                  <Typography><b>Ethereum</b></Typography>
              </div>
        </Grid>
    }
}

export default withStyles(styles)(withStore(AssetChooserContainer))
