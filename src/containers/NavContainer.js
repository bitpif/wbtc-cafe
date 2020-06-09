import React from 'react';
import { withStore } from '@spyna/react-store'
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'

import { initLocalWeb3 } from '../utils/walletUtils'


import WBTCIcon from '../assets/wbtc-logo.svg';

import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';


const styles = () => ({
    navContainer: {
        paddingTop: theme.spacing(4),
        paddingBottom: theme.spacing(4),
        minHeight: 52,
        borderBottom: '0.5px solid ' + theme.palette.divider,
        backgroundColor: '#fff'
    },
    logo: {
        height: 22,
        width: 25,
        marginRight: theme.spacing(1),
        // [theme.breakpoints.down('xs')]: {
        //     height: 17,
        //     width: 20,
        // }
    },
    cafe: {
        fontFamily: 'Alex Brush',
        marginLeft: theme.spacing(0.5),
        fontSize: 15
    },
    aboutButton: {
        marginRight: theme.spacing(1),
        '& svg': {
            height: '0.7em',
            marginRight: theme.spacing(0.25)
        }
    },
    accountButton: {
      fontSize: 12,
      '& svg': {
        marginRight: theme.spacing(1)
        },
        [theme.breakpoints.down('xs')]: {
            width: '100%',
            marginTop: theme.spacing(2)
        }
    },
    title: {
      // marginBottom: theme.spacing(0.5),
      fontSize: 16,
      textAlign: 'center'
        // [theme.breakpoints.down('xs')]: {
        //     // fontSize: 16
        //     display: 'none'
        // }
    },
    faq: {
        marginRight: theme.spacing(2)
    },
    hideMobile: {
        [theme.breakpoints.down('xs')]: {
            // fontSize: 16
            display: 'none'
        }
    },
    disabled: {
        pointer: 'inherit',
        borderColor: 'transparent',
        '&:hover': {
            background: '#fff'
        }
    },
    addressLabel: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1)
    }
})

class NavContainer extends React.Component {

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

    render() {
        const {
            classes,
            store
        } = this.props

        const walletAddress = store.get('localWeb3Address')

        const isSignedIn = walletAddress && walletAddress.length
        const balance = store.get('wbtcBalance')

        return <Grid item xs={12} className={classes.navContainer}>
            <Container size='lg'>
              {<Grid  container alignItems='center'>
                <Grid item xs={12} sm={4}>
                    <Grid container alignItems='center'>
                          {<img className={classes.logo} src={WBTCIcon} />}
                          <Typography className={classes.title}><b>WBTC</b> </Typography>
                          <Typography className={classes.title}><span className={classes.cafe}>Cafe</span></Typography>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={8}>
                    <Grid container justify='flex-end' alignItems='center'>
                      {isSignedIn && <div className={classes.faq}>
                          <Typography variant='caption'>Balance: {balance} WBTC</Typography>
                      </div>}
                      {!isSignedIn ? <Button variant="outlined"
                          onClick={() => {
                              if (!isSignedIn) {
                                  initLocalWeb3()
                              }
                          }}
                          disableRipple={true}
                          size='large'
                          className={classNames(classes.accountButton)}>
                            {<span>Connect Wallet</span>}
                        </Button> : <Typography variant='caption' className={classes.addressLabel}>{(walletAddress.slice(0,7) + '...' + walletAddress.slice(walletAddress.length - 5))}</Typography>}

                    </Grid>
                </Grid>
              </Grid>}
            </Container>
        </Grid>
    }
}

export default withStyles(styles)(withStore(NavContainer))
