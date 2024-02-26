const AWS = require('aws-sdk');
const fs = require('fs');
const config = require('../config/app.config');

// Configure AWS SDK
AWS.config.update({
    accessKeyId: atob(config.AWS_S3.accessKeyId),
    secretAccessKey: atob(config.AWS_S3.secretAccessKey),
    region: 'ap-south-1'
});

// Create an S3 instance
const s3 = new AWS.S3();

// Specify your bucket name and file path
const bucketName = 'vidassetsa';

exports.uploadS3Media = async function (filePath, newFileName, mimeType = "video/mp4") {
    let uploadPromise = new Promise((resolve, reject) => {
        if (config.AWS_S3.enabled) {
            // Read the video file
            const fileContent = fs.readFileSync(filePath);

            // Set the parameters for the S3 upload
            const params = {
                Bucket: bucketName,
                Key: newFileName, // The name you want to give to your file in the bucket
                Body: fileContent,
                ContentType: mimeType // Adjust the content type based on your video format
            };

            // Upload the video to S3
            s3.upload(params, (err, data) => {
                if (err) {
                    resolve();
                    console.error('Error uploading video:', err);
                } else {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            console.error(err);
                        }
                        console.log('public file removed');
                    });
                    resolve(data.Location);
                    console.log('Video uploaded successfully. S3 URL:', data.Location);
                }
            });
        }
        else {
            resolve();
        }

    })
    await uploadPromise;
};


exports.deleteS3Media = async function (filePath) {
    let uploadPromise = new Promise((resolve, reject) => {
        if (config.AWS_S3.enabled) {

            // Set the parameters
            const params = {
                Bucket: bucketName,
                Key: filePath,
            };

            s3.deleteObject(params, (err, data) => {
                if (err) {
                    resolve();
                    console.error('Error deleting video:', err);
                } else {
                    resolve(data);
                    console.log('Video deleted successfully:', data);
                }
            });
        }
        else {
            resolve();
        }

    })
    await uploadPromise;
};

