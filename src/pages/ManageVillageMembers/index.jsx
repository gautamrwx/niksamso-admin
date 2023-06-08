import { Box, Container, Drawer, Grid, IconButton, Input, Modal, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { Close, Email, PermIdentity, Search } from '@mui/icons-material';
import csv from 'csvtojson';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import { child, push, ref, update } from 'firebase/database';
import { db } from '../../misc/firebase';
import FullScreenMessageText from '../../components/FullScreenMessageText';
import VillageCard from './VillageCard';
import AssignedInchargeDrawer from './AssignedInchargeDrawer';
import EditVillageModal from './EditVillageModal';

const getFormattedDrawerProperty = (
    isDrawerOpen = false,
    villageName = null,
    inchargeEmail = null,
    inchargeName = null
) => ({ isDrawerOpen, villageName, inchargeEmail, inchargeName });

const getFormattedEditModalProperty = (
    isEditModalOpen = false,
    villageKey = null,
    villGroupKey = null,
    villageName = null
) => ({ isEditModalOpen, villageKey, villGroupKey, villageName });

function ManageVillageMembers(props) {
    const { users, villages } = useUsersAndVillages();

    const [selectedDDUser, setSelectedDDUser] = useState(null);
    const [villageList, setVillageList] = useState([]);
    const [filteredVillageList, setFilteredVillageList] = useState([]);
    const [isDataLoading, setIsDataLoading] = useState(false);
    const [searchBarInputText, setSearchBarInputText] = useState('');

    const [villageInchargeDrawer, setVillageInchargeDrawer] = useState(getFormattedDrawerProperty());
    const [editVillageModal, setEditVillageModal] = useState(getFormattedEditModalProperty());

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
        const fr = new FileReader();

        fr.onload = function () {
            csv({ noheader: true, output: "csv", })
                .fromString(fr.result)
                .then((inputCSVLines) => {
                    // 1. Check for validation 
                    const { isValidData, message } = verifyData(inputCSVLines, villageName);
                    if (!isValidData) {
                        setErrorMessage(selectedIndex, message);
                        toggleProgressIndicator(selectedIndex, 'UPLOAD', false);
                    }
                    // 1. Execute After Validation Successful  
                    else {
                        setErrorMessage(selectedIndex, '');
                        uploadData(inputCSVLines, villageKey, villGroupKey, selectedIndex);
                    }
                })
        }

        if (target.files.length > 0)
            fr.readAsText(target.files[0]);
    };

    const handleVillageMembersCSVReUpload = ({ target }, { villageKey, villGroupKey, villageName }, selectedIndex) => {
        debugger
    }

    const displayVillageIncharge = ({ villGroupKey, villageName }) => {
        const { fullName, email } = users.find(el => el.mappedVillGroupKey === villGroupKey);
        setVillageInchargeDrawer(getFormattedDrawerProperty(true, villageName, email, fullName));
    }

    const handleEditButtonPress = ({ villageKey, villGroupKey, villageName }) => {
        setEditVillageModal(
            getFormattedEditModalProperty(true, villageKey, villGroupKey, villageName)
        );
    }

    // ---- End | Helper Functions ---- //

    return (
        <>
            <CustomAppBar
                rightSideComponent="InchargeSelector"
                props={props}
                selectedDDUser={selectedDDUser}
                setSelectedDDUser={setSelectedDDUser}
            />

            <Box
                display="flex"
                justifyContent="flex-end"
                alignItems="flex-end"
            >
                <Input
                    sx={{ mr: 5, mb: 1, "&.Mui-focused .MuiIconButton-root": { color: 'primary.main' } }}
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

            {
                isDataLoading &&
                <FullScreenMessageText showLoader>
                    Loading
                </FullScreenMessageText>
            }
            {
                !isDataLoading && Array.from(filteredVillageList).length <= 0 &&
                <FullScreenMessageText >
                    No Data
                </FullScreenMessageText>
            }

            <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} columns={{ xs: 2, sm: 3, md: 4, lg: 5 }}>
                {Array.from(filteredVillageList).map((villageData, index) => (
                    <VillageCard
                        key={index}
                        villageData={villageData}
                        index={index}
                        handleVillageInchargeDisplay={() => { displayVillageIncharge(villageData) }}
                        handleEditButtonPress={() => { handleEditButtonPress(villageData) }}
                        handleVillageMembersCSVUpload={(event) => { handleVillageMembersCSVUpload(event, villageData, index) }}
                        handleVillageMembersCSVReUpload={(event) => { handleVillageMembersCSVReUpload(event, villageData, index) }}
                    />
                ))}
            </Grid >

            {/* Edit Modal*/}
            <EditVillageModal
                editVillageModal={editVillageModal}
                setEditVillageModal={setEditVillageModal}
                getFormattedEditModalProperty={getFormattedEditModalProperty}
            />

            {/* Assigned Incharge Display Drawer  */}
            <AssignedInchargeDrawer
                villageInchargeDrawer={villageInchargeDrawer}
                setVillageInchargeDrawer={setVillageInchargeDrawer}
            />
        </>
    );
}

export default ManageVillageMembers;
