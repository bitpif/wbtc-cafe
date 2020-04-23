import React, { PureComponent } from 'react';
import dateFormat from 'dateformat'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { withStyles } from '@material-ui/styles';
import theme from '../theme/theme'
import classNames from 'classnames'


const styles = () => ({
  '@global': {
    // '.recharts-surface text, .recharts-legend-item-text': {
    //   fontFamily: '"Work Sans", sans-serif',
    //   fontSize: 12,
    //   color: '#ABB6CA'
    // },
    '.recharts-tooltip-cursor': {
      fill: 'transparent',
      stroke: 'rgba(171, 182, 202, 0.3) !important'
    },
    '.recharts-cartesian-grid line': {
      stroke: 'rgba(255, 255, 255, 0.23)'
    },
    '.recharts-cartesian-axis-ticks line, .recharts-cartesian-axis-line': {
      stroke: 'rgba(255, 255, 255, 0.23)'
    },
    '.recharts-cartesian-axis-ticks text, .recharts-layer text': {
      // fill: '#ABB6CA'
    },
    '.recharts-cartesian-axis-tick tspan, .recharts-pie-label-text tspan': {
      fontSize: 12
    },
    '.recharts-tooltip-wrapper': {
      fontFamily: '"Work Sans", sans-serif',
      fontSize: 12
    },
    '.recharts-legend-item': {
      cursor: 'pointer'
    },
    '.recharts-legend-item.inactive': {
      opacity: 0.5
    },
    // '.recharts-sector': {
    //   stroke: 'transparent',
    //   strokeWidth: '0px'
    // },
    '.recharts-legend-item:hover .recharts-legend-item-text': {
      color: '#fff'
    },
    '.recharts-default-tooltip': {
      border: '1px solid ' + theme.palette.divider + ' !important',
      backgroundColor: '#040e13 !important'
    },
    // '.recharts-tooltip-label': {
    //   color: '#ABB6CA',
    //   fontSize: 12,
    //   paddingBottom: '6px !important',
    //   marginTop: '4px !important',
    //   marginBottom: '2px !important',
    //   borderBottom: '1px solid rgb(34, 51, 90) !important'
    // }
    '.recharts-tooltip-wrapper': {
      transition: 'all 0s ease-in-out !important'
    }
  }
})

class Component extends React.Component {
    render() {
        const { data } = this.props
        if (!data) return null
        // console.log('data', data)
        return <ResponsiveContainer width={'100%'} height={450}>
            <AreaChart
              data={data}
              margin={{
                top: 50, right: 30, left: 0, bottom: 0,
              }}
            >
              {<CartesianGrid strokeDasharray="3 3" />}
              <XAxis tickCount={5} dataKey="_timestamp" tickFormatter={value => (dateFormat(new Date(Number(value * 1000)), 'shortDate'))}/>
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="wBTC" stackId="1" stroke="#ffa600" fill="#ffa600" />
              {<Area type="monotone" dataKey="imBTC" stackId="1" stroke="#ff6361" fill="#ff6361" />}
              {<Area type="monotone" dataKey="sBTC" stackId="1" stroke="#bc5090" fill="#bc5090" />}
              {<Area type="monotone" dataKey="renBTC" stackId="1" stroke="#58508d" fill="#58508d" />}
              {<Area type="monotone" dataKey="pBTC" stackId="1" stroke="#003f5c" fill="#003f5c" />}
              {/*<Area type="monotone" dataKey="0xBTC" stackId="1" stroke="#374c80" fill="#374c80" />}
              {<Area type="monotone" dataKey="tBTC" stackId="1" stroke="#003f5c" fill="#003f5c" />*/}
              <Tooltip isAnimationActive={false} />
              <Legend iconType='rect' verticalAlign="bottom" height={36}/>
          </AreaChart>
        </ResponsiveContainer>
    }
}

export default withStyles(styles)(Component);
