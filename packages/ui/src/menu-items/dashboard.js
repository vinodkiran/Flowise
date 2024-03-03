// assets
import {
    IconHierarchy,
    IconBuildingStore,
    IconKey,
    IconTool,
    IconLock,
    IconRobot,
    IconVariable,
    IconGraph,
    IconAB,
    IconDatabase,
    IconTestPipe
} from '@tabler/icons'

// constant
const icons = {
    IconHierarchy,
    IconBuildingStore,
    IconKey,
    IconTool,
    IconLock,
    IconRobot,
    IconVariable,
    IconGraph,
    IconAB,
    IconDatabase,
    IconTestPipe
}

// ==============================|| DASHBOARD MENU ITEMS ||============================== //

const dashboard = {
    id: 'dashboard',
    title: '',
    type: 'group',
    children: [
        {
            id: 'chatflows',
            title: 'Chatflows',
            type: 'item',
            url: '/chatflows',
            icon: icons.IconHierarchy,
            breadcrumbs: true
        },
        {
            id: 'marketplaces',
            title: 'Marketplaces',
            type: 'item',
            url: '/marketplaces',
            icon: icons.IconBuildingStore,
            breadcrumbs: true
        },
        {
            id: 'tools',
            title: 'Tools',
            type: 'item',
            url: '/tools',
            icon: icons.IconTool,
            breadcrumbs: true
        },
        {
            id: 'assistants',
            title: 'Assistants',
            type: 'item',
            url: '/assistants',
            icon: icons.IconRobot,
            breadcrumbs: true
        },
        {
            id: 'credentials',
            title: 'Credentials',
            type: 'item',
            url: '/credentials',
            icon: icons.IconLock,
            breadcrumbs: true
        },
        {
            id: 'variables',
            title: 'Variables',
            type: 'item',
            url: '/variables',
            icon: icons.IconVariable,
            breadcrumbs: true
        },
        {
            id: 'apikey',
            title: 'API Keys',
            type: 'item',
            url: '/apikey',
            icon: icons.IconKey,
            breadcrumbs: true
        },
        {
            id: 'evals',
            title: 'Metrics & Evaluations',
            type: 'collapse',
            children: [
                {
                    id: 'metrics',
                    title: 'Metrics',
                    type: 'item',
                    url: '/metrics',
                    icon: icons.IconGraph,
                    breadcrumbs: true
                },
                {
                    id: 'dataset',
                    title: 'Datasets',
                    type: 'item',
                    url: '/dataset',
                    icon: icons.IconDatabase,
                    breadcrumbs: true
                },
                {
                    id: 'eval',
                    title: 'Evaluations',
                    type: 'item',
                    url: '/evaluation',
                    icon: icons.IconTestPipe,
                    breadcrumbs: true
                },
                {
                    id: 'benchmarking',
                    title: 'Benchmarking',
                    type: 'item',
                    url: '/benchmarking',
                    icon: icons.IconAB,
                    breadcrumbs: true
                }
            ]
        }
    ]
}

export default dashboard
