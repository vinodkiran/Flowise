import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import PropTypes from 'prop-types'

const data2 = [
    {
        month: '2015.01',
        Positive: 4000,
        Negative: 2400,
        Unrated: 2400
    },
    {
        month: '2015.02',
        Positive: 3000,
        Negative: 1398,
        Unrated: 2210
    },
    {
        month: '2015.03',
        Positive: 2000,
        Negative: 9800,
        Unrated: 2290
    },
    {
        month: '2015.04',
        Positive: 2780,
        Negative: 3908,
        Unrated: 2000
    },
    {
        month: '2015.05',
        Positive: 1890,
        Negative: 4800,
        Unrated: 2181
    },
    {
        month: '2015.06',
        Positive: 2390,
        Negative: 3800,
        Unrated: 2500
    },
    {
        month: '2015.07',
        Positive: 3490,
        Negative: 4300,
        Unrated: 2100
    }
]

const toPercent = (decimal, fixed = 0) => `${(decimal * 100).toFixed(0)}%`

const getPercent = (value, total) => {
    const ratio = total > 0 ? value / total : 0

    return toPercent(ratio)
}

const renderTooltipContent = (o) => {
    const { payload, label } = o
    const total = payload.reduce((result, entry) => result + entry.value, 0)

    return (
        <div className='customized-tooltip-content'>
            <p className='total'>{`${label} (Total: ${total})`}</p>
            <ul className='list'>
                {payload.map((entry, index) => (
                    <li key={`item-${index}`} style={{ color: entry.color }}>
                        {`${entry.name}: ${entry.value}(${getPercent(entry.value, total)})`}
                    </li>
                ))}
            </ul>
        </div>
    )
}
export const MetricsPercentAreaChart = ({ isLoading, data, chartType, onClick, onBarClick }) => {
    return (
        <ResponsiveContainer width='95%' height={300}>
            <AreaChart
                width={500}
                height={400}
                data={data2}
                stackOffset='expand'
                margin={{
                    top: 10,
                    right: 30,
                    left: 0,
                    bottom: 0
                }}
            >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' />
                <YAxis tickFormatter={toPercent} />
                <Tooltip content={renderTooltipContent} />
                <Area type='monotone' dataKey='Positive' stackId='1' stroke='#8884d8' fill='#8884d8' />
                <Area type='monotone' dataKey='Negative' stackId='1' stroke='#82ca9d' fill='#82ca9d' />
                <Area type='monotone' dataKey='Unrated' stackId='1' stroke='#ffc658' fill='#ffc658' />
            </AreaChart>
        </ResponsiveContainer>
    )
}

MetricsPercentAreaChart.propTypes = {
    isLoading: PropTypes.bool,
    data: PropTypes.object,
    chartType: PropTypes.string,
    onClick: PropTypes.func,
    onBarClick: PropTypes.func
}
