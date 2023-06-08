import { Box, Button, Card, CardActions, CardContent, CircularProgress, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Delete, PermIdentity, Upload } from '@mui/icons-material';

export default function VillageCard({
    villageData,
    index,
    handleVillageMembersCSVUpload,
    handleDeleteVillageMembers,
    handleVillageInchargeDisplay
}) {
    return (
        <Grid item xs={1} sm={1} md={1} lg={1} key={index}>
            <Card sx={{ minHeight: 120 }}>
                <CardContent >
                    <Box display={"flex"} >
                        <Typography alignSelf='center' color={'#415468'} fontWeight='bold'>
                            {villageData.villageName}
                        </Typography>
                        <Box flex='1'></Box>
                        <IconButton onClick={handleVillageInchargeDisplay}>
                            <PermIdentity sx={{ color: '#80b0df' }} />
                        </IconButton>
                    </Box>

                    <Box height='2rem'>
                        <Typography sx={{ color: '#d81f10', fontSize: 13 }}>
                            {villageData.errorMessage}
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
                                villageData.progressStatus.uploadInProgress
                                    ? <LinearProgress />
                                    : <Button
                                        disabled={villageData.mappedPartyPeoplesKey !== ''}
                                        variant="outlined"
                                        component="label"
                                    >
                                        <Typography display={{ xs: 'none', sm: 'block' }}>Upload</Typography> <Upload />
                                        <input
                                            onChange={(event) => handleVillageMembersCSVUpload(event)}
                                            type="file"
                                            accept=".csv"
                                            hidden
                                        />
                                    </Button>
                            }
                        </Box>
                        <Box
                            display="flex"
                            flexDirection={'column'}
                            justifyContent='center'
                            pl={2}
                            pr={2}
                        >
                            {
                                villageData.progressStatus.deleteInProgress
                                    ? <CircularProgress color="error" />
                                    : <IconButton
                                        disabled={villageData.mappedPartyPeoplesKey === ''}
                                        color='error'
                                        type="button"
                                        variant="contained"
                                        onClick={handleDeleteVillageMembers}
                                    >
                                        <Delete />
                                    </IconButton>
                            }
                        </Box>
                    </Box>
                </CardActions>
            </Card >
        </Grid>
    );
}
