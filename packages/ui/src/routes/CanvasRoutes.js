import { lazy } from 'react'

// project imports
import Loadable from 'ui-component/loading/Loadable'
import MinimalLayout from 'layout/MinimalLayout'

// canvas routing
const Canvas = Loadable(lazy(() => import('views/canvas')))
const Workflow_Canvas = Loadable(lazy(() => import('views/workflow_canvas')))
const MarketplaceCanvas = Loadable(lazy(() => import('views/marketplaces/MarketplaceCanvas')))

// ==============================|| CANVAS ROUTING ||============================== //

const CanvasRoutes = {
    path: '/',
    element: <MinimalLayout />,
    children: [
        {
            path: '/canvas',
            element: <Canvas />
        },
        {
            path: '/canvas/:id',
            element: <Canvas />
        },
        {
            path: '/workflow-designer',
            element: <Workflow_Canvas />
        },
        {
            path: '/workflow-designer/:id',
            element: <Workflow_Canvas />
        },
        {
            path: '/marketplace/:id',
            element: <MarketplaceCanvas />
        }
    ]
}

export default CanvasRoutes
