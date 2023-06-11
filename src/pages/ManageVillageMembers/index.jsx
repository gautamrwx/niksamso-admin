import { Box, Grid, IconButton, Input } from '@mui/material';
import { useEffect, useState } from 'react';
import { Close, Search } from '@mui/icons-material';
import csv from 'csvtojson';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';
import CustomAppBar from '../../components/AppBarComponent/CustomAppBar';
import { child, push, ref, update } from 'firebase/database';
import { db } from '../../misc/firebase';
import FullScreenMessageText from '../../components/FullScreenMessageText';
import VillageCard from './VillageCard';
import AssignedInchargeDrawer from './AssignedInchargeDrawer';
import EditVillageModal from './EditVillageModal';
import { deleteObject, getDownloadURL, getStorage, listAll, ref as StorageRef } from 'firebase/storage'

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
    villageName = null,
    index = null
) => ({ isEditModalOpen, villageKey, villGroupKey, villageName, index });

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
                errorMessage: null,
                progressStatus: false,
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

    const toggleProgressIndicator = (index, condition) => {
        setFilteredVillageList((prevArray) => {
            prevArray[index].progressStatus = condition;
            return [...prevArray]
        });
    }

    const setErrorMessage = (index, errorMessage = null) => {
        setFilteredVillageList((prevArray) => {
            prevArray[index].errorMessage = errorMessage;
            return [...prevArray];
        });
    }

    // ---- Start | Firebase Business Logic ---- //  
    const uploadData = async (inputCSVLines, villageKey, villGroupKey, selectedIndex, isReupload) => {
        toggleProgressIndicator(selectedIndex, true);

        const peopleInformation = getPreapredData(inputCSVLines);
        const updates = {};
        // If data is reUploading , Fetch old profile Pic URL and set
        if (isReupload) {
            const totalPartyMembers = peopleInformation.partyMembers.length;

            const storage = getStorage();
            const listRef = StorageRef(storage, `/ProfilePictures/VillagePartyMembers/${villageKey}`);
            const isFilesReAssigned = await new Promise((resolve, _) => {
                // Get All Old Profile Pic Of Uploaded Village and assign to new
                listAll(listRef).then(async ({ items }) => {
                    const deletePromise = [];

                    for (let i = 0; i < items.length; i++) {
                        const itemRef = items[i];
                        const fileName = (itemRef.fullPath).split('/').at(-1);

                        const fileIndex = Number(fileName.split('_')[0]);
                        const fileSuffix = fileName.split('_')[1].split('.')[0];

                        if (fileIndex < totalPartyMembers) {
                            const downloadUrl = await getDownloadURL(StorageRef(storage, itemRef));
                            peopleInformation.partyMembers[fileIndex][fileSuffix] = downloadUrl;
                        }
                        else {
                            deletePromise.push(deleteObject(itemRef));
                        }
                    }

                    // delete Extra files
                    Promise.all(deletePromise).then(() => {
                        resolve(true);
                    }).catch(() => {
                        resolve(false)
                    })
                }).catch((e) => {
                    resolve(false);
                })
            });

            if (!isFilesReAssigned) {
                setErrorMessage(selectedIndex, 'Failed to delete existing files');
                return;
            }

            // Update existing member Data
            const mappedPartyPeoplesKey = villages.find(el => el.villageKey === villageKey).mappedPartyPeoplesKey;
            updates['/partyPeoples/' + mappedPartyPeoplesKey] = peopleInformation;
        }
        else {
            // Create new member Data
            const newPartyPeopleKey = push(child(ref(db), 'partyPeoples')).key;
            updates['/partyPeoples/' + newPartyPeopleKey] = peopleInformation;
            updates['/villageGroupList/' + villGroupKey + '/' + villageKey + '/mappedPartyPeoplesKey'] = newPartyPeopleKey;
        }

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            // On Update new Data Progress indicator will be auto set
            // On Create new Data stop progress indicator
            isReupload && toggleProgressIndicator(selectedIndex, false);
        }).catch((error) => {
            toggleProgressIndicator(selectedIndex, false);
            setErrorMessage(selectedIndex, 'Failed to update database');
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

        const partyMembersJsonArr = jsonArr.filter(x => x[1] !== 'Members' && x[1] !== '' && x[2] !== '');
        const generalMembersJsonArr = jsonArr.filter(x => x[1] === 'Members' && x[2] !== '');

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

    const handleVillageMembersCSVUpload = ({ target }, { villageKey, villGroupKey, villageName }, selectedIndex, isReupload = false) => {
        const fr = new FileReader();

        fr.onload = function () {
            csv({ noheader: true, output: "csv", })
                .fromString(fr.result)
                .then((inputCSVLines) => {
                    // 1. Check for validation 
                    const { isValidData, message } = verifyData(inputCSVLines, villageName);
                    if (!isValidData) {
                        setErrorMessage(selectedIndex, message);
                        toggleProgressIndicator(selectedIndex, false);
                    }
                    // 1. Execute After Validation Successful  
                    else {
                        setErrorMessage(selectedIndex, '');
                        uploadData(inputCSVLines, villageKey, villGroupKey, selectedIndex, isReupload);
                    }
                })
        }

        if (target.files.length > 0)
            fr.readAsText(target.files[0]);
    };

    const displayVillageIncharge = ({ villGroupKey, villageName }) => {
        const { fullName, email } = users.find(el => el.mappedVillGroupKey === villGroupKey);
        setVillageInchargeDrawer(getFormattedDrawerProperty(true, villageName, email, fullName));
    }

    const handleDeleteVillageMembers = async (villageKey, selectedIndex) => {
        toggleProgressIndicator(selectedIndex, true);

        // Get Mapped Party People Key For Selected Village
        const { mappedPartyPeoplesKey, villGroupKey } = villages.find(x => x.villageKey === villageKey);

        // Delete All Images of Village
        const storage = getStorage();
        const listRef = StorageRef(storage, `/ProfilePictures/VillagePartyMembers/${villageKey}`);

        const isDeletedMembersProfilePic = await new Promise((resolve, _) => {
            listAll(listRef).then(({ items }) => {
                const totalFiles = items.length;
                let deletedFiles = 0;

                if (totalFiles === 0) {
                    resolve(true);
                    return;
                }

                items.forEach((item) => {
                    deleteObject(item).then(() => {
                        ++deletedFiles === totalFiles && resolve(true);
                    }).catch((error) => {
                        resolve(false);
                    });
                });
            }).catch((e) => {
                resolve(false)
            })
        })

        if (!isDeletedMembersProfilePic) {
            setErrorMessage(selectedIndex, 'Failed Delete Profile Photos');
            return;
        }

        const updates = {};
        mappedPartyPeoplesKey && (updates['/partyPeoples/' + mappedPartyPeoplesKey] = null);
        updates['/villageGroupList/' + villGroupKey + '/' + villageKey + '/mappedPartyPeoplesKey'] = "";

        // <==== | Update All Data In Single Shot | ====>
        update(ref(db), updates).then(x => {
            toggleProgressIndicator(selectedIndex, false);
        }).catch((error) => {
            toggleProgressIndicator(selectedIndex, false);
            setErrorMessage(selectedIndex, 'Failed To Erase Data , Please Try Again Later.');
        });
    }

    const handleEditButtonPress = ({ villageKey, villGroupKey, villageName }, index) => {
        setEditVillageModal(
            getFormattedEditModalProperty(true, villageKey, villGroupKey, villageName, index)
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
                        handleEditButtonPress={() => { handleEditButtonPress(villageData, index) }}
                        handleVillageMembersCSVUpload={(event) => { handleVillageMembersCSVUpload(event, villageData, index) }}
                        handleVillageMembersCSVReUpload={(event) => { handleVillageMembersCSVUpload(event, villageData, index, true) }}
                    />
                ))}
            </Grid >

            {/* Edit Modal*/}
            <EditVillageModal
                editVillageModal={editVillageModal}
                setEditVillageModal={setEditVillageModal}
                getFormattedEditModalProperty={getFormattedEditModalProperty}
                handleDeleteVillageMembers={handleDeleteVillageMembers}
                toggleProgressIndicator={toggleProgressIndicator}
                setErrorMessage={setErrorMessage}
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
