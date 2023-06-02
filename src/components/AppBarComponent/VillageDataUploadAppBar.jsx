import { AppBar, Autocomplete, Box, IconButton, Popper, TextField, Toolbar } from '@mui/material';
import DehazeIcon from '@mui/icons-material/Dehaze';
import { useEffect, useState } from 'react';
import NavigationDrawer from './innterComponents/NavigationDrawer';
import UserProfileActionAvatar from './innterComponents/UserProfileActionAvatar';
import { useLocation } from 'react-router-dom';
import linkPageMappingHelper from '../../misc/linkPageMappingHelper';
import HeaderLogoAndText from './innterComponents/HeaderLogoAndText';
import { useUsersAndVillages } from '../../context/usersAndVillages.context';

function VillageDataUploadAppBar({
    props,
    selectedDDUser,
    setSelectedDDUser
}) {

    const { users } = useUsersAndVillages();

    // Container Will Use in App Drawer
    const { window } = props;
    const container = window !== undefined ? () => window().document.body : undefined;

    const [isDrowerOpen, setIsDrawerOpen] = useState(false);
    const [linkPageMappings, setLinkPageMappings] = useState([]);
    const [currentPageName, setCurrentPageName] = useState(null);

    const location = useLocation();

    // Set Page-Path Name and Link to help Navigation Bar 
    useEffect(() => {
        const currentPath = location.pathname;
        const linkAndPagesWithActiveStatus = linkPageMappingHelper(currentPath)
        setLinkPageMappings(linkAndPagesWithActiveStatus);

        const pageName = linkAndPagesWithActiveStatus.find(x => x.isLinkActive);
        setCurrentPageName(pageName.linkPageName);
    }, [location.pathname]);


    // User Dropdown Data Configuration
    const [userDropdownListOption, setUserDropdownListOption] = useState([]);

    useEffect(() => {
        // Set Users Data in dropDown 
        setUserDropdownListOption(users.map((option) => {
            const firstLetter = option.email[0].toUpperCase();
            return {
                firstLetter: /[0-9]/.test(firstLetter) ? '0-9' : firstLetter,
                ...option,
            };
        }));

    }, [users]);

    const onUserSelectionChange = (event, value, reason) => {
        switch (reason) {
            case 'clear':
                setSelectedDDUser(null);
                break;
            case 'selectOption':
                setSelectedDDUser(value);
                break;
            default:
                break;
        }
    }

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
                    <Box display='flex' flexDirection='row' sx={{ width: { xs: 1, sm: 2 / 5, md: 300, lg: 350 }, ml: 1 }}>
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
                    </Box >

                    {/* ==> User Profile Avatar  */}
                    <UserProfileActionAvatar />
                </Toolbar>
            </AppBar >

            <Toolbar />

            {/* Navigation Drawer  */}
            <NavigationDrawer
                linkPageMappings={linkPageMappings}
                setIsDrawerOpen={setIsDrawerOpen}
                isDrowerOpen={isDrowerOpen}
                container={container} />
        </>
    )
}

export default VillageDataUploadAppBar;