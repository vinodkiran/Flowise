import { lazy } from 'react'

// project imports
import Loadable from '@/ui-component/loading/Loadable'
import MinimalLayout from '@/layout/MinimalLayout'

// canvas routing
const Canvas = Loadable(lazy(() => import('@/views/canvas')))
const MarketplaceCanvas = Loadable(lazy(() => import('@/views/marketplaces/MarketplaceCanvas')))
const Workflow_Canvas = Loadable(lazy(() => import('@/views/workflow_canvas')))
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
            path: '/agentcanvas',
            element: <Canvas />
        },
        {
            path: '/agentcanvas/:id',
            element: <Canvas />
        },
        {
            path: '/marketplace/:id',
            element: <MarketplaceCanvas />
        }
    ]
}

export default CanvasRoutes
