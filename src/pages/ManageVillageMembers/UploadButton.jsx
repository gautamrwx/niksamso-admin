import { Button, Typography } from "@mui/material";

export default function UploadButton({
    IconName,
    onFileChange,
    children
}) {
    return (
        <Button size="small" variant="outlined" component="label">
            <IconName />
            <Typography fontSize={14} p={0} ml={{ xs: 0, md:2  }} display={{ xs: 'none', sm: 'flex' }}>{children}</Typography>
            <input
                onChange={onFileChange}
                type="file"
                accept=".csv"
                hidden
            />
        </Button>
    );
}