import { Avatar, Box, Button, Card, CardActions, CardContent, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { ListAlt, PersonAdd } from '@mui/icons-material';

export default function InchargeCardGrid({
    inchargeData,
    index,
    showEmailInputPopup,
    displayVillageListDrawer
}) {
    return (
        <Grid item xs={1} sm={1} md={1} lg={1} key={index}>
            <Card sx={{ minHeight: 120 }}>
                <CardContent >
                    <Box display="flex" flex='1'>
                        <Avatar
                            alt={String(inchargeData.fullName).toUpperCase()}
                            src={inchargeData.profilePicThumbnail ? inchargeData.profilePicThumbnail : 'null'}
                        />
                        <Box flex='1'></Box>

                        <IconButton
                            onClick={displayVillageListDrawer}
                        >
                            <ListAlt color='info' />
                        </IconButton>

                    </Box>

                    <Box>
                        <Typography color={'#415468'} fontWeight='bold'>
                            {inchargeData.fullName}
                        </Typography>
                        <Typography noWrap color={'#415468'}>
                            {inchargeData.email}
                        </Typography>
                    </Box>
                    <Box height='2rem'>
                        <Typography sx={{ color: '#d81f10', fontSize: 13 }}>
                            {inchargeData.errorMessage}
                        </Typography>
                    </Box>
                </CardContent>
                <CardActions>
                    <Box display="flex" flex='1' >
                        <Box
                            display="flex"
                            flexDirection={'column'}
                            flex='1'
                            justifyContent={'center'}
                        >
                            {
                                inchargeData.progressStatus.emailChangeInProgress
                                    ? <LinearProgress />
                                    : <Button
                                        onClick={showEmailInputPopup}
                                        variant="contained"
                                        component="label"
                                    >
                                        <PersonAdd />
                                        <Typography display={{ xs: 'none', sm: 'flex' }} ml={2} fontSize={12} >Assign New User</Typography>

                                    </Button>
                            }
                        </Box>
                    </Box>
                </CardActions>
            </Card >
        </Grid>
    );
}