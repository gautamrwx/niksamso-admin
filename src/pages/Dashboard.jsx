import { Box, Card, CardActions, CardContent, CircularProgress, Grid, Button, Typography } from '@mui/material';
import SimpleAppBar from '../components/AppBarComponent/SimpleAppBar';
import { useProfile } from '../context/profile.context';
import { useEffect, useState } from 'react';
import { child, get, push, ref, update } from 'firebase/database';
import { db } from '../misc/firebase';
import { Delete } from '@mui/icons-material';
import csv from 'csvtojson';
function Dashboard(props) {
    const { profile } = useProfile();

    const [nonRegisteredUserList, setNonRegisteredUserList] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);

    const toggleProgressIndicator = (selectedIndex, progressType, condition) => {
        setNonRegisteredUserList((prevArray) => {
            switch (progressType) {
                case 'DELETE':
                    prevArray[selectedIndex].progressStatus.deleteInProgress = condition;
                    break;
                default:
                    break;
            }
            return [...prevArray]
        });
    }

    const showErrorMessage = (selectedIndex, errMessage) => {
        setNonRegisteredUserList((prevArray) => {
            prevArray[selectedIndex].errorMessage = errMessage;
            return [...prevArray]
        });
    }

    const removeStoredNrUser = (selectedIndex) => {
        setNonRegisteredUserList((prevArray) => {
            prevArray.splice(selectedIndex, 1);
            return [...prevArray]
        });
    }

    // ---- Start | Firebase Business Logic ---- //
    useEffect(() => {
        setIsDataLoading(true);
        // Fetch 
        (function () {
            get(child(ref(db), 'nonRegistedUsers/')).then((snapshot) => {
                setIsDataLoading(false);
                const nonRegisteredUsersObj = snapshot.val();

                if (nonRegisteredUsersObj) {
                    // Convert JsonList Into Array
                    const nonRegisteredUsersList = [];
                    Object.keys(nonRegisteredUsersObj).forEach(function (key) {
                        nonRegisteredUsersList.push({
                            emailHash: key,
                            maskedEmail: nonRegisteredUsersObj[key].maskedEmail,
                            assignedVillages: nonRegisteredUsersObj[key].assignedVillages,
                            progressStatus: { deleteInProgress: false },
                            errorMessage: ''
                        });
                    });

                    // Set Array data in DropDown Input
                    setNonRegisteredUserList(nonRegisteredUsersList);
                }
            }).catch((error) => { setIsDataLoading(false) });
        })();
    }, []);

    const handleDeleteCurrentUser = (nrUserData, selectedIndex) => {
        toggleProgressIndicator(selectedIndex, 'DELETE', true);

        // Start Delete Operation
        const updates = {}

        updates['/nonRegistedUsers/' + nrUserData.emailHash] = null;

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            // Delete item from list
            removeStoredNrUser(selectedIndex);
        }).catch((error) => {
            toggleProgressIndicator(selectedIndex, 'DELETE', false);
            showErrorMessage(selectedIndex, 'Failed To Delete, Please Try Again');
        });
    }

    // ---- End | Firebase Business Logic ---- //


    return (
        <>
            <SimpleAppBar props={props} />

            {isDataLoading && <Box
                display="grid"
                justifyContent="center"
                alignItems="center"
                minWidth="100%"
                minHeight="60vh"
            >
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </Box>
                    <Typography
                        fontWeight='bold'
                        fontFamily={"sans-serif"}
                        color='#686868'
                    >
                        Loading
                    </Typography>
                </Box>
            </Box>}

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
                {Array.from(nonRegisteredUserList).map((nrUserData, index) => (
                    <Grid item xs={1} sm={1} md={1} lg={1} key={index}>
                        <Card sx={{ minHeight: 120 }}>
                            <CardContent >
                                <Box display={"flex"}>
                                    <Typography color={'#415468'} fontWeight='bold'>
                                        {nrUserData.maskedEmail}
                                    </Typography>
                                </Box>
                                <Box height='2rem'>
                                    <Typography sx={{ color: '#d81f10', fontSize: 13 }}>
                                        {nrUserData.errorMessage}
                                    </Typography>
                                </Box>
                            </CardContent>
                            <CardActions>
                                <Box
                                    height='2.5rem'
                                    display="flex"
                                    flex='1'
                                    alignContent={'center'}
                                    justifyContent={'center'}
                                >

                                    {
                                        nrUserData.progressStatus.deleteInProgress
                                            ? <CircularProgress color="error" />
                                            : <Button
                                                fullWidth
                                                color='error'
                                                type="button"
                                                variant="outlined"
                                                onClick={() => handleDeleteCurrentUser(nrUserData, index)}
                                            >
                                                <Delete /> <Typography display={{ xs: 'none', sm: 'block' }} >Delete</Typography>
                                            </Button>
                                    }
                                </Box>

                            </CardActions>
                        </Card >
                    </Grid>
                ))
                }
            </Grid >
        </>
    );
}

export default Dashboard;
