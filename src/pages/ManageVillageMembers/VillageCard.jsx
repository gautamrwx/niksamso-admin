import { Box, Button, Card, CardActions, CardContent, CircularProgress, Grid, IconButton, LinearProgress, Typography } from '@mui/material';
import { Delete, PermIdentity, Replay, Upload } from '@mui/icons-material';
import UploadButton from './UploadButton';

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
                                villageData.progressStatus.uploadInProgress &&
                                <LinearProgress />
                            }
                            {
                                !villageData.progressStatus.uploadInProgress && villageData.mappedPartyPeoplesKey !== ''
                                    ? <UploadButton
                                        IconName={Replay}
                                        onFileChange={null}
                                    >
                                        Re Upload
                                    </UploadButton>
                                    : <UploadButton
                                        IconName={Upload}
                                        onFileChange={handleVillageMembersCSVUpload}
                                    >
                                        Upload
                                    </UploadButton>
                            }
                        </Box>
                        <Box
                            display="flex"
                            flexDirection={'column'}
                            justifyContent='center'
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
