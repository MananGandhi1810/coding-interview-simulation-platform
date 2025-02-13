import {
    generateUploadButton,
    generateUploadDropzone,
} from "@uploadthing/react";

const UploadResumeDropzone = generateUploadDropzone({
    url: `${process.env.SERVER_URL}/interview/upload-resume`,
});

export { UploadResumeDropzone };
