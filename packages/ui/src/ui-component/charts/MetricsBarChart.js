import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import PropTypes from 'prop-types'

const data = [
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

const barData = [
    {
        x: '2024-01-20',
        y: 69,
        count: 69
    },
    {
        x: '2024-01-21',
        y: 72,
        count: 72
    },
    {
        x: '2024-01-22',
        y: 60,
        count: 60
    },
    {
        x: '2024-01-23',
        y: 71,
        count: 71
    },
    {
        x: '2024-01-24',
        y: 66,
        count: 66
    },
    {
        x: '2024-01-25',
        y: 77,
        count: 77
    },
    {
        x: '2024-01-26',
        y: 76,
        count: 76
    },
    {
        x: '2024-01-27',
        y: 57,
        count: 57
    },
    {
        x: '2024-01-28',
        y: 68,
        count: 68
    },
    {
        x: '2024-01-29',
        y: 70,
        count: 70
    },
    {
        x: '2024-01-30',
        y: 64,
        count: 64
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
export const MetricsBarChart = ({ isLoading, chartType, onClick }) => {
    return (
        <ResponsiveContainer width='95%' height={300}>
            <BarChart
                onClick={onClick}
                width={300}
                height={250}
                data={chartType === 'TOTAL_INFERENCES' ? barData : data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5
                }}
            >
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='x' />
                <YAxis dataKey='y' />
                <Tooltip />
                <Bar dataKey='count' fill={chartType === 'TOTAL_INFERENCES' ? '#82ca9d' : '#e8629c'} />
            </BarChart>
        </ResponsiveContainer>
    )
}

MetricsBarChart.propTypes = {
    isLoading: PropTypes.bool,
    chartType: PropTypes.string,
    onClick: PropTypes.func
}
