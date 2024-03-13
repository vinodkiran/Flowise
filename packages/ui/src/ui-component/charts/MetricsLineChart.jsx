import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import PropTypes from 'prop-types'

const costData = [
    {
        x: '2024-01-20',
        y: 2387.463768115942,
        count: 69
    },
    {
        x: '2024-01-21',
        y: 2409.7083333333335,
        count: 72
    },
    {
        x: '2024-01-22',
        y: 2516.5,
        count: 60
    },
    {
        x: '2024-01-23',
        y: 2539.2676056338028,
        count: 71
    },
    {
        x: '2024-01-24',
        y: 2490.8939393939395,
        count: 66
    },
    {
        x: '2024-01-25',
        y: 2806.220779220779,
        count: 77
    },
    {
        x: '2024-01-26',
        y: 2637.342105263158,
        count: 76
    },
    {
        x: '2024-01-27',
        y: 2654.6666666666665,
        count: 57
    },
    {
        x: '2024-01-28',
        y: 2349.014705882353,
        count: 68
    },
    {
        x: '2024-01-29',
        y: 2887.7714285714287,
        count: 70
    },
    {
        x: '2024-01-30',
        y: 2388.375,
        count: 64
    },
    {
        x: '2024-01-31',
        y: 4641.666666666667,
        count: 3
    },
    {
        x: '2024-02-01',
        y: null,
        count: 0
    },
    {
        x: '2024-02-02',
        y: null,
        count: 0
    },
    {
        x: '2024-02-03',
        y: null,
        count: 0
    },
    {
        x: '2024-02-04',
        y: null,
        count: 0
    },
    {
        x: '2024-02-05',
        y: null,
        count: 0
    },
    {
        x: '2024-02-06',
        y: null,
        count: 0
    },
    {
        x: '2024-02-07',
        y: null,
        count: 0
    },
    {
        x: '2024-02-08',
        y: null,
        count: 0
    },
    {
        x: '2024-02-09',
        y: null,
        count: 0
    },
    {
        x: '2024-02-10',
        y: null,
        count: 0
    },
    {
        x: '2024-02-11',
        y: null,
        count: 0
    },
    {
        x: '2024-02-12',
        y: null,
        count: 0
    },
    {
        x: '2024-02-13',
        y: null,
        count: 0
    },
    {
        x: '2024-02-14',
        y: null,
        count: 0
    },
    {
        x: '2024-02-15',
        y: null,
        count: 0
    },
    {
        x: '2024-02-16',
        y: null,
        count: 0
    },
    {
        x: '2024-02-17',
        y: null,
        count: 0
    },
    {
        x: '2024-02-18',
        y: null,
        count: 0
    },
    {
        x: '2024-02-19',
        y: null,
        count: 0
    }
]

const latencyData = [
    {
        x: '2024-01-20',
        y: 12,
        count: 12
    },
    {
        x: '2024-01-21',
        y: 7,
        count: 7
    },
    {
        x: '2024-01-22',
        y: 3,
        count: 3
    },
    {
        x: '2024-01-23',
        y: 13,
        count: 13
    },
    {
        x: '2024-01-24',
        y: 12,
        count: 12
    },
    {
        x: '2024-01-25',
        y: 16,
        count: 16
    },
    {
        x: '2024-01-26',
        y: 9,
        count: 9
    },
    {
        x: '2024-01-27',
        y: 16,
        count: 16
    },
    {
        x: '2024-01-28',
        y: 27,
        count: 27
    },
    {
        x: '2024-01-29',
        y: 24,
        count: 24
    },
    {
        x: '2024-01-30',
        y: 17,
        count: 17
    },
    {
        x: '2024-01-31',
        y: 3,
        count: 3
    },
    {
        x: '2024-02-01',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-02',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-03',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-04',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-05',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-06',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-07',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-08',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-09',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-10',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-11',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-12',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-13',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-14',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-15',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-16',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-17',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-18',
        y: 0,
        count: 0
    },
    {
        x: '2024-02-19',
        y: 0,
        count: 0
    }
]

export const MetricsLineChart = ({ isLoading, chartType, onClick }) => {
    return (
        <ResponsiveContainer width='95%' height={300}>
            <LineChart
                onClick={onClick}
                width={500}
                height={250}
                data={chartType === 'AVG_COST' ? costData : latencyData}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='x' />
                <YAxis />
                <Tooltip />
                <Line type='monotone' dataKey='y' stroke={chartType === 'AVG_COST' ? '#F32266' : '#8884d8'} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    )
}

MetricsLineChart.propTypes = {
    isLoading: PropTypes.bool,
    chartType: PropTypes.string,
    onClick: PropTypes.func
}
