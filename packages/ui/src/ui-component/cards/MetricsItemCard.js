import PropTypes from 'prop-types'

// material-ui
import { styled } from '@mui/material/styles'
import { Box, Grid, Typography } from '@mui/material'

// project imports
import MainCard from 'ui-component/cards/MainCard'
import SkeletonChatflowCard from 'ui-component/cards/Skeleton/ChatflowCard'

const CardWrapper = styled(MainCard)(({ theme }) => ({
    background: theme.palette.card.main,
    color: theme.darkTextPrimary,
    overflow: 'auto',
    position: 'relative',
    boxShadow: '0 2px 14px 0 rgb(32 40 45 / 8%)',
    cursor: 'pointer',
    '&:hover': {
        background: theme.palette.card.hover,
        boxShadow: '0 2px 14px 0 rgb(32 40 45 / 20%)'
    },
    overflowWrap: 'break-word',
    whiteSpace: 'pre-line'
}))

// ===========================|| CONTRACT CARD ||=========================== //

const MetricsItemCard = ({ isLoading, data, onClick, component }) => {
    return (
        <>
            {isLoading ? (
                <SkeletonChatflowCard />
            ) : (
                <CardWrapper border={false} content={false} onClick={onClick} alignItems='center' sx={{ textAlign: 'center' }}>
                    <Box sx={{ p: 2.25 }}>
                        <Grid container direction='column'>
                            <Grid key='0'>
                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: 200,
                                        color: 'text.secondary'
                                    }}
                                >
                                    {data.header}
                                </Typography>
                                <Typography
                                    sx={{
                                        fontSize: '1.5rem',
                                        fontWeight: 500,
                                        marginLeft: '10'
                                    }}
                                >
                                    {data.value}
                                </Typography>
                            </Grid>
                            <Grid key='1' sx={{ flexGrow: 1 }}>
                                {component}
                            </Grid>
                        </Grid>
                    </Box>
                </CardWrapper>
            )}
        </>
    )
}

MetricsItemCard.propTypes = {
    isLoading: PropTypes.bool,
    data: PropTypes.object,
    onClick: PropTypes.func,
    component: PropTypes.element
}

export default MetricsItemCard
