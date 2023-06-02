const linkPageMappingHelper = (currentPagePath) => {
    const linkPageMapiings = [
        {
            linkPath: "/",
            linkPageName: "Dashboard",
            isLinkActive: false,
            visibleInNavBar: true
        },
        {
            linkPath: "/UploadNewUsers",
            linkPageName: "Upload New Users",
            isLinkActive: false,
            visibleInNavBar: true
        },
        {
            linkPath: "/UploadVillageInformation",
            linkPageName: "Upload Village Info",
            isLinkActive: false,
            visibleInNavBar: true
        },
        {
            linkPath: "/MyAccount",
            linkPageName: "My Account",
            isLinkActive: false,
            visibleInNavBar: false
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