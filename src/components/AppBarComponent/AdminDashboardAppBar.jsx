import { AppBar, Autocomplete, Box, IconButton, Popper, Tab, Tabs, TextField, Toolbar } from '@mui/material';
import DehazeIcon from '@mui/icons-material/Dehaze';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import GroupIcon from '@mui/icons-material/Group';
import { useEffect, useState } from 'react';
import NavigationDrawer from './innterComponents/NavigationDrawer';
import UserProfileActionAvatar from './innterComponents/UserProfileActionAvatar';
import { useLocation } from 'react-router-dom';
import linkPageMappingHelper from '../../misc/linkPageMappingHelper';
import HeaderLogoAndText from './innterComponents/HeaderLogoAndText';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';

function DashboardAppBar({
    props,
    handleVillageSelectionChange,
    setIsVillageSelected,
    selectedTabBarIndex,
    setSelectedTabBarIndex }) {

    const { users, villages } = useUsersAndVillages();

    // Container Will Use in App Drawer
    const { window } = props;
    const container = window !== undefined ? () => window().document.body : undefined;

    const location = useLocation();

    const [isDrowerOpen, setIsDrawerOpen] = useState(false);
    const [linkPageMappings, setLinkPageMappings] = useState([]);
    const [currentPageName, setCurrentPageName] = useState(null);

    const [userDropdownListOption, setUserDropdownListOption] = useState([]);
    const [villageDropdownListOption, setVillageDropdownListOption] = useState([]);
    const [selectedDDUser, setSelectedDDUser] = useState(null);
    const [selectedDDVillage, setSelectedDDVillage] = useState(null);

    useEffect(() => {
        // Set Users Data in dropDown 
        // comst ff = selectedDDUser
        setUserDropdownListOption(users.map((option) => {
            const firstLetter = option.email[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        }));

        // Set Villages Data in Dropdown
        setVillageDropdownListOption(villages.map((option) => {
            const firstLetter = option.villageName[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        }));

    }, [users, villages]);

    const setVillListDropDown = (mappedVillGroupKey = null) => {
        const filteredVillages =
            mappedVillGroupKey
                ? villages.filter(x => x.villGroupKey === mappedVillGroupKey)
                : villages;

        const villDropdownListOption = filteredVillages.map((option) => {
            const firstLetter = option.villageName[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        })

        setVillageDropdownListOption(villDropdownListOption);

        // Select Last Selected Item
        if (selectedDDVillage) {
            const lastSelectedItemIndex = villDropdownListOption.findIndex(village => village.villageKey === selectedDDVillage.villageKey);

            if (lastSelectedItemIndex !== -1) {
                setSelectedDDVillage(villDropdownListOption[lastSelectedItemIndex]);
            } else {
                setSelectedDDVillage(null);
                handleVillageSelectionChange(null);
                setIsVillageSelected(false);
            }
        }
    }

    const onUserSelectionChange = (event, value, reason) => {
        switch (reason) {
            case 'clear':
                setSelectedDDUser(null);
                setVillListDropDown();
                break;
            case 'selectOption':
                setSelectedDDUser(value);
                setVillListDropDown(value.mappedVillGroupKey);
                break;
            default:
                break;
        }
    }

    const onVillageSelectionChange = (event, value, reason) => {
        switch (reason) {
            case 'selectOption':
                setSelectedDDVillage(value);
                handleVillageSelectionChange(value.mappedPartyPeoplesKey);
                setIsVillageSelected(true);
                break;
            default:
                break;
        }
    }

    // Set Page-Path Name and Link to help Navigation Bar 
    useEffect(() => {
        const currentPath = location.pathname;
        const linkAndPagesWithActiveStatus = linkPageMappingHelper(currentPath)
        setLinkPageMappings(linkAndPagesWithActiveStatus);

        const pageName = linkAndPagesWithActiveStatus.find(x => x.isLinkActive);
        setCurrentPageName(pageName.linkPageName);
    }, [location.pathname]);


    /**----- UI Component [Start]---- */
    const styles = (theme) => ({
        popper: {
            width: "fit-content"
        }
    });
    /**----- UI Component [END]---- */

    const PopperMy = function (props) {
        return <Popper {...props} style={styles.popper} placement="bottom-start" />;
    };

    return (
        <>
            <AppBar component="nav" sx={{ boxShadow: 'none' }}>
                <Toolbar>
                    {/* ==> App Drawer Toggle Button */}
                    <IconButton
                        color="inherit"
                        aria-label="open drawer"
                        edge="start"
                        onClick={() => { setIsDrawerOpen((prevState) => !prevState) }}
                        sx={{ mr: 1 }}
                    >
                        <DehazeIcon />
                    </IconButton>

                    <HeaderLogoAndText
                        isDashBoardAppBar='true'
                        currentPageName={currentPageName}
                    />

                    {/*Fill Empty Midddle Space*/}
                    <Box sx={{ flexGrow: 1 }}></Box>

                    {/* ==> User Selection DropDown  */}
                    <Box display='flex' flexDirection='row' sx={{ width: { xs: 1, sm: 6 / 11, md: 450, lg: 500 }, ml: 1 }}>
                        <Autocomplete
                            fullWidth
                            PopperComponent={PopperMy}
                            size='small'
                            className='selectItemOnAppBar'
                            blurOnSelect={true}
                            value={selectedDDUser}
                            onChange={onUserSelectionChange}
                            options={userDropdownListOption.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                            groupBy={(option) => option.firstLetter}
                            getOptionLabel={(option) => option.email}
                            renderInput={(params) => <TextField {...params} label="Incharge" />}
                        />

                        <Autocomplete
                            fullWidth
                            size='small'
                            PopperComponent={PopperMy}
                            sx={{ ml: 1 }}
                            className='selectItemOnAppBar'
                            value={selectedDDVillage}
                            disableClearable
                            onChange={onVillageSelectionChange}
                            options={villageDropdownListOption.sort((a, b) => -b.firstLetter.localeCompare(a.firstLetter))}
                            groupBy={(option) => option.firstLetter}
                            getOptionLabel={(option) => option.villageName}
                            renderInput={(params) => <TextField {...params} label="Villages" />}
                        />
                    </Box >

                    {/* ==> User Profile Avatar  */}
                    <UserProfileActionAvatar />
                </Toolbar>

                {/* Next Line  */}
                {/* Party Members Tab Bar  */}
                <Box sx={{ background: 'white' }}>
                    <Tabs
                        value={selectedTabBarIndex}
                        onChange={(event, newValue) => {
                            setSelectedTabBarIndex(newValue);
                        }}
                        aria-label="basic tabs example">
                        <Tab icon={<ContactPhoneIcon />} iconPosition="start" label="Party Members" />
                        <Tab icon={<GroupIcon />} iconPosition="start" label="General Members" />
                    </Tabs>
                </Box>
            </AppBar >

            <Box component={Toolbar} p={0} height={135} />

            {/* Navigation Drawer  */}
            <NavigationDrawer
                linkPageMappings={linkPageMappings}
                setIsDrawerOpen={setIsDrawerOpen}
                isDrowerOpen={isDrowerOpen}
                container={container} />
        </>
    )
}

export default DashboardAppBar;