import { lazy } from 'react'

// project imports
import MainLayout from '@/layout/MainLayout'
import Loadable from '@/ui-component/loading/Loadable'

// chatflows routing
const Chatflows = Loadable(lazy(() => import('@/views/chatflows')))

// marketplaces routing
const Marketplaces = Loadable(lazy(() => import('@/views/marketplaces')))

// apikey routing
const APIKey = Loadable(lazy(() => import('@/views/apikey')))

// tools routing
const Tools = Loadable(lazy(() => import('@/views/tools')))

// assistants routing
const Assistants = Loadable(lazy(() => import('@/views/assistants')))

// credentials routing
const Credentials = Loadable(lazy(() => import('@/views/credentials')))

// variables routing
const Variables = Loadable(lazy(() => import('@/views/variables')))

// Eval/Metrics routing
const EvalMetrics = Loadable(lazy(() => import('@/views/evaluations/metrics')))
const EvalMetricsInferences = Loadable(lazy(() => import('@/views/evaluations/inferences')))
const EvalMetricsLatency = Loadable(lazy(() => import('@/views/evaluations/latency')))
const EvalBenchmarking = Loadable(lazy(() => import('@/views/evaluations/benchmarking')))
const EvalEvaluation = Loadable(lazy(() => import('@/views/evaluations/evaluation')))
const EvalEvaluationRows = Loadable(lazy(() => import('@/views/evaluations/evaluation_rows')))
const EvalDatasets = Loadable(lazy(() => import('@/views/evaluations/dataset')))
const EvalDatasetRows = Loadable(lazy(() => import('@/views/evaluations/dataset_rows')))

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
    path: '/',
    element: <MainLayout />,
    children: [
        {
            path: '/',
            element: <Chatflows />
        },
        {
            path: '/chatflows',
            element: <Chatflows />
        },
        {
            path: '/marketplaces',
            element: <Marketplaces />
        },
        {
            path: '/apikey',
            element: <APIKey />
        },
        {
            path: '/tools',
            element: <Tools />
        },
        {
            path: '/assistants',
            element: <Assistants />
        },
        {
            path: '/credentials',
            element: <Credentials />
        },
        {
            path: '/variables',
            element: <Variables />
        },
        {
            path: '/metrics',
            element: <EvalMetrics />
        },
        {
            path: '/metrics_inferences',
            element: <EvalMetricsInferences />
        },
        {
            path: '/metrics_latency',
            element: <EvalMetricsLatency />
        },
        {
            path: '/benchmarking',
            element: <EvalBenchmarking />
        },
        {
            path: '/dataset',
            element: <EvalDatasets />
        },
        {
            path: '/evaluation',
            element: <EvalEvaluation />
        },
        {
            path: '/evaluation_rows/:id',
            element: <EvalEvaluationRows />
        },
        {
            path: '/dataset_rows/:id',
            element: <EvalDatasetRows />
        }
    ]
}

export default MainRoutes
