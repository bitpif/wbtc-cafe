import React from 'react';
import classNames from 'classnames'
import { withStyles } from '@material-ui/styles';

const styles = () => ({
    link: {
        fontSize: 12,
        textDecoration: 'underline',
        cursor: 'pointer',
    }
})

const ActionLink = function(props) {
    const {
        children,
        classes,
        className
    } = props

    return <a className={classNames(classes.link, className)} {...props}>{children}</a>
}

export default withStyles(styles)(ActionLink);
