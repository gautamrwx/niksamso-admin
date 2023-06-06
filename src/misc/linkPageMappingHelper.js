import { GroupAdd, Home, People, PersonSearch } from "@mui/icons-material";

const linkPageMappingHelper = (currentPagePath) => {
    const linkPageMapiings = [
        {
            linkPath: "/",
            linkPageName: "Dashboard",
            isLinkActive: false,
            visibleInNavBar: true,
            drawerIcon:Home
        },
        {
            linkPath: "/CreateIncharges",
            linkPageName: "Create Incharges",
            isLinkActive: false,
            visibleInNavBar: true,
            drawerIcon:GroupAdd
        },
        {
            linkPath: "/ManageVillageMembers",
            linkPageName: "Manage Village Members",
            isLinkActive: false,
            visibleInNavBar: true,
            drawerIcon:People
        },
        {
            linkPath: "/ManageIncharges",
            linkPageName: "Manage Incharges",
            isLinkActive: false,
            visibleInNavBar: true,
            drawerIcon:PersonSearch
        },
        {
            linkPath: "/MyAccount",
            linkPageName: "My Account",
            isLinkActive: false,
            visibleInNavBar: false,
            drawerIcon:Home
        }
    ];

    // Set Current Page As Active Page
    linkPageMapiings.forEach((linkObject) => {
        if (linkObject.linkPath === currentPagePath) {
            linkObject.isLinkActive = true;
        }
    });

    return linkPageMapiings;
}

export default linkPageMappingHelper;