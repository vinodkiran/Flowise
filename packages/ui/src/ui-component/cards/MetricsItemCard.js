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
    maxHeight: '600px',
    maxWidth: '400px',
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
                <CardWrapper border={false} content={false} onClick={onClick}>
                    <Box sx={{ p: 2.25 }}>
                        <Grid container direction='column'>
                            <div
                                style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'left'
                                }}
                            >
                                {data.iconSrc && (
                                    <div
                                        style={{
                                            width: 35,
                                            height: 35,
                                            marginRight: 10,
                                            borderRadius: '50%',
                                            background: `url(${data.iconSrc})`,
                                            backgroundSize: 'contain',
                                            backgroundRepeat: 'no-repeat',
                                            backgroundPosition: 'center center'
                                        }}
                                    ></div>
                                )}
                                {!data.iconSrc && data.color && (
                                    <div
                                        style={{
                                            width: 35,
                                            height: 35,
                                            marginRight: 10,
                                            borderRadius: '50%',
                                            background: data.color
                                        }}
                                    ></div>
                                )}
                                <Typography
                                    sx={{
                                        fontSize: '0.8rem',
                                        fontWeight: 200,
                                        color: 'text.secondary',
                                        textTransform: 'capitalize',
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'pre-line'
                                    }}
                                >
                                    {data.header}
                                </Typography>
                            </div>
                            {data.value && (
                                <span
                                    style={{
                                        marginTop: 20,
                                        marginBottom: 20,
                                        overflowWrap: 'break-word',
                                        whiteSpace: 'pre-line',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            fontSize: '1.5rem',
                                            fontWeight: 500,
                                            overflowWrap: 'break-word',
                                            whiteSpace: 'pre-line'
                                        }}
                                    >
                                        {data.value}
                                    </Typography>
                                </span>
                            )}
                            {component}
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
