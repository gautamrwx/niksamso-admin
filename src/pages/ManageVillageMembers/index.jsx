import { Box, Button, Card, CardActions, CardContent, CircularProgress, Grid, IconButton, Input, LinearProgress, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Close, Delete, Search, Upload } from '@mui/icons-material';
import csv from 'csvtojson';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import { child, push, ref, update } from 'firebase/database';
import { db } from '../../misc/firebase';

function ManageVillageMembers(props) {
    const { villages } = useUsersAndVillages();

    const [selectedDDUser, setSelectedDDUser] = useState(null);
    const [villageList, setVillageList] = useState([]);
    const [filteredVillageList, setFilteredVillageList] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [searchBarInputText, setSearchBarInputText] = useState('');

    const assignFilteredVillageListData = (searchQuery = null) => {
        const tempVillList = [];

        const arrFilteredVillages = searchQuery || searchQuery === ''
            ? villageList.filter(x => x.villageName.toLowerCase().includes(searchQuery.toLowerCase()))
            : villageList

        // Assign data in proper structure
        arrFilteredVillages.forEach(({ villageKey, mappedPartyPeoplesKey, villGroupKey, villageName }) => {
            tempVillList.push({
                villageKey,
                villGroupKey,
                villageName,
                mappedPartyPeoplesKey,
                'errorMessage': null,
                'progressStatus': {
                    deleteInProgress: false,
                    uploadInProgress: false
                }
            });
        });

        // Short By Name
        tempVillList.sort((a, b) => {
            return (function (a, b) {
                a = a.toLowerCase();
                b = b.toLowerCase();
                return (a < b) ? -1 : (a > b) ? 1 : 0;
            })(a.villageName, b.villageName);
        });

        setFilteredVillageList(tempVillList);
    }

    useEffect(() => {
        setSearchBarInputText('');
        assignFilteredVillageListData();
        // eslint-disable-next-line
    }, [villageList])

    useEffect(() => {
        setIsDataLoading(true);

        setVillageList(
            selectedDDUser
                ? villages.filter(x => x.villGroupKey === selectedDDUser.mappedVillGroupKey)
                : villages
        );

        setIsDataLoading(false);
    }, [selectedDDUser, villages]);


    //  -- [start] Search Operation Handling --
    const handleSearchBarInputChange = (event) => {
        const inputSearchText = event.target.value;
        setSearchBarInputText(inputSearchText);

        // Apply Search in Filtered Data
        assignFilteredVillageListData(inputSearchText);
    }

    const clearSearchInput = () => {
        setSearchBarInputText('');

        // Reset Listed VillageData
        assignFilteredVillageListData();
    }
    //  -- [End] Search Operation Handling --

    const toggleProgressIndicator = (index, progressType, condition) => {
        setFilteredVillageList((prevArray) => {
            switch (progressType) {
                case 'UPLOAD':
                    prevArray[index].progressStatus.uploadInProgress = condition;
                    break;
                case 'DELETE':
                    prevArray[index].progressStatus.deleteInProgress = condition;
                    break;
                default:
                    break;
            }
            return [...prevArray]
        });
    }

    const resetVillagePeopleMapping = (index, condition) => {
        setFilteredVillageList((prevArray) => {
            prevArray[index].mappedPartyPeoplesKey = condition;
            return [...prevArray];
        });
    }

    const setErrorMessage = (index, errorMessage = null) => {
        setFilteredVillageList((prevArray) => {
            prevArray[index].errorMessage = errorMessage;
            return [...prevArray];
        });
    }

    // ---- Start | Firebase Business Logic ---- //  
    const uploadData = (jsonArr, villageKey, villGroupKey, selectedIndex) => {
        const peopleInformation = getPreapredData(jsonArr);

        const updates = {};
        const newPartyPeopleKey = push(child(ref(db), 'partyPeoples')).key;
        updates['/partyPeoples/' + newPartyPeopleKey] = peopleInformation;
        updates['/villageGroupList/' + villGroupKey + '/' + villageKey + '/mappedPartyPeoplesKey'] = newPartyPeopleKey;

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            resetVillagePeopleMapping(selectedIndex, newPartyPeopleKey)
            toggleProgressIndicator(selectedIndex, 'UPLOAD', false);
        }).catch((error) => {
            toggleProgressIndicator(selectedIndex, 'UPLOAD', false);
        });
    }

    const handleDeleteVillageMembers = ({ villageKey, villGroupKey, mappedPartyPeoplesKey }, selectedIndex) => {
        toggleProgressIndicator(selectedIndex, 'DELETE', true);

        const updates = {};
        updates['/partyPeoples/' + mappedPartyPeoplesKey] = null;
        updates['/villageGroupList/' + villGroupKey + '/' + villageKey + '/mappedPartyPeoplesKey'] = '';

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            resetVillagePeopleMapping(selectedIndex, '')
            toggleProgressIndicator(selectedIndex, 'DELETE', false);
        }).catch((error) => {
            toggleProgressIndicator(selectedIndex, 'DELETE', false);
        });
    }
    // ---- End | Firebase Business Logic ---- //

    // ---- Start | Helper Functions ---- //
    const verifyData = (jsonArr, villageName) => {
        const verificationStatus = {
            isValidData: true,
            message: null
        }

        if (jsonArr.length <= 1) {
            // Check Number of Rows
            verificationStatus.isValidData = false;
            verificationStatus.message = 'Uploaded CSV Does not Have Data';
        } else if (jsonArr[0].length !== 10) {
            // Check Number of Columns
            verificationStatus.isValidData = false;
            verificationStatus.message = 'Uploaded CSV File Must Have 10 Column';
        } else if (String(jsonArr[1][0]).toUpperCase() !== String(villageName).toUpperCase()) {
            // Match Village Name with CSV Village Name
            verificationStatus.isValidData = false;
            verificationStatus.message = 'Village Name Not Matching For Uploaed CSV ';
        }

        return verificationStatus;
    }

    const getPreapredData = (jsonArr) => {
        const arrPartyMem = [];
        const arrGenMem = [];

        jsonArr = jsonArr.slice(1); // Delete First Index

        const partyMembersJsonArr = jsonArr.filter(x => x[1] !== 'Members');
        const generalMembersJsonArr = jsonArr.filter(x => x[1] === 'Members');

        partyMembersJsonArr.forEach(x => {
            arrPartyMem.push({
                post: x[1],
                fullName: x[2],
                age: x[3],
                mobileNumber: [x[4], x[5], x[6], x[7], x[8]],
                youthGeneral: x[9]
            })
        });

        generalMembersJsonArr.forEach(x => {
            arrGenMem.push({
                fullName: x[2],
                age: x[3],
                mobileNumber: [x[4], x[5], x[6], x[7], x[8]],
                youthGeneral: x[9]
            })
        })

        return {
            partyMembers: arrPartyMem,
            generalMembers: arrGenMem
        }
    }

    const handleVillageMembersCSVUpload = ({ target }, { villageKey, villGroupKey, villageName }, selectedIndex) => {
        toggleProgressIndicator(selectedIndex, 'UPLOAD', true);

        const fr = new FileReader();

        fr.onload = function () {
            csv({
                noheader: true,
                output: "csv",
            })
                .fromString(fr.result)
                .then((csvRows) => {
                    const { isValidData, message } = verifyData(csvRows, villageName);
                    if (!isValidData) {
                        setErrorMessage(selectedIndex, message);
                        toggleProgressIndicator(selectedIndex, 'UPLOAD', false);
                    } else {
                        setErrorMessage(selectedIndex, '');
                        uploadData(csvRows, villageKey, villGroupKey, selectedIndex);
                    }
                });
        };

        fr.readAsText(target.files[0]);
    };
    // ---- End | Helper Functions ---- //

    return (
        <>
            <CustomAppBar
                rightSideComponent="InchargeSelector"
                props={props}
                selectedDDUser={selectedDDUser}
                setSelectedDDUser={setSelectedDDUser}
            />

            {
                isDataLoading && <Box
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
                </Box>
            }

            <Box
                display="flex"
                justifyContent="flex-end"
                alignItems="flex-end"
            >
                <Input
                    sx={{ mr: 10, mb: 1, "&.Mui-focused .MuiIconButton-root": { color: 'primary.main' } }}
                    placeholder='Search'
                    value={searchBarInputText}
                    onChange={handleSearchBarInputChange}
                    endAdornment={
                        <>
                            <IconButton
                                sx={{ visibility: searchBarInputText.length > 0 ? "visible" : "hidden" }}
                                onClick={clearSearchInput}
                            >
                                <Close />
                            </IconButton>
                            <Search />
                        </>
                    }
                />
            </Box>

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
                {Array.from(filteredVillageList).map((villageData, index) => (
                    <Grid item xs={1} sm={1} md={1} lg={1} key={index}>
                        <Card sx={{ minHeight: 120 }}>
                            <CardContent >
                                <Box display={"flex"}>
                                    <Typography color={'#415468'} fontWeight='bold'>
                                        {villageData.villageName}
                                    </Typography>
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
                                                        onChange={(event) => handleVillageMembersCSVUpload(event, villageData, index)}
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
                                                    onClick={() => handleDeleteVillageMembers(villageData, index)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                        }
                                    </Box>
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

export default ManageVillageMembers;
